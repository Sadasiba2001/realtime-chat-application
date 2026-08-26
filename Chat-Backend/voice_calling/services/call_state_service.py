import time
from typing import Optional, Dict, Any
from django.core.cache import cache


class CallState:
    IDLE = "IDLE"
    CALLING = "CALLING"
    RINGING = "RINGING"
    CONNECTING = "CONNECTING"
    CONNECTED = "CONNECTED"
    REJECTED = "REJECTED"
    BUSY = "BUSY"
    CANCELLED = "CANCELLED"
    ENDED = "ENDED"

    ACTIVE_STATES = {CALLING, RINGING, CONNECTING, CONNECTED}
    TERMINAL_STATES = {REJECTED, BUSY, CANCELLED, ENDED, IDLE}


class CallStateService:
    """
    Manages short-lived 1-to-1 voice call state in memory/cache.
    Prevents multiple concurrent calls for the same user.
    """
    CALL_TTL = 3600  # 1 hour maximum call timeout in cache
    RINGING_TIMEOUT = 60  # seconds before unaccepted call expires

    @staticmethod
    def _call_key(call_id: str) -> str:
        return f"voice_call_{call_id}"

    @staticmethod
    def _user_call_key(user_id: int) -> str:
        return f"voice_active_call_user_{user_id}"

    @classmethod
    def get_call(cls, call_id: str) -> Optional[Dict[str, Any]]:
        if not call_id:
            return None
        return cache.get(cls._call_key(call_id))

    @classmethod
    def get_user_active_call_id(cls, user_id: int) -> Optional[str]:
        call_id = cache.get(cls._user_call_key(user_id))
        if not call_id:
            return None
        
        call = cls.get_call(call_id)
        if not call or call.get("state") in CallState.TERMINAL_STATES:
            cache.delete(cls._user_call_key(user_id))
            return None

        # Check ringing/calling timeout (unaccepted call expires after RINGING_TIMEOUT seconds)
        now = time.time()
        created_at = call.get("created_at", now)
        if call.get("state") in (CallState.CALLING, CallState.RINGING, CallState.CONNECTING) and (now - created_at) > cls.RINGING_TIMEOUT:
            cls.terminate_call(call_id, CallState.CANCELLED)
            cache.delete(cls._user_call_key(user_id))
            return None

        return call_id

    @classmethod
    def is_user_busy(cls, user_id: int) -> bool:
        return cls.get_user_active_call_id(user_id) is not None

    @classmethod
    def cleanup_user_calls(cls, user_id: int) -> Optional[str]:
        """
        Cleans up any active voice call session if the user disconnects abruptly.
        Returns the call_id if an active call was ended, or None.
        """
        call_id = cls.get_user_active_call_id(user_id)
        if call_id:
            cls.terminate_call(call_id, CallState.ENDED)
            return call_id
        return None

    @classmethod
    def create_call(cls, call_id: str, caller_id: int, receiver_id: int) -> Optional[Dict[str, Any]]:
        """
        Attempts to create a new call record.
        Returns None if caller or receiver is already in an active call.
        """
        if cls.is_user_busy(caller_id) or cls.is_user_busy(receiver_id):
            return None

        now = time.time()
        call_data = {
            "call_id": call_id,
            "caller_id": caller_id,
            "receiver_id": receiver_id,
            "state": CallState.CALLING,
            "created_at": now,
            "updated_at": now,
        }

        cache.set(cls._call_key(call_id), call_data, timeout=cls.CALL_TTL)
        cache.set(cls._user_call_key(caller_id), call_id, timeout=cls.CALL_TTL)
        cache.set(cls._user_call_key(receiver_id), call_id, timeout=cls.CALL_TTL)

        return call_data

    @classmethod
    def update_call_state(cls, call_id: str, new_state: str) -> Optional[Dict[str, Any]]:
        call = cls.get_call(call_id)
        if not call:
            return None

        call["state"] = new_state
        call["updated_at"] = time.time()

        if new_state in CallState.TERMINAL_STATES:
            # Clear user active locks
            caller_id = call.get("caller_id")
            receiver_id = call.get("receiver_id")
            if caller_id:
                cache.delete(cls._user_call_key(caller_id))
            if receiver_id:
                cache.delete(cls._user_call_key(receiver_id))
            # Retain terminal state briefly for query before garbage collection
            cache.set(cls._call_key(call_id), call, timeout=30)
        else:
            cache.set(cls._call_key(call_id), call, timeout=cls.CALL_TTL)

        return call

    @classmethod
    def terminate_call(cls, call_id: str, final_state: str = CallState.ENDED) -> Optional[Dict[str, Any]]:
        return cls.update_call_state(call_id, final_state)
