from datetime import datetime
from typing import Dict, List, Optional, Tuple
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.utils import timezone

User = get_user_model()


class PresenceService:
    CONN_KEY_PREFIX = "presence_conn_"
    LAST_SEEN_PREFIX = "presence_last_seen_"

    def _get_conn_key(self, user_id: int) -> str:
        return f"{self.CONN_KEY_PREFIX}{user_id}"

    def _get_last_seen_key(self, user_id: int) -> str:
        return f"{self.LAST_SEEN_PREFIX}{user_id}"

    def user_connected(self, user_id: int) -> bool:
        """
        Increments active WebSocket connection count for a user.
        Returns True if this is the user's first active connection (user became ONLINE).
        """
        conn_key = self._get_conn_key(user_id)
        try:
            count = cache.incr(conn_key)
        except (ValueError, Exception):
            cache.set(conn_key, 1, timeout=None)
            count = 1

        return count == 1

    def user_disconnected(self, user_id: int) -> Tuple[bool, Optional[str]]:
        """
        Decrements active WebSocket connection count for a user.
        Returns (True, last_seen_iso) if the user's last connection closed (user became OFFLINE).
        Returns (False, None) if the user still has other active connections (e.g. other tabs).
        """
        conn_key = self._get_conn_key(user_id)
        try:
            count = cache.decr(conn_key)
            if count <= 0:
                cache.delete(conn_key)
                count = 0
        except (ValueError, Exception):
            cache.delete(conn_key)
            count = 0

        if count == 0:
            now = timezone.now()
            last_seen_iso = now.isoformat().replace("+00:00", "Z")
            cache.set(self._get_last_seen_key(user_id), last_seen_iso, timeout=None)
            self._update_db_last_seen(user_id, now)
            return True, last_seen_iso

        return False, None

    def is_user_online(self, user_id: int) -> bool:
        """
        Checks if a user has at least one active WebSocket connection.
        """
        conn_key = self._get_conn_key(user_id)
        try:
            count = cache.get(conn_key)
            return count is not None and int(count) > 0
        except Exception:
            return False

    def get_user_presence(self, user_id: int) -> Dict[str, Optional[str]]:
        """
        Returns {'status': 'online'|'offline', 'last_seen': iso_str|None} for a user.
        """
        is_online = self.is_user_online(user_id)
        if is_online:
            return {"status": "online", "last_seen": None}

        last_seen = cache.get(self._get_last_seen_key(user_id))
        if not last_seen:
            try:
                user = User.objects.only("last_seen").get(id=user_id)
                if user.last_seen:
                    last_seen = user.last_seen.isoformat().replace("+00:00", "Z")
            except User.DoesNotExist:
                last_seen = None

        return {
            "status": "offline",
            "last_seen": last_seen,
        }

    def get_users_presence(self, user_ids: List[int]) -> Dict[int, Dict[str, Optional[str]]]:
        """
        Batch presence check for a list of user IDs.
        """
        if not user_ids:
            return {}

        conn_keys = {self._get_conn_key(uid): uid for uid in user_ids}
        cached_counts = cache.get_many(list(conn_keys.keys()))

        results = {}
        for key, uid in conn_keys.items():
            cnt = cached_counts.get(key)
            is_online = cnt is not None and int(cnt) > 0
            if is_online:
                results[uid] = {"status": "online", "last_seen": None}
            else:
                results[uid] = {"status": "offline", "last_seen": None}

        return results

    def _update_db_last_seen(self, user_id: int, dt: datetime):
        try:
            User.objects.filter(id=user_id).update(last_seen=dt)
        except Exception:
            pass
