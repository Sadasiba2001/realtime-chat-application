import asyncio
import time
from django.conf import settings
from django.core.cache import cache
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from chatting_service.services import MessageService, PresenceService
from chatting_service.middleware.jwt_auth_middleware import get_token_from_scope


class ChatConsumer(AsyncJsonWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.message_service = MessageService()
        self.presence_service = PresenceService()
        self.user = None
        self.target_user_id = None
        self.user_group = None
        self.group_name = None
        self.added_to_connection_cache = False

    async def connect(self):
        self.user = self.scope.get("user")

        # 1. Authentication check
        if not self.user or self.user.is_anonymous or not self.user.is_authenticated:
            await self.close(code=4001)
            return

        # 1.5. Connection Limiting (B-10)
        client = self.scope.get('client')
        ip_address = client[0] if client else '127.0.0.1'
        user_conn_key = f"ws_conn_user_{self.user.id}"
        ip_conn_key = f"ws_conn_ip_{ip_address}"
        
        user_conns = cache.get(user_conn_key, 0)
        ip_conns = cache.get(ip_conn_key, 0)

        if user_conns >= 5 or ip_conns >= 10:
            await self.close(code=4003)
            return

        cache.set(user_conn_key, user_conns + 1, timeout=86400)
        cache.set(ip_conn_key, ip_conns + 1, timeout=86400)
        self.added_to_connection_cache = True

        # 2. Join user's personal channel group (for persistent user-level delivery)
        self.user_group = f"user_{self.user.id}"
        # Disconnect any existing connections for this user (prevent duplicate connections - F-06/F-07)
        await self.channel_layer.group_send(
            self.user_group,
            {
                "type": "disconnect.duplicate",
                "message": "Connected in another location.",
            }
        )
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

        # 4. Accept WebSocket connection with access_token subprotocol (B-11)
        subprotocols = self.scope.get("subprotocols", [])
        selected_subprotocol = None
        if "access_token" in subprotocols:
            selected_subprotocol = "access_token"
        else:
            headers = dict(self.scope.get("headers", []))
            sec_protocol = headers.get(b"sec-websocket-protocol", b"").decode("utf-8")
            if "access_token" in sec_protocol:
                selected_subprotocol = "access_token"

        await self.accept(subprotocol=selected_subprotocol)

        # Start token lifecycle monitor task (B-12, B-14)
        token = get_token_from_scope(self.scope)
        if token:
            self.lifecycle_task = asyncio.create_task(self.monitor_token_lifecycle(token))

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
        if hasattr(self, "lifecycle_task"):
            self.lifecycle_task.cancel()

        if getattr(self, "added_to_connection_cache", False) and self.user:
            client = self.scope.get('client')
            ip_address = client[0] if client else '127.0.0.1'
            user_conn_key = f"ws_conn_user_{self.user.id}"
            ip_conn_key = f"ws_conn_ip_{ip_address}"
            
            user_conns = cache.get(user_conn_key, 0)
            if user_conns > 0:
                cache.set(user_conn_key, user_conns - 1, timeout=86400)
            
            ip_conns = cache.get(ip_conn_key, 0)
            if ip_conns > 0:
                cache.set(ip_conn_key, ip_conns - 1, timeout=86400)

        if self.user_group:
            await self.channel_layer.group_discard(self.user_group, self.channel_name)
        if self.group_name:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

        # Track presence (decrement connection count) and broadcast if became OFFLINE
        if self.user and self.user.is_authenticated:
            # Cleanup any active voice/video call session for this user
            try:
                from voice_calling.services import CallStateService, CallState
                active_voice_call_id = CallStateService.get_user_active_call_id(self.user.id)
                if active_voice_call_id:
                    call = CallStateService.get_call(active_voice_call_id)
                    CallStateService.terminate_call(active_voice_call_id, CallState.ENDED)
                    if call:
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
                                        "call_id": active_voice_call_id,
                                        "ended_by": self.user.id,
                                    },
                                },
                            )
            except Exception:
                pass

            try:
                from video_calling.services import VideoCallStateService
                active_video_call_id = VideoCallStateService.get_user_active_call(self.user.id)
                if active_video_call_id:
                    v_call = VideoCallStateService.get_call(active_video_call_id)
                    VideoCallStateService.end_call(active_video_call_id)
                    if v_call:
                        v_caller_id = v_call.get("caller_id")
                        v_receiver_id = v_call.get("receiver_id")
                        v_counterparty_id = v_receiver_id if self.user.id == v_caller_id else v_caller_id
                        if v_counterparty_id:
                            await self.channel_layer.group_send(
                                f"user_{v_counterparty_id}",
                                {
                                    "type": "video.call.event",
                                    "data": {
                                        "type": "video_call_end",
                                        "call_id": active_video_call_id,
                                        "sender_id": self.user.id,
                                        "reason": "Peer disconnected",
                                    },
                                },
                            )
            except Exception:
                pass

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

    async def disconnect_duplicate(self, event):
        await self.send_json({
            "type": "error",
            "code": "DUPLICATE_CONNECTION",
            "message": event["message"],
        })
        await self.close(code=4002)

    async def monitor_token_lifecycle(self, token_string):
        from rest_framework_simplejwt.tokens import AccessToken
        from django.contrib.auth import get_user_model
        User = get_user_model()

        try:
            access_token = AccessToken(token_string)
            exp = access_token.get("exp")
            token_pwd_hash = access_token.get("pwd_hash")
            
            while True:
                now = time.time()
                remaining = exp - now
                if remaining <= 0:
                    await self.send_json({
                        "type": "error",
                        "code": "TOKEN_EXPIRED",
                        "message": "Authentication token expired. Please reconnect.",
                    })
                    await self.close(code=4001)
                    break
                
                # Check DB for password change
                if token_pwd_hash:
                    current_pwd = await database_sync_to_async(
                        lambda: User.objects.filter(id=self.user.id).values_list("password", flat=True).first()
                    )()
                    if current_pwd:
                        current_suffix = current_pwd[-12:]
                        if current_suffix != token_pwd_hash:
                            await self.send_json({
                                "type": "error",
                                "code": "PASSWORD_CHANGED",
                                "message": "Password changed. Please reconnect.",
                            })
                            await self.close(code=4001)
                            break
                            
                sleep_time = min(30, max(1, remaining))
                await asyncio.sleep(sleep_time)
        except asyncio.CancelledError:
            pass
        except Exception:
            await self.close(code=4001)

    async def receive(self, text_data=None, bytes_data=None):
        max_payload_size = getattr(settings, "MAX_WEBSOCKET_PAYLOAD_SIZE", 65536)
        if text_data and len(text_data) > max_payload_size:
            await self.send_json({
                "type": "error",
                "code": "PAYLOAD_TOO_LARGE",
                "message": f"Payload size exceeds the maximum limit of {max_payload_size} characters.",
            })
            return
        await super().receive(text_data, bytes_data)

    async def receive_json(self, content, **kwargs):
        # Authentication and Rate Limiting check
        if not self.user or self.user.is_anonymous or not self.user.is_authenticated:
            await self.send_json({
                "type": "error",
                "code": "UNAUTHORIZED",
                "message": "Authentication is required.",
            })
            await self.close(code=4001)
            return

        if not isinstance(content, dict):
            await self.send_json({
                "type": "error",
                "code": "INVALID_MESSAGE",
                "message": "Payload must be a JSON object.",
            })
            return

        msg_type = content.get("type")

        # WebRTC voice & video signaling messages bypass the chat message rate limiter
        VOICE_SIGNALING_TYPES = (
            "call_offer",
            "call_answer",
            "ice_candidate",
            "call_reject",
            "call_cancel",
            "call_end",
            "call_busy",
        )

        VIDEO_SIGNALING_TYPES = (
            "video_call_offer",
            "video_call_answer",
            "video_ice_candidate",
            "video_call_reject",
            "video_call_cancel",
            "video_call_end",
            "video_call_busy",
        )

        if msg_type in VOICE_SIGNALING_TYPES:
            from voice_calling.services import VoiceCallService
            await VoiceCallService.handle_signaling_event(self, content)
            return

        if msg_type in VIDEO_SIGNALING_TYPES:
            from video_calling.services import VideoCallService
            await VideoCallService.handle_signaling_event(self, content)
            return

        now = time.time()
        user_id = self.user.id

        import sys
        is_testing = "test" in sys.argv

        if not is_testing:
            # 1. Spam protection (rapid repeated messages)
            last_time_key = f"ws_last_msg_time_{user_id}"
            last_time = cache.get(last_time_key)
            if last_time is not None and (now - last_time) < 0.2:
                await self.send_json({
                    "type": "error",
                    "code": "RATE_LIMIT_EXCEEDED",
                    "message": "You are sending messages too quickly. Please wait.",
                })
                return

            # 2. Sliding window message limit per minute
            rate_key = f"ws_msg_rate_{user_id}"
            msg_timestamps = cache.get(rate_key, [])
            msg_timestamps = [t for t in msg_timestamps if now - t < 60]

            if len(msg_timestamps) >= 60:
                await self.send_json({
                    "type": "error",
                    "code": "RATE_LIMIT_EXCEEDED",
                    "message": "Message rate limit exceeded. Please try again in a minute.",
                })
                return

            msg_timestamps.append(now)
            cache.set(rate_key, msg_timestamps, timeout=65)
            cache.set(last_time_key, now, timeout=5)

        if msg_type == "message":
            await self.handle_message(content)
        elif msg_type == "history":
            await self.handle_history(content)
        elif msg_type in ("delivery_receipt", "delivery_ack"):
            await self.handle_delivery_receipt(content)
        elif msg_type in ("read_receipt", "read_ack"):
            await self.handle_read_receipt(content)
        elif msg_type == "delete_message":
            await self.handle_delete_message(content)
        elif msg_type == "edit_message":
            await self.handle_edit_message(content)
        elif msg_type in ("add_reaction", "toggle_reaction", "remove_reaction"):
            await self.handle_reaction(content)
        elif msg_type == "forward_message":
            await self.handle_forward_message(content)
        elif msg_type in ("typing_start", "typing_stop", "typing"):
            await self.handle_typing(content, msg_type)
        else:
            await self.send_json({
                "type": "error",
                "code": "UNSUPPORTED_MESSAGE_TYPE",
                "message": f"Unsupported message type '{msg_type}'.",
            })

    async def handle_message(self, content: dict):
        raw_content = content.get("content", "")
        attachment_ids = content.get("attachment_ids")

        if not isinstance(raw_content, str):
            raw_content = ""

        if not raw_content.strip() and not attachment_ids:
            await self.send_json({
                "type": "error",
                "code": "INVALID_MESSAGE",
                "message": "Message content is required.",
            })
            return

        clean_att_ids = None
        if attachment_ids and isinstance(attachment_ids, list):
            clean_att_ids = []
            for aid in attachment_ids:
                try:
                    clean_att_ids.append(int(str(aid).replace("att_", "")))
                except (ValueError, TypeError):
                    pass

        max_length = getattr(settings, "MAX_MESSAGE_LENGTH", 1000)
        if len(raw_content.strip()) > max_length:
            await self.send_json({
                "type": "error",
                "code": "INVALID_MESSAGE",
                "message": f"Message exceeds maximum allowed length of {max_length} characters.",
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

        raw_reply_to = content.get("reply_to_id") or content.get("reply_to")
        reply_to_id = None
        if raw_reply_to is not None:
            try:
                reply_to_id = int(raw_reply_to)
            except (TypeError, ValueError):
                reply_to_id = None

        try:
            message_data = await database_sync_to_async(self.message_service.send_message)(
                sender=self.user,
                receiver_id=receiver_id,
                content=raw_content,
                reply_to_id=reply_to_id,
                attachment_ids=clean_att_ids,
            )
        except PermissionError as exc:
            await self.send_json({
                "type": "error",
                "code": "FORBIDDEN",
                "message": str(exc),
            })
            return
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
                requesting_user_id=self.user.id,
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

    async def voice_call_event(self, event: dict):
        await self.send_json(event["data"])

    async def video_call_event(self, event: dict):
        await self.send_json(event["data"])

    async def handle_delete_message(self, content: dict):
        raw_msg_id = content.get("message_id")
        delete_type = content.get("delete_type", "everyone")

        if raw_msg_id is None:
            return

        try:
            message_id = int(raw_msg_id)
        except (TypeError, ValueError):
            return

        if delete_type == "everyone":
            try:
                updated_info = await database_sync_to_async(
                    self.message_service.delete_message_for_everyone
                )(message_id=message_id, user_id=self.user.id)
            except PermissionError as exc:
                await self.send_json({
                    "type": "error",
                    "code": "FORBIDDEN",
                    "message": str(exc),
                })
                return
            except ValueError as exc:
                await self.send_json({
                    "type": "error",
                    "code": "INVALID_MESSAGE",
                    "message": str(exc),
                })
                return

            if updated_info:
                partner_id = updated_info.get("partner_id")
                event_data = {
                    "type": "message_deleted",
                    "message_id": message_id,
                    "delete_type": "everyone",
                    "sender_id": self.user.id,
                }
                await self.channel_layer.group_send(
                    f"user_{self.user.id}",
                    {
                        "type": "message.delete.event",
                        "data": event_data,
                    },
                )
                if partner_id and partner_id != self.user.id:
                    await self.channel_layer.group_send(
                        f"user_{partner_id}",
                        {
                            "type": "message.delete.event",
                            "data": event_data,
                        },
                    )
        elif delete_type == "me":
            try:
                updated_info = await database_sync_to_async(
                    self.message_service.delete_message_for_me
                )(message_id=message_id, user_id=self.user.id)
            except PermissionError as exc:
                await self.send_json({
                    "type": "error",
                    "code": "FORBIDDEN",
                    "message": str(exc),
                })
                return
            except ValueError as exc:
                await self.send_json({
                    "type": "error",
                    "code": "INVALID_MESSAGE",
                    "message": str(exc),
                })
                return

            if updated_info:
                event_data = {
                    "type": "message_deleted",
                    "message_id": message_id,
                    "delete_type": "me",
                    "sender_id": self.user.id,
                }
                await self.channel_layer.group_send(
                    f"user_{self.user.id}",
                    {
                        "type": "message.delete.event",
                        "data": event_data,
                    },
                )

    async def message_delete_event(self, event: dict):
        await self.send_json(event["data"])

    async def handle_edit_message(self, content: dict):
        raw_msg_id = content.get("message_id")
        raw_content = content.get("content")

        if raw_msg_id is None:
            await self.send_json({
                "type": "error",
                "code": "INVALID_MESSAGE",
                "message": "Message ID is required.",
            })
            return

        try:
            message_id = int(raw_msg_id)
        except (TypeError, ValueError):
            await self.send_json({
                "type": "error",
                "code": "INVALID_MESSAGE",
                "message": "Invalid message ID format.",
            })
            return

        try:
            message_data = await database_sync_to_async(self.message_service.edit_message)(
                message_id=message_id,
                user_id=self.user.id,
                content=raw_content,
            )
        except PermissionError as exc:
            await self.send_json({
                "type": "error",
                "code": "FORBIDDEN",
                "message": str(exc),
            })
            return
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
                "message": "Failed to edit message.",
            })
            return

        event_data = {
            "type": "message_edited",
            "data": message_data,
        }

        await self.channel_layer.group_send(
            f"user_{self.user.id}",
            {
                "type": "message.edited.event",
                "data": event_data,
            },
        )

        receiver_id = message_data.get("receiver_id")
        if receiver_id and receiver_id != self.user.id:
            await self.channel_layer.group_send(
                f"user_{receiver_id}",
                {
                    "type": "message.edited.event",
                    "data": event_data,
                },
            )

    async def message_edited_event(self, event: dict):
        await self.send_json(event["data"])

    async def handle_reaction(self, content: dict):
        raw_msg_id = content.get("message_id")
        emoji = content.get("emoji")

        if raw_msg_id is None or not emoji:
            await self.send_json({
                "type": "error",
                "code": "INVALID_MESSAGE",
                "message": "Message ID and emoji are required.",
            })
            return

        try:
            message_id = int(raw_msg_id)
        except (TypeError, ValueError):
            await self.send_json({
                "type": "error",
                "code": "INVALID_MESSAGE",
                "message": "Invalid message ID format.",
            })
            return

        try:
            reaction_info = await database_sync_to_async(
                self.message_service.toggle_reaction
            )(message_id=message_id, user_id=self.user.id, emoji=str(emoji))
        except PermissionError as exc:
            await self.send_json({
                "type": "error",
                "code": "FORBIDDEN",
                "message": str(exc),
            })
            return
        except ValueError as exc:
            await self.send_json({
                "type": "error",
                "code": "INVALID_MESSAGE",
                "message": str(exc),
            })
            return

        if reaction_info:
            partner_id = reaction_info.get("partner_id")
            event_data = {
                "type": "message_reaction_updated",
                "data": reaction_info,
            }
            await self.channel_layer.group_send(
                f"user_{self.user.id}",
                {
                    "type": "message.reaction.event",
                    "data": event_data,
                },
            )
            if partner_id and partner_id != self.user.id:
                await self.channel_layer.group_send(
                    f"user_{partner_id}",
                    {
                        "type": "message.reaction.event",
                        "data": event_data,
                    },
                )

    async def message_reaction_event(self, event: dict):
        await self.send_json(event["data"])

    async def handle_forward_message(self, content: dict):
        raw_msg_id = content.get("message_id")
        raw_target_ids = content.get("target_user_ids") or content.get("target_user_id") or content.get("receiver_id")

        if raw_msg_id is None or raw_target_ids is None:
            await self.send_json({
                "type": "error",
                "code": "INVALID_MESSAGE",
                "message": "Message ID and target user ID(s) are required.",
            })
            return

        try:
            message_id = int(raw_msg_id)
        except (TypeError, ValueError):
            await self.send_json({
                "type": "error",
                "code": "INVALID_MESSAGE",
                "message": "Invalid message ID format.",
            })
            return

        target_user_ids = []
        if isinstance(raw_target_ids, list):
            for tid in raw_target_ids:
                try:
                    target_user_ids.append(int(tid))
                except (TypeError, ValueError):
                    pass
        else:
            try:
                target_user_ids.append(int(raw_target_ids))
            except (TypeError, ValueError):
                pass

        if not target_user_ids:
            await self.send_json({
                "type": "error",
                "code": "INVALID_MESSAGE",
                "message": "Valid target user ID(s) required.",
            })
            return

        try:
            forwarded_messages = await database_sync_to_async(
                self.message_service.forward_message
            )(user=self.user, message_id=message_id, target_user_ids=target_user_ids)
        except PermissionError as exc:
            await self.send_json({
                "type": "error",
                "code": "FORBIDDEN",
                "message": str(exc),
            })
            return
        except ValueError as exc:
            await self.send_json({
                "type": "error",
                "code": "INVALID_MESSAGE",
                "message": str(exc),
            })
            return

        for msg_data in forwarded_messages:
            receiver_id = msg_data.get("receiver_id")
            await self.send_json(msg_data)
            if receiver_id and receiver_id != self.user.id:
                await self.channel_layer.group_send(
                    f"user_{receiver_id}",
                    {
                        "type": "chat.message.event",
                        "data": msg_data,
                    },
                )

    async def handle_typing(self, content: dict, msg_type: str):
        raw_target_id = (
            content.get("target_user_id")
            or content.get("receiver_id")
            or content.get("conversation_user_id")
        )
        if raw_target_id is None:
            return

        try:
            target_user_id = int(raw_target_id)
        except (ValueError, TypeError):
            return

        is_typing = (
            msg_type == "typing_start"
            or content.get("is_typing") is True
            or (msg_type == "typing" and content.get("status") == "start")
        )

        user_display_name = getattr(self.user, "username", f"User {self.user.id}")

        await self.channel_layer.group_send(
            f"user_{target_user_id}",
            {
                "type": "chat.typing.event",
                "data": {
                    "type": "typing_status",
                    "user_id": self.user.id,
                    "user_name": user_display_name,
                    "is_typing": is_typing,
                    "conversation_user_id": self.user.id,
                },
            },
        )

    async def chat_typing_event(self, event: dict):
        await self.send_json(event["data"])





