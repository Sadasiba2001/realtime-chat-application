from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from chatting_service.services import MessageService, PresenceService


class ChatConsumer(AsyncJsonWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.message_service = MessageService()
        self.presence_service = PresenceService()
        self.user = None
        self.target_user_id = None
        self.user_group = None
        self.group_name = None

    async def connect(self):
        self.user = self.scope.get("user")

        # 1. Authentication check
        if not self.user or self.user.is_anonymous or not self.user.is_authenticated:
            await self.close(code=4001)
            return

        # 2. Join user's personal channel group (for persistent user-level delivery)
        self.user_group = f"user_{self.user.id}"
        await self.channel_layer.group_add(self.user_group, self.channel_name)

        # 3. If target user id was provided in URL kwargs, validate and join conversation group
        target_id_param = self.scope.get("url_route", {}).get("kwargs", {}).get("user_id")
        if target_id_param is not None:
            try:
                self.target_user_id = int(target_id_param)
            except (TypeError, ValueError):
                await self.close(code=4000)
                return

            try:
                await database_sync_to_async(self.message_service.validate_target_user)(
                    target_user_id=self.target_user_id,
                    authenticated_user_id=self.user.id,
                )
            except ValueError:
                await self.close(code=4004)
                return

            smaller_id = min(self.user.id, self.target_user_id)
            larger_id = max(self.user.id, self.target_user_id)
            self.group_name = f"chat_{smaller_id}_{larger_id}"
            await self.channel_layer.group_add(self.group_name, self.channel_name)

        # 4. Accept WebSocket connection
        await self.accept()

        # 5. Track presence (increment connection count) and broadcast if became ONLINE
        is_first_connection = await database_sync_to_async(self.presence_service.user_connected)(self.user.id)
        if is_first_connection:
            partner_ids = await database_sync_to_async(self.message_service.get_conversation_partner_ids)(self.user.id)
            for partner_id in partner_ids:
                await self.channel_layer.group_send(
                    f"user_{partner_id}",
                    {
                        "type": "presence.event",
                        "data": {
                            "type": "presence",
                            "user_id": self.user.id,
                            "status": "online",
                        },
                    },
                )

        # 6. Send connection event
        await self.send_json({
            "type": "connection",
            "message": "Connected successfully.",
            "user_id": self.user.id,
        })

        # 7. Deliver any pending offline messages addressed to this user
        pending_messages = await database_sync_to_async(
            self.message_service.get_pending_sent_messages
        )(self.user.id)
        for msg in pending_messages:
            await self.send_json({
                "type": "message",
                "data": msg,
            })

    async def disconnect(self, close_code):
        if self.user_group:
            await self.channel_layer.group_discard(self.user_group, self.channel_name)
        if self.group_name:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

        # Track presence (decrement connection count) and broadcast if became OFFLINE
        if self.user and self.user.is_authenticated:
            is_last_connection, last_seen_iso = await database_sync_to_async(
                self.presence_service.user_disconnected
            )(self.user.id)

            if is_last_connection:
                partner_ids = await database_sync_to_async(
                    self.message_service.get_conversation_partner_ids
                )(self.user.id)
                for partner_id in partner_ids:
                    await self.channel_layer.group_send(
                        f"user_{partner_id}",
                        {
                            "type": "presence.event",
                            "data": {
                                "type": "presence",
                                "user_id": self.user.id,
                                "status": "offline",
                                "last_seen": last_seen_iso,
                            },
                        },
                    )

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
        elif msg_type in ("delivery_receipt", "delivery_ack"):
            await self.handle_delivery_receipt(content)
        elif msg_type in ("read_receipt", "read_ack"):
            await self.handle_read_receipt(content)
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

        # If URL specified a target user ID, use it; otherwise use payload receiver_id
        if self.target_user_id is not None:
            receiver_id = self.target_user_id
        else:
            receiver_id = content.get("receiver_id") or content.get("target_user_id")

        if receiver_id is None:
            await self.send_json({
                "type": "error",
                "code": "INVALID_MESSAGE",
                "message": "Receiver ID is required.",
            })
            return

        try:
            receiver_id = int(receiver_id)
        except (TypeError, ValueError):
            await self.send_json({
                "type": "error",
                "code": "INVALID_MESSAGE",
                "message": "Invalid receiver ID format.",
            })
            return

        try:
            message_data = await database_sync_to_async(self.message_service.send_message)(
                sender=self.user,
                receiver_id=receiver_id,
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

        # Broadcast to sender's user group
        await self.channel_layer.group_send(
            f"user_{self.user.id}",
            {
                "type": "chat.message",
                "data": message_data,
            },
        )

        # Broadcast to receiver's user group (if distinct from sender and receiver is online)
        if receiver_id != self.user.id:
            is_receiver_online = await database_sync_to_async(
                self.presence_service.is_user_online
            )(receiver_id)
            if is_receiver_online:
                await self.channel_layer.group_send(
                    f"user_{receiver_id}",
                    {
                        "type": "chat.message",
                        "data": message_data,
                    },
                )

    async def handle_delivery_receipt(self, content: dict):
        raw_msg_ids = content.get("message_ids")
        if raw_msg_ids is None:
            single_id = content.get("message_id")
            raw_msg_ids = [single_id] if single_id is not None else []

        if not isinstance(raw_msg_ids, list):
            raw_msg_ids = [raw_msg_ids]

        valid_ids = []
        for mid in raw_msg_ids:
            if mid is not None:
                try:
                    valid_ids.append(int(mid))
                except (ValueError, TypeError):
                    pass

        if not valid_ids:
            return

        updated_msgs = await database_sync_to_async(
            self.message_service.mark_messages_delivered
        )(receiver_id=self.user.id, message_ids=valid_ids)

        if not updated_msgs:
            return

        # Group by sender_id to notify each sender
        senders_map = {}
        for mid, sid in updated_msgs:
            senders_map.setdefault(sid, []).append(mid)

        for sender_id, mids in senders_map.items():
            await self.channel_layer.group_send(
                f"user_{sender_id}",
                {
                    "type": "message.status.event",
                    "data": {
                        "type": "message_status",
                        "message_ids": mids,
                        "status": "delivered",
                        "conversation_user_id": self.user.id,
                    },
                },
            )

    async def handle_read_receipt(self, content: dict):
        raw_target_id = (
            content.get("conversation_user_id")
            or content.get("target_user_id")
            or content.get("sender_id")
        )
        if raw_target_id is None:
            return

        try:
            target_user_id = int(raw_target_id)
        except (ValueError, TypeError):
            return

        raw_msg_ids = content.get("message_ids")
        msg_ids = None
        if raw_msg_ids is not None:
            if isinstance(raw_msg_ids, list):
                msg_ids = []
                for mid in raw_msg_ids:
                    try:
                        msg_ids.append(int(mid))
                    except (ValueError, TypeError):
                        pass
            else:
                try:
                    msg_ids = [int(raw_msg_ids)]
                except (ValueError, TypeError):
                    pass

        updated_ids = await database_sync_to_async(
            self.message_service.mark_messages_read
        )(
            receiver_id=self.user.id,
            sender_id=target_user_id,
            message_ids=msg_ids,
        )

        if updated_ids:
            # Notify sender of read status
            await self.channel_layer.group_send(
                f"user_{target_user_id}",
                {
                    "type": "message.status.event",
                    "data": {
                        "type": "message_status",
                        "message_ids": updated_ids,
                        "status": "read",
                        "conversation_user_id": self.user.id,
                    },
                },
            )
            # Also notify receiver to sync all tabs
            await self.channel_layer.group_send(
                f"user_{self.user.id}",
                {
                    "type": "message.status.event",
                    "data": {
                        "type": "message_status",
                        "message_ids": updated_ids,
                        "status": "read",
                        "conversation_user_id": target_user_id,
                    },
                },
            )

    async def handle_history(self, content: dict):
        page = content.get("page", 1)
        page_size = content.get("page_size", MessageService.DEFAULT_PAGE_SIZE)

        if self.target_user_id is not None:
            target_user_id = self.target_user_id
        else:
            target_user_id = content.get("target_user_id") or content.get("receiver_id")

        if target_user_id is None:
            await self.send_json({
                "type": "error",
                "code": "INVALID_MESSAGE",
                "message": "Target user ID is required for history.",
            })
            return

        try:
            target_user_id = int(target_user_id)
        except (TypeError, ValueError):
            await self.send_json({
                "type": "error",
                "code": "INVALID_MESSAGE",
                "message": "Invalid target user ID format.",
            })
            return

        try:
            await database_sync_to_async(self.message_service.validate_target_user)(
                target_user_id=target_user_id,
                authenticated_user_id=self.user.id,
            )
            history_data = await database_sync_to_async(
                self.message_service.get_conversation_messages
            )(
                user1_id=self.user.id,
                user2_id=target_user_id,
                page=page,
                page_size=page_size,
            )
            await self.send_json({
                "type": "history",
                "target_user_id": target_user_id,
                "data": history_data,
            })
        except ValueError as exc:
            await self.send_json({
                "type": "error",
                "code": "INVALID_MESSAGE",
                "message": str(exc),
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

    async def message_status_event(self, event: dict):
        await self.send_json(event["data"])

    async def presence_event(self, event: dict):
        await self.send_json(event["data"])

    async def user_profile_event(self, event: dict):
        await self.send_json(event["data"])



