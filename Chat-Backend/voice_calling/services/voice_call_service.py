import uuid
from typing import Dict, Any, Optional
from django.contrib.auth import get_user_model
from channels.db import database_sync_to_async
from voice_calling.services.call_state_service import CallStateService, CallState

User = get_user_model()


class VoiceCallService:
    """
    Handles WebRTC signaling validation and message routing for 1-to-1 voice calling.
    Ensures strict security:
    - Caller identity is always bound to the authenticated user.
    - Call state integrity is verified for every signaling message.
    - Prevents unauthorized callers from hijacking or injecting into ongoing calls.
    """

    @staticmethod
    @database_sync_to_async
    def get_and_validate_receiver(receiver_id: int):
        try:
            receiver = User.objects.get(id=receiver_id)
            if not receiver.is_active:
                return None, "Receiver account is deactivated."
            return receiver, None
        except User.DoesNotExist:
            return None, "Receiver does not exist."
        except Exception as e:
            return None, str(e)

    @classmethod
    async def handle_signaling_event(cls, consumer, content: Dict[str, Any]):
        """
        Main entry point for handling voice calling signaling events.
        """
        user = consumer.user
        if not user or not user.is_authenticated:
            await consumer.send_json({
                "type": "error",
                "code": "UNAUTHORIZED",
                "message": "Authentication required for voice calling.",
            })
            return

        event_type = content.get("type")
        
        if event_type == "call_offer":
            await cls.handle_call_offer(consumer, content)
        elif event_type == "call_answer":
            await cls.handle_call_answer(consumer, content)
        elif event_type == "ice_candidate":
            await cls.handle_ice_candidate(consumer, content)
        elif event_type == "call_reject":
            await cls.handle_call_reject(consumer, content)
        elif event_type == "call_cancel":
            await cls.handle_call_cancel(consumer, content)
        elif event_type == "call_end":
            await cls.handle_call_end(consumer, content)
        else:
            await consumer.send_json({
                "type": "error",
                "code": "INVALID_SIGNALING_EVENT",
                "message": f"Unknown signaling event type '{event_type}'.",
            })

    @classmethod
    async def handle_call_offer(cls, consumer, content: Dict[str, Any]):
        caller = consumer.user
        raw_receiver_id = content.get("receiver_id") or content.get("target_user_id")
        sdp = content.get("sdp")
        call_id = content.get("call_id")

        if not raw_receiver_id:
            await consumer.send_json({
                "type": "error",
                "code": "INVALID_PAYLOAD",
                "message": "Receiver ID is required.",
            })
            return

        try:
            receiver_id = int(raw_receiver_id)
        except (ValueError, TypeError):
            await consumer.send_json({
                "type": "error",
                "code": "INVALID_PAYLOAD",
                "message": "Receiver ID must be a valid integer.",
            })
            return

        if caller.id == receiver_id:
            await consumer.send_json({
                "type": "error",
                "code": "INVALID_CALL",
                "message": "You cannot call yourself.",
            })
            return

        if not sdp or not isinstance(sdp, (dict, str)):
            await consumer.send_json({
                "type": "error",
                "code": "INVALID_PAYLOAD",
                "message": "Valid SDP offer is required.",
            })
            return

        if not call_id or not isinstance(call_id, str) or not call_id.strip():
            call_id = str(uuid.uuid4())

        receiver, error_msg = await cls.get_and_validate_receiver(receiver_id)
        if not receiver:
            await consumer.send_json({
                "type": "error",
                "code": "RECEIVER_NOT_FOUND",
                "message": error_msg or "Target user not found or inactive.",
            })
            return

        # Check if caller or receiver is already in an active call
        if CallStateService.is_user_busy(caller.id):
            await consumer.send_json({
                "type": "call_busy",
                "call_id": call_id,
                "user_id": caller.id,
                "message": "You are already in an active call.",
            })
            return

        if CallStateService.is_user_busy(receiver_id):
            await consumer.send_json({
                "type": "call_busy",
                "call_id": call_id,
                "user_id": receiver_id,
                "message": "Receiver is currently busy on another call.",
            })
            return

        call_data = CallStateService.create_call(
            call_id=call_id,
            caller_id=caller.id,
            receiver_id=receiver_id
        )

        if not call_data:
            await consumer.send_json({
                "type": "call_busy",
                "call_id": call_id,
                "user_id": receiver_id,
                "message": "User is currently busy.",
            })
            return

        # Prepare caller metadata
        caller_name = getattr(caller, "name", None) or getattr(caller, "username", None) or f"User {caller.id}"
        caller_avatar = getattr(caller, "profile_image_url", None) or getattr(caller, "profile_image", None) or ""

        # Deliver call_offer event to receiver
        await consumer.channel_layer.group_send(
            f"user_{receiver_id}",
            {
                "type": "voice.call.event",
                "data": {
                    "type": "call_offer",
                    "call_id": call_id,
                    "caller_id": caller.id,
                    "caller_name": caller_name,
                    "caller_avatar": str(caller_avatar) if caller_avatar else "",
                    "sdp": sdp,
                }
            }
        )

        # Acknowledge caller that call has been initiated
        await consumer.send_json({
            "type": "call_initiated",
            "call_id": call_id,
            "receiver_id": receiver_id,
            "status": CallState.CALLING,
        })

    @classmethod
    async def handle_call_answer(cls, consumer, content: Dict[str, Any]):
        user = consumer.user
        call_id = content.get("call_id")
        sdp = content.get("sdp")

        if not call_id:
            await consumer.send_json({
                "type": "error",
                "code": "INVALID_PAYLOAD",
                "message": "call_id is required.",
            })
            return

        if not sdp or not isinstance(sdp, (dict, str)):
            await consumer.send_json({
                "type": "error",
                "code": "INVALID_PAYLOAD",
                "message": "Valid SDP answer is required.",
            })
            return

        call = CallStateService.get_call(call_id)
        if not call:
            await consumer.send_json({
                "type": "error",
                "code": "CALL_NOT_FOUND",
                "message": "Call session does not exist or has expired.",
            })
            return

        if call.get("receiver_id") != user.id:
            await consumer.send_json({
                "type": "error",
                "code": "UNAUTHORIZED_ACTION",
                "message": "You are not authorized to answer this call.",
            })
            return

        if call.get("state") not in (CallState.CALLING, CallState.RINGING):
            await consumer.send_json({
                "type": "error",
                "code": "INVALID_CALL_STATE",
                "message": f"Cannot answer call in '{call.get('state')}' state.",
            })
            return

        CallStateService.update_call_state(call_id, CallState.CONNECTED)
        caller_id = call["caller_id"]

        # Route answer to caller
        await consumer.channel_layer.group_send(
            f"user_{caller_id}",
            {
                "type": "voice.call.event",
                "data": {
                    "type": "call_answer",
                    "call_id": call_id,
                    "receiver_id": user.id,
                    "sdp": sdp,
                }
            }
        )

        # Notify answerer of connected status
        await consumer.send_json({
            "type": "call_connected",
            "call_id": call_id,
            "status": CallState.CONNECTED,
        })

    @classmethod
    async def handle_ice_candidate(cls, consumer, content: Dict[str, Any]):
        user = consumer.user
        call_id = content.get("call_id")
        candidate = content.get("candidate")

        if not call_id or candidate is None:
            await consumer.send_json({
                "type": "error",
                "code": "INVALID_PAYLOAD",
                "message": "call_id and candidate payload are required.",
            })
            return

        call = CallStateService.get_call(call_id)
        if not call:
            await consumer.send_json({
                "type": "error",
                "code": "CALL_NOT_FOUND",
                "message": "Call session does not exist.",
            })
            return

        caller_id = call.get("caller_id")
        receiver_id = call.get("receiver_id")

        if user.id not in (caller_id, receiver_id):
            await consumer.send_json({
                "type": "error",
                "code": "UNAUTHORIZED_ACTION",
                "message": "You are not a participant in this call.",
            })
            return

        if call.get("state") in CallState.TERMINAL_STATES:
            await consumer.send_json({
                "type": "error",
                "code": "INVALID_CALL_STATE",
                "message": "Cannot send ICE candidate for a terminated call.",
            })
            return

        target_user_id = receiver_id if user.id == caller_id else caller_id

        await consumer.channel_layer.group_send(
            f"user_{target_user_id}",
            {
                "type": "voice.call.event",
                "data": {
                    "type": "ice_candidate",
                    "call_id": call_id,
                    "candidate": candidate,
                    "sender_id": user.id,
                }
            }
        )

    @classmethod
    async def handle_call_reject(cls, consumer, content: Dict[str, Any]):
        user = consumer.user
        call_id = content.get("call_id")

        if not call_id:
            await consumer.send_json({
                "type": "error",
                "code": "INVALID_PAYLOAD",
                "message": "call_id is required.",
            })
            return

        call = CallStateService.get_call(call_id)
        if not call:
            await consumer.send_json({
                "type": "error",
                "code": "CALL_NOT_FOUND",
                "message": "Call does not exist or has expired.",
            })
            return

        if user.id != call.get("receiver_id"):
            await consumer.send_json({
                "type": "error",
                "code": "UNAUTHORIZED_ACTION",
                "message": "Only the call receiver can reject this call.",
            })
            return

        if call.get("state") in CallState.TERMINAL_STATES:
            await consumer.send_json({
                "type": "error",
                "code": "INVALID_CALL_STATE",
                "message": "Cannot reject an already ended call.",
            })
            return

        CallStateService.terminate_call(call_id, CallState.REJECTED)
        caller_id = call.get("caller_id")

        await consumer.channel_layer.group_send(
            f"user_{caller_id}",
            {
                "type": "voice.call.event",
                "data": {
                    "type": "call_reject",
                    "call_id": call_id,
                    "receiver_id": user.id,
                }
            }
        )

        await consumer.send_json({
            "type": "call_rejected",
            "call_id": call_id,
        })

    @classmethod
    async def handle_call_cancel(cls, consumer, content: Dict[str, Any]):
        user = consumer.user
        call_id = content.get("call_id")

        if not call_id:
            await consumer.send_json({
                "type": "error",
                "code": "INVALID_PAYLOAD",
                "message": "call_id is required.",
            })
            return

        call = CallStateService.get_call(call_id)
        if not call:
            await consumer.send_json({
                "type": "error",
                "code": "CALL_NOT_FOUND",
                "message": "Call does not exist or has expired.",
            })
            return

        if user.id != call.get("caller_id"):
            await consumer.send_json({
                "type": "error",
                "code": "UNAUTHORIZED_ACTION",
                "message": "Only the call initiator can cancel this call.",
            })
            return

        if call.get("state") in CallState.TERMINAL_STATES:
            await consumer.send_json({
                "type": "error",
                "code": "INVALID_CALL_STATE",
                "message": "Cannot cancel an already ended call.",
            })
            return

        CallStateService.terminate_call(call_id, CallState.CANCELLED)
        receiver_id = call.get("receiver_id")

        await consumer.channel_layer.group_send(
            f"user_{receiver_id}",
            {
                "type": "voice.call.event",
                "data": {
                    "type": "call_cancel",
                    "call_id": call_id,
                    "caller_id": user.id,
                }
            }
        )

        await consumer.send_json({
            "type": "call_cancelled",
            "call_id": call_id,
        })

    @classmethod
    async def handle_call_end(cls, consumer, content: Dict[str, Any]):
        user = consumer.user
        call_id = content.get("call_id")

        if not call_id:
            await consumer.send_json({
                "type": "error",
                "code": "INVALID_PAYLOAD",
                "message": "call_id is required.",
            })
            return

        call = CallStateService.get_call(call_id)
        if not call:
            await consumer.send_json({
                "type": "error",
                "code": "CALL_NOT_FOUND",
                "message": "Call does not exist or has expired.",
            })
            return

        caller_id = call.get("caller_id")
        receiver_id = call.get("receiver_id")

        if user.id not in (caller_id, receiver_id):
            await consumer.send_json({
                "type": "error",
                "code": "UNAUTHORIZED_ACTION",
                "message": "You are not a participant in this call.",
            })
            return

        if call.get("state") in CallState.TERMINAL_STATES:
            await consumer.send_json({
                "type": "error",
                "code": "INVALID_CALL_STATE",
                "message": "Call has already ended.",
            })
            return

        CallStateService.terminate_call(call_id, CallState.ENDED)
        target_user_id = receiver_id if user.id == caller_id else caller_id

        # Notify the other user
        await consumer.channel_layer.group_send(
            f"user_{target_user_id}",
            {
                "type": "voice.call.event",
                "data": {
                    "type": "call_end",
                    "call_id": call_id,
                    "ended_by": user.id,
                }
            }
        )

        # Notify ending user
        await consumer.send_json({
            "type": "call_ended",
            "call_id": call_id,
        })
