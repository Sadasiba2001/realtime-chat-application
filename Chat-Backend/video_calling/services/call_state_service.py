import time
import logging
from typing import Optional, Dict, Any
from django.core.cache import cache

logger = logging.getLogger(__name__)


class VideoCallState:
    IDLE = "idle"
    CALLING = "calling"
    RINGING = "ringing"
    ACCEPTED = "accepted"
    CONNECTING = "connecting"
    CONNECTED = "connected"
    REJECTED = "rejected"
    BUSY = "busy"
    CANCELLED = "cancelled"
    ENDED = "ended"
    FAILED = "failed"

    TERMINAL_STATES = {REJECTED, BUSY, CANCELLED, ENDED, FAILED}
    ACTIVE_STATES = {CALLING, RINGING, ACCEPTED, CONNECTING, CONNECTED}


class VideoCallStateService:
    """
    Manages active 1-to-1 video call sessions, state transitions,
    and user occupancy locks in cache with safe TTL expiration.
    """

    CALL_PREFIX = "video_call_session_"
    USER_LOCK_PREFIX = "video_user_active_call_"
    CALL_TTL = 3600  # 1 hour max session TTL
    RINGING_TTL = 60  # 60s max ringing TTL

    @classmethod
    def create_call(cls, call_id: str, caller_id: int, receiver_id: int) -> Optional[Dict[str, Any]]:
        """
        Creates a new video call session and locks caller and receiver if not busy.
        Returns the call session dict if created, or None if already busy/exists.
        """
        if cls.is_user_busy(caller_id) or cls.is_user_busy(receiver_id):
            logger.warning(f"[VideoCallState] Cannot create call {call_id}: participant busy.")
            return None

        call_data = {
            "call_id": call_id,
            "caller_id": caller_id,
            "receiver_id": receiver_id,
            "state": VideoCallState.CALLING,
            "created_at": time.time(),
            "updated_at": time.time(),
        }

        # Store session
        cache.set(f"{cls.CALL_PREFIX}{call_id}", call_data, timeout=cls.CALL_TTL)

        # Set user locks
        cache.set(f"{cls.USER_LOCK_PREFIX}{caller_id}", call_id, timeout=cls.CALL_TTL)
        cache.set(f"{cls.USER_LOCK_PREFIX}{receiver_id}", call_id, timeout=cls.CALL_TTL)

        logger.info(f"[VideoCallState] Video call session created: {call_id} (caller={caller_id}, receiver={receiver_id})")
        return call_data

    @classmethod
    def get_call(cls, call_id: str) -> Optional[Dict[str, Any]]:
        return cache.get(f"{cls.CALL_PREFIX}{call_id}")

    @classmethod
    def is_user_busy(cls, user_id: int) -> bool:
        call_id = cache.get(f"{cls.USER_LOCK_PREFIX}{user_id}")
        if not call_id:
            return False

        call = cls.get_call(call_id)
        if not call or call.get("state") in VideoCallState.TERMINAL_STATES:
            # Stale lock cleanup
            cache.delete(f"{cls.USER_LOCK_PREFIX}{user_id}")
            return False

        return True

    @classmethod
    def get_user_active_call(cls, user_id: int) -> Optional[str]:
        call_id = cache.get(f"{cls.USER_LOCK_PREFIX}{user_id}")
        if not call_id:
            return None

        call = cls.get_call(call_id)
        if not call or call.get("state") in VideoCallState.TERMINAL_STATES:
            cache.delete(f"{cls.USER_LOCK_PREFIX}{user_id}")
            return None

        return call_id

    @classmethod
    def update_call_state(cls, call_id: str, new_state: str) -> Optional[Dict[str, Any]]:
        call_data = cls.get_call(call_id)
        if not call_data:
            return None

        call_data["state"] = new_state
        call_data["updated_at"] = time.time()

        if new_state in VideoCallState.TERMINAL_STATES:
            # Release user locks on terminal states
            caller_id = call_data.get("caller_id")
            receiver_id = call_data.get("receiver_id")
            if caller_id:
                cache.delete(f"{cls.USER_LOCK_PREFIX}{caller_id}")
            if receiver_id:
                cache.delete(f"{cls.USER_LOCK_PREFIX}{receiver_id}")

            # Keep terminal record briefly in cache
            cache.set(f"{cls.CALL_PREFIX}{call_id}", call_data, timeout=30)
            logger.info(f"[VideoCallState] Video call {call_id} transitioned to terminal state: {new_state}")
        else:
            cache.set(f"{cls.CALL_PREFIX}{call_id}", call_data, timeout=cls.CALL_TTL)
            logger.info(f"[VideoCallState] Video call {call_id} state updated to: {new_state}")

        return call_data

    @classmethod
    def end_call(cls, call_id: str) -> Optional[Dict[str, Any]]:
        return cls.update_call_state(call_id, VideoCallState.ENDED)

    @classmethod
    def cleanup_user_calls(cls, user_id: int) -> Optional[str]:
        """
        Cleans up any active video call session if the user disconnects abruptly.
        Returns the call_id if an active call was ended, or None.
        """
        call_id = cls.get_user_active_call(user_id)
        if call_id:
            cls.end_call(call_id)
            return call_id
        return None
