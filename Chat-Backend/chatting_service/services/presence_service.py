"""
Connection-based user presence.

Every accepted WebSocket registers itself under a unique connection id. Each
registration carries its own expiry timestamp and is refreshed by a heartbeat
while the socket is alive. A user is ONLINE while at least one unexpired
connection exists and OFFLINE otherwise, so a connection whose disconnect
handler never ran (process crash, lost network, killed dev server) disappears
on its own once its TTL passes.

Storage uses the Django cache:
  * Redis (REDIS_URL set): shared by every backend process - required when
    running more than one worker/process.
  * LocMemCache (no REDIS_URL): process-local - only correct for a single local
    Django process. It is not a distributed presence store.
"""

import logging
import time
import uuid
from contextlib import contextmanager
from datetime import datetime
from typing import Dict, Iterable, Optional, Tuple

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.utils import timezone

logger = logging.getLogger(__name__)

User = get_user_model()


class PresenceService:
    USER_CONNECTIONS_PREFIX = "presence:user_conns:"
    IP_CONNECTIONS_PREFIX = "presence:ip_conns:"
    LAST_SEEN_PREFIX = "presence:last_seen:"
    LOCK_PREFIX = "presence:lock:"

    CONNECTION_TTL = getattr(settings, "PRESENCE_CONNECTION_TTL", 90)
    HEARTBEAT_INTERVAL = getattr(settings, "PRESENCE_HEARTBEAT_INTERVAL", 30)
    LOCK_TIMEOUT = 5
    LOCK_WAIT = 2.0

    # ------------------------------------------------------------------ helpers

    @staticmethod
    def new_connection_id() -> str:
        return uuid.uuid4().hex

    def _user_key(self, user_id) -> str:
        return f"{self.USER_CONNECTIONS_PREFIX}{user_id}"

    def _ip_key(self, ip_address: str) -> str:
        return f"{self.IP_CONNECTIONS_PREFIX}{ip_address}"

    def _last_seen_key(self, user_id) -> str:
        return f"{self.LAST_SEEN_PREFIX}{user_id}"

    @staticmethod
    def _now() -> float:
        return time.time()

    @staticmethod
    def _live(entries, now: float) -> Dict[str, float]:
        if not isinstance(entries, dict):
            return {}
        return {cid: exp for cid, exp in entries.items() if isinstance(exp, (int, float)) and exp > now}

    @contextmanager
    def _locked(self, key: str):
        """Short cache lock (cache.add is atomic in Redis and LocMem) around a registry update."""
        lock_key = f"{self.LOCK_PREFIX}{key}"
        token = uuid.uuid4().hex
        deadline = time.monotonic() + self.LOCK_WAIT
        acquired = False
        while True:
            if cache.add(lock_key, token, timeout=self.LOCK_TIMEOUT):
                acquired = True
                break
            if time.monotonic() >= deadline:
                logger.warning("[PRESENCE] Could not acquire lock for %s; updating without it", key)
                break
            time.sleep(0.01)
        try:
            yield
        finally:
            if acquired and cache.get(lock_key) == token:
                cache.delete(lock_key)

    def _add_entry(self, key: str, connection_id: str) -> Tuple[int, int]:
        """Adds/refreshes one connection. Returns (live_before, live_after)."""
        now = self._now()
        with self._locked(key):
            entries = self._live(cache.get(key), now)
            live_before = len(entries)
            entries[connection_id] = now + self.CONNECTION_TTL
            cache.set(key, entries, timeout=self.CONNECTION_TTL)
        return live_before, len(entries)

    def _remove_entry(self, key: str, connection_id: str) -> Tuple[bool, int]:
        """Removes one connection. Returns (was_present, live_remaining)."""
        now = self._now()
        with self._locked(key):
            raw = cache.get(key)
            entries = self._live(raw, now)
            was_present = isinstance(raw, dict) and connection_id in raw
            entries.pop(connection_id, None)
            if entries:
                cache.set(key, entries, timeout=self.CONNECTION_TTL)
            else:
                cache.delete(key)
        return was_present, len(entries)

    # ---------------------------------------------------------- connection API

    def user_connected(self, user_id: int, connection_id: str, ip_address: Optional[str] = None) -> bool:
        """
        Registers one WebSocket connection.
        Returns True when this made the user go from OFFLINE to ONLINE.
        """
        live_before, _ = self._add_entry(self._user_key(user_id), connection_id)
        if ip_address:
            self._add_entry(self._ip_key(ip_address), connection_id)
        return live_before == 0

    def heartbeat(self, user_id: int, connection_id: str, ip_address: Optional[str] = None) -> bool:
        """
        Refreshes a live connection's TTL. Returns True if the user had no other live
        connection (e.g. this entry had already expired), so callers can re-announce ONLINE.
        Also records the heartbeat time so a connection that later expires without a clean
        disconnect still reports a sensible last_seen.
        """
        became_online = self.user_connected(user_id, connection_id, ip_address)
        cache.set(
            self._last_seen_key(user_id),
            timezone.now().isoformat().replace("+00:00", "Z"),
            timeout=None,
        )
        return became_online

    def user_disconnected(
        self, user_id: int, connection_id: str, ip_address: Optional[str] = None
    ) -> Tuple[bool, Optional[str]]:
        """
        Removes one WebSocket connection. Safe to call more than once for the same id.
        Returns (True, last_seen_iso) only when this call removed the user's final live
        connection; otherwise (False, None).
        """
        if ip_address:
            self._remove_entry(self._ip_key(ip_address), connection_id)

        was_present, remaining = self._remove_entry(self._user_key(user_id), connection_id)
        if not was_present or remaining > 0:
            return False, None

        now = timezone.now()
        last_seen_iso = now.isoformat().replace("+00:00", "Z")
        cache.set(self._last_seen_key(user_id), last_seen_iso, timeout=None)
        self._update_db_last_seen(user_id, now)
        return True, last_seen_iso

    def count_user_connections(self, user_id: int) -> int:
        return len(self._live(cache.get(self._user_key(user_id)), self._now()))

    def count_ip_connections(self, ip_address: str) -> int:
        return len(self._live(cache.get(self._ip_key(ip_address)), self._now()))

    # ------------------------------------------------------------- read API

    def is_user_online(self, user_id: int) -> bool:
        """True only if the user has at least one unexpired connection."""
        try:
            return self.count_user_connections(user_id) > 0
        except Exception:
            logger.exception("[PRESENCE] Failed to read connection state for user %s", user_id)
            return False

    def get_user_presence(self, user_id: int) -> Dict[str, Optional[str]]:
        """
        Returns {'status': 'online'|'offline', 'last_seen': iso_str|None}.
        ONLINE is decided solely by live connections; last_seen is informational only.
        """
        if self.is_user_online(user_id):
            return {"status": "online", "last_seen": None}
        return {"status": "offline", "last_seen": self._last_seen(user_id)}

    def get_users_presence(self, user_ids: Iterable[int]) -> Dict[int, Dict[str, Optional[str]]]:
        """Batch presence check."""
        user_ids = list(user_ids or [])
        if not user_ids:
            return {}
        now = self._now()
        keys = {self._user_key(uid): uid for uid in user_ids}
        try:
            stored = cache.get_many(list(keys.keys()))
        except Exception:
            logger.exception("[PRESENCE] Failed to read batch connection state")
            stored = {}
        results = {}
        for key, uid in keys.items():
            if self._live(stored.get(key), now):
                results[uid] = {"status": "online", "last_seen": None}
            else:
                results[uid] = {"status": "offline", "last_seen": None}
        return results

    def _last_seen(self, user_id: int) -> Optional[str]:
        last_seen = cache.get(self._last_seen_key(user_id))
        if last_seen:
            return last_seen
        user = User.objects.filter(id=user_id).only("last_seen").first()
        if user and user.last_seen:
            return user.last_seen.isoformat().replace("+00:00", "Z")
        return None

    def _update_db_last_seen(self, user_id: int, dt: datetime):
        try:
            User.objects.filter(id=user_id).update(last_seen=dt)
        except Exception:
            logger.exception("[PRESENCE] Failed to persist last_seen for user %s", user_id)
