from channels.generic.websocket import AsyncJsonWebsocketConsumer
from voice_calling.services import VoiceCallService, CallStateService, CallState


class VoiceCallConsumer(AsyncJsonWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.user = None
        self.user_group = None

    async def connect(self):
        self.user = self.scope.get("user")

        if not self.user or self.user.is_anonymous or not self.user.is_authenticated:
            await self.close(code=4001)
            return

        self.user_group = f"user_{self.user.id}"
        await self.channel_layer.group_add(self.user_group, self.channel_name)

        subprotocols = self.scope.get("subprotocols", [])
        selected_subprotocol = "access_token" if "access_token" in subprotocols else None

        await self.accept(subprotocol=selected_subprotocol)
        await self.send_json({
            "type": "connection",
            "message": "Connected to voice signaling service.",
            "user_id": self.user.id,
        })

    async def disconnect(self, close_code):
        if self.user_group:
            await self.channel_layer.group_discard(self.user_group, self.channel_name)

        # Cleanup any active call user was in
        if self.user and self.user.is_authenticated:
            active_call_id = CallStateService.get_user_active_call_id(self.user.id)
            if active_call_id:
                call = CallStateService.get_call(active_call_id)
                if call and call.get("state") in CallState.ACTIVE_STATES:
                    CallStateService.terminate_call(active_call_id, CallState.ENDED)
                    caller_id = call.get("caller_id")
                    receiver_id = call.get("receiver_id")
                    counterparty_id = receiver_id if self.user.id == caller_id else caller_id
                    if counterparty_id:
                        await self.channel_layer.group_send(
                            f"user_{counterparty_id}",
                            {
                                "type": "voice.call.event",
                                "data": {
                                    "type": "call_end",
                                    "call_id": active_call_id,
                                    "ended_by": self.user.id,
                                }
                            }
                        )

    async def receive_json(self, content, **kwargs):
        if not self.user or self.user.is_anonymous or not self.user.is_authenticated:
            await self.send_json({
                "type": "error",
                "code": "UNAUTHORIZED",
                "message": "Authentication is required.",
            })
            await self.close(code=4001)
            return

        await VoiceCallService.handle_signaling_event(self, content)

    async def voice_call_event(self, event: dict):
        """
        Handler for channel layer broadcasts to user_{user_id}.
        """
        await self.send_json(event["data"])
