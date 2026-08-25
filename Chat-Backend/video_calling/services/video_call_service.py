import logging
from typing import Dict, Any
from .call_state_service import VideoCallState, VideoCallStateService

logger = logging.getLogger(__name__)


class VideoCallService:
    """
    Coordinates 1-to-1 WebRTC video signaling over Django Channels.
    Validates authenticated user identity and routes signaling to target channels.
    """

    @classmethod
    async def handle_signaling_event(cls, consumer, content: Dict[str, Any]):
        """
        Main dispatch entry point for all video signaling event types.
        """
        event_type = content.get("type")

        handlers = {
            "video_call_offer": cls.handle_call_offer,
            "video_call_answer": cls.handle_call_answer,
            "video_ice_candidate": cls.handle_ice_candidate,
            "video_call_reject": cls.handle_call_reject,
            "video_call_cancel": cls.handle_call_cancel,
            "video_call_end": cls.handle_call_end,
            "video_call_busy": cls.handle_call_busy,
        }

        handler = handlers.get(event_type)
        if handler:
            await handler(consumer, content)
        else:
            logger.warning(f"[VideoCallService] Unknown signaling event type: {event_type}")
            await consumer.send_json({
                "type": "error",
                "code": "UNKNOWN_VIDEO_SIGNALING_EVENT",
                "message": f"Signaling event type '{event_type}' is not supported.",
            })

    @classmethod
    async def handle_call_offer(cls, consumer, content: Dict[str, Any]):
        caller = consumer.user
        receiver_id = content.get("receiver_id")
        call_id = content.get("call_id")
        sdp = content.get("sdp")

        if not receiver_id or not call_id:
            await consumer.send_json({
                "type": "error",
                "code": "INVALID_PAYLOAD",
                "message": "receiver_id and call_id are required.",
            })
            return

        try:
            receiver_id = int(receiver_id)
        except (ValueError, TypeError):
            await consumer.send_json({
                "type": "error",
                "code": "INVALID_RECEIVER_ID",
                "message": "receiver_id must be a valid integer ID.",
            })
            return

        if caller.id == receiver_id:
            await consumer.send_json({
                "type": "error",
                "code": "CANNOT_CALL_SELF",
                "message": "You cannot start a video call with yourself.",
            })
            return

        if not sdp or not isinstance(sdp, (dict, str)):
            await consumer.send_json({
                "type": "error",
                "code": "INVALID_PAYLOAD",
                "message": "Valid SDP offer is required.",
            })
            return

        # Check caller already in call
        if VideoCallStateService.is_user_busy(caller.id):
            await consumer.send_json({
                "type": "error",
                "code": "CALLER_BUSY",
                "message": "You are already in an active video call.",
            })
            return

        # Check receiver busy
        if VideoCallStateService.is_user_busy(receiver_id):
            await consumer.send_json({
                "type": "video_call_busy",
                "call_id": call_id,
                "receiver_id": receiver_id,
                "message": "User is currently busy on another video call.",
            })
            return

        # Create video call session
        call_data = VideoCallStateService.create_call(call_id, caller.id, receiver_id)
        if not call_data:
            await consumer.send_json({
                "type": "video_call_busy",
                "call_id": call_id,
                "receiver_id": receiver_id,
                "message": "User is currently busy.",
            })
            return

        caller_name = getattr(caller, "name", None) or getattr(caller, "username", None) or f"User {caller.id}"
        caller_avatar = getattr(caller, "profile_image_url", None) or getattr(caller, "profile_image", None) or ""

        # Deliver video_call_offer event to receiver
        await consumer.channel_layer.group_send(
            f"user_{receiver_id}",
            {
                "type": "video.call.event",
                "data": {
                    "type": "video_call_offer",
                    "call_id": call_id,
                    "caller_id": caller.id,
                    "caller_name": caller_name,
                    "caller_avatar": str(caller_avatar) if caller_avatar else "",
                    "sdp": sdp,
                }
            }
        )

        # Acknowledge caller
        await consumer.send_json({
            "type": "video_call_initiated",
            "call_id": call_id,
            "receiver_id": receiver_id,
            "status": VideoCallState.CALLING,
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

        call = VideoCallStateService.get_call(call_id)
        if not call:
            await consumer.send_json({
                "type": "error",
                "code": "CALL_NOT_FOUND",
                "message": "Video call session does not exist or has expired.",
            })
            return

        if call.get("receiver_id") != user.id:
            await consumer.send_json({
                "type": "error",
                "code": "UNAUTHORIZED_ACTION",
                "message": "You are not authorized to answer this video call.",
            })
            return

        if call.get("state") not in (VideoCallState.CALLING, VideoCallState.RINGING):
            await consumer.send_json({
                "type": "error",
                "code": "INVALID_CALL_STATE",
                "message": f"Cannot answer video call in '{call.get('state')}' state.",
            })
            return

        VideoCallStateService.update_call_state(call_id, VideoCallState.CONNECTED)
        caller_id = call["caller_id"]

        # Route answer to caller
        await consumer.channel_layer.group_send(
            f"user_{caller_id}",
            {
                "type": "video.call.event",
                "data": {
                    "type": "video_call_answer",
                    "call_id": call_id,
                    "receiver_id": user.id,
                    "sdp": sdp,
                }
            }
        )

        await consumer.send_json({
            "type": "video_call_connected",
            "call_id": call_id,
            "status": VideoCallState.CONNECTED,
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

        call = VideoCallStateService.get_call(call_id)
        if not call:
            await consumer.send_json({
                "type": "error",
                "code": "CALL_NOT_FOUND",
                "message": "Video call session does not exist.",
            })
            return

        caller_id = call.get("caller_id")
        receiver_id = call.get("receiver_id")

        if user.id not in (caller_id, receiver_id):
            await consumer.send_json({
                "type": "error",
                "code": "UNAUTHORIZED_ACTION",
                "message": "You are not a participant in this video call.",
            })
            return

        if call.get("state") in VideoCallState.TERMINAL_STATES:
            await consumer.send_json({
                "type": "error",
                "code": "INVALID_CALL_STATE",
                "message": "Cannot send ICE candidate for a terminated video call.",
            })
            return

        target_user_id = receiver_id if user.id == caller_id else caller_id

        await consumer.channel_layer.group_send(
            f"user_{target_user_id}",
            {
                "type": "video.call.event",
                "data": {
                    "type": "video_ice_candidate",
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

        call = VideoCallStateService.get_call(call_id)
        if not call:
            return

        caller_id = call.get("caller_id")
        receiver_id = call.get("receiver_id")

        if user.id != receiver_id:
            await consumer.send_json({
                "type": "error",
                "code": "UNAUTHORIZED_ACTION",
                "message": "Only the receiver can reject a video call.",
            })
            return

        VideoCallStateService.update_call_state(call_id, VideoCallState.REJECTED)

        await consumer.channel_layer.group_send(
            f"user_{caller_id}",
            {
                "type": "video.call.event",
                "data": {
                    "type": "video_call_reject",
                    "call_id": call_id,
                    "receiver_id": user.id,
                    "reason": content.get("reason", "Call rejected by user"),
                }
            }
        )

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

        call = VideoCallStateService.get_call(call_id)
        if not call:
            return

        caller_id = call.get("caller_id")
        receiver_id = call.get("receiver_id")

        if user.id != caller_id:
            await consumer.send_json({
                "type": "error",
                "code": "UNAUTHORIZED_ACTION",
                "message": "Only the caller can cancel a video call.",
            })
            return

        VideoCallStateService.update_call_state(call_id, VideoCallState.CANCELLED)

        await consumer.channel_layer.group_send(
            f"user_{receiver_id}",
            {
                "type": "video.call.event",
                "data": {
                    "type": "video_call_cancel",
                    "call_id": call_id,
                    "caller_id": user.id,
                }
            }
        )

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

        call = VideoCallStateService.get_call(call_id)
        if not call:
            return

        caller_id = call.get("caller_id")
        receiver_id = call.get("receiver_id")

        if user.id not in (caller_id, receiver_id):
            await consumer.send_json({
                "type": "error",
                "code": "UNAUTHORIZED_ACTION",
                "message": "You are not a participant in this video call.",
            })
            return

        VideoCallStateService.update_call_state(call_id, VideoCallState.ENDED)
        target_user_id = receiver_id if user.id == caller_id else caller_id

        await consumer.channel_layer.group_send(
            f"user_{target_user_id}",
            {
                "type": "video.call.event",
                "data": {
                    "type": "video_call_end",
                    "call_id": call_id,
                    "sender_id": user.id,
                    "reason": content.get("reason", "Call ended normally"),
                }
            }
        )

    @classmethod
    async def handle_call_busy(cls, consumer, content: Dict[str, Any]):
        user = consumer.user
        call_id = content.get("call_id")

        if not call_id:
            return

        call = VideoCallStateService.get_call(call_id)
        if not call:
            return

        caller_id = call.get("caller_id")
        receiver_id = call.get("receiver_id")

        if user.id != receiver_id:
            return

        VideoCallStateService.update_call_state(call_id, VideoCallState.BUSY)

        await consumer.channel_layer.group_send(
            f"user_{caller_id}",
            {
                "type": "video.call.event",
                "data": {
                    "type": "video_call_busy",
                    "call_id": call_id,
                    "receiver_id": user.id,
                    "message": "User is busy on another call.",
                }
            }
        )
