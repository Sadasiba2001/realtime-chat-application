import logging
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from video_calling.services import VideoCallService, VideoCallStateService

logger = logging.getLogger(__name__)


class VideoCallConsumer(AsyncJsonWebsocketConsumer):
    """
    Dedicated WebSocket consumer for video calling signaling (/ws/video/).
    Requires authenticated user in scope.
    """

    async def connect(self):
        self.user = self.scope.get("user")
        if not self.user or self.user.is_anonymous or not self.user.is_authenticated:
            logger.warning("[VideoCallConsumer] Rejecting unauthenticated connection.")
            await self.close(code=4001)
            return

        self.user_group = f"user_{self.user.id}"
        await self.channel_layer.group_add(self.user_group, self.channel_name)
        await self.accept()

        await self.send_json({
            "type": "video_connection",
            "message": "Connected to video calling signaling.",
            "user_id": self.user.id,
        })
        logger.info(f"[VideoCallConsumer] User {self.user.id} connected to /ws/video/.")

    async def disconnect(self, close_code):
        if hasattr(self, "user") and self.user and self.user.is_authenticated:
            # End active call if abruptly disconnected
            ended_call_id = VideoCallStateService.cleanup_user_calls(self.user.id)
            if ended_call_id:
                logger.info(f"[VideoCallConsumer] Cleaned up active call {ended_call_id} for disconnecting user {self.user.id}.")

            if hasattr(self, "user_group"):
                await self.channel_layer.group_discard(self.user_group, self.channel_name)

        logger.info(f"[VideoCallConsumer] Connection closed with code {close_code}.")

    async def receive_json(self, content, **kwargs):
        if not self.user or not self.user.is_authenticated:
            await self.send_json({
                "type": "error",
                "code": "UNAUTHORIZED",
                "message": "Authentication required.",
            })
            await self.close(code=4001)
            return

        if not isinstance(content, dict):
            await self.send_json({
                "type": "error",
                "code": "INVALID_PAYLOAD",
                "message": "Payload must be a JSON object.",
            })
            return

        await VideoCallService.handle_signaling_event(self, content)

    async def video_call_event(self, event):
        """
        Channel layer event handler for group sends.
        """
        await self.send_json(event.get("data", {}))
