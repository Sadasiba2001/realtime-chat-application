from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from chatting_service.services import MessageService


class ChatConsumer(AsyncJsonWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.message_service = MessageService()
        self.user = None
        self.target_user_id = None
        self.group_name = None

    async def connect(self):
        self.user = self.scope.get("user")

        # 1. Authentication check
        if not self.user or self.user.is_anonymous or not self.user.is_authenticated:
            await self.close(code=4001)
            return

        # 2. Extract target user id from URL kwargs
        try:
            target_id_param = self.scope.get("url_route", {}).get("kwargs", {}).get("user_id")
            self.target_user_id = int(target_id_param)
        except (TypeError, ValueError):
            await self.close(code=4000)
            return

        # 3. Validate target user (cannot be self, must exist and be active)
        try:
            await database_sync_to_async(self.message_service.validate_target_user)(
                target_user_id=self.target_user_id,
                authenticated_user_id=self.user.id,
            )
        except ValueError:
            await self.close(code=4004)
            return

        # 4. Compute deterministic group name: chat_<min_id>_<max_id>
        smaller_id = min(self.user.id, self.target_user_id)
        larger_id = max(self.user.id, self.target_user_id)
        self.group_name = f"chat_{smaller_id}_{larger_id}"

        # 5. Join private conversation group
        await self.channel_layer.group_add(self.group_name, self.channel_name)

        # 6. Accept WebSocket connection
        await self.accept()

        # 7. Send connection event
        await self.send_json({
            "type": "connection",
            "message": "Connected successfully.",
        })

    async def disconnect(self, close_code):
        if self.group_name:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        if not isinstance(content, dict):
            await self.send_json({
                "type": "error",
                "code": "INVALID_MESSAGE",
                "message": "Payload must be a JSON object.",
            })
            return

        msg_type = content.get("type")

        if msg_type == "message":
            await self.handle_message(content)
        elif msg_type == "history":
            await self.handle_history(content)
        else:
            await self.send_json({
                "type": "error",
                "code": "UNSUPPORTED_MESSAGE_TYPE",
                "message": f"Unsupported message type '{msg_type}'.",
            })

    async def handle_message(self, content: dict):
        raw_content = content.get("content")
        if not isinstance(raw_content, str) or not raw_content.strip():
            await self.send_json({
                "type": "error",
                "code": "INVALID_MESSAGE",
                "message": "Message content is required.",
            })
            return

        try:
            message_data = await database_sync_to_async(self.message_service.send_message)(
                sender=self.user,
                receiver_id=self.target_user_id,
                content=raw_content,
            )
        except ValueError as exc:
            await self.send_json({
                "type": "error",
                "code": "INVALID_MESSAGE",
                "message": str(exc),
            })
            return
        except Exception:
            await self.send_json({
                "type": "error",
                "code": "SERVER_ERROR",
                "message": "Failed to send message.",
            })
            return

        # Broadcast message to private conversation group
        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "chat.message",
                "data": message_data,
            },
        )

    async def handle_history(self, content: dict):
        page = content.get("page", 1)
        page_size = content.get("page_size", MessageService.DEFAULT_PAGE_SIZE)

        try:
            history_data = await database_sync_to_async(
                self.message_service.get_conversation_messages
            )(
                user1_id=self.user.id,
                user2_id=self.target_user_id,
                page=page,
                page_size=page_size,
            )
            await self.send_json({
                "type": "history",
                "data": history_data,
            })
        except Exception:
            await self.send_json({
                "type": "error",
                "code": "SERVER_ERROR",
                "message": "Failed to retrieve conversation history.",
            })

    async def chat_message(self, event: dict):
        await self.send_json({
            "type": "message",
            "data": event["data"],
        })
