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
from typing import Dict, Iterable, List, Optional, Tuple

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
    # Set while partners have been told a user is ONLINE; deleting it (atomic, returns whether
    # it existed) decides who emits the single matching OFFLINE event.
    ANNOUNCED_PREFIX = "presence:announced:"
    ANNOUNCED_INDEX_KEY = "presence:announced_index"
    SWEEP_LOCK_KEY = "presence:sweep"

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

    def _announced_key(self, user_id) -> str:
        return f"{self.ANNOUNCED_PREFIX}{user_id}"

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

    def _add_entry_unlocked(self, key: str, connection_id: str) -> int:
        """Adds/refreshes one connection (caller holds the key's lock). Returns live_before."""
        now = self._now()
        entries = self._live(cache.get(key), now)
        live_before = len(entries)
        entries[connection_id] = now + self.CONNECTION_TTL
        cache.set(key, entries, timeout=self.CONNECTION_TTL)
        return live_before

    def _remove_entry_unlocked(self, key: str, connection_id: str) -> int:
        """Removes one connection (caller holds the key's lock). Returns live_remaining."""
        entries = self._live(cache.get(key), self._now())
        entries.pop(connection_id, None)
        if entries:
            cache.set(key, entries, timeout=self.CONNECTION_TTL)
        else:
            cache.delete(key)
        return len(entries)

    def _update_announced_index(self, user_id, present: bool):
        with self._locked(self.ANNOUNCED_INDEX_KEY):
            index = cache.get(self.ANNOUNCED_INDEX_KEY)
            index = index if isinstance(index, dict) else {}
            if present:
                index[str(user_id)] = True
            else:
                index.pop(str(user_id), None)
            cache.set(self.ANNOUNCED_INDEX_KEY, index, timeout=None)

    def _announce_online(self, user_id) -> bool:
        """Marks the user as announced ONLINE. True only for the caller that set the marker."""
        if cache.add(self._announced_key(user_id), 1, timeout=None):
            self._update_announced_index(user_id, True)
            return True
        return False

    def _announce_offline(self, user_id) -> bool:
        """Clears the ONLINE marker. True only for the caller that actually removed it."""
        removed = bool(cache.delete(self._announced_key(user_id)))
        if removed:
            self._update_announced_index(user_id, False)
        return removed

    def _record_offline(self, user_id, last_seen_iso: Optional[str] = None) -> str:
        now = timezone.now()
        if not last_seen_iso:
            last_seen_iso = now.isoformat().replace("+00:00", "Z")
            cache.set(self._last_seen_key(user_id), last_seen_iso, timeout=None)
        try:
            dt = datetime.fromisoformat(last_seen_iso.replace("Z", "+00:00"))
        except ValueError:
            dt = now
        self._update_db_last_seen(user_id, dt)
        return last_seen_iso

    # ---------------------------------------------------------- connection API

    def user_connected(self, user_id: int, connection_id: str, ip_address: Optional[str] = None) -> bool:
        """
        Registers one WebSocket connection.
        Returns True when this made the user go from OFFLINE to ONLINE.
        """
        key = self._user_key(user_id)
        with self._locked(key):
            live_before = self._add_entry_unlocked(key, connection_id)
            became_online = live_before == 0 and self._announce_online(user_id)
        if ip_address:
            ip_key = self._ip_key(ip_address)
            with self._locked(ip_key):
                self._add_entry_unlocked(ip_key, connection_id)
        return became_online

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
            ip_key = self._ip_key(ip_address)
            with self._locked(ip_key):
                self._remove_entry_unlocked(ip_key, connection_id)

        key = self._user_key(user_id)
        with self._locked(key):
            remaining = self._remove_entry_unlocked(key, connection_id)
            became_offline = remaining == 0 and self._announce_offline(user_id)
        if not became_offline:
            return False, None
        return True, self._record_offline(user_id)

    def sweep_expired(self) -> List[Tuple[int, str]]:
        """
        Finds users announced ONLINE whose connections have all expired without a clean
        disconnect (crash, lost network) and flips them OFFLINE exactly once.
        Returns [(user_id, last_seen_iso)] for the caller to broadcast. At most one caller per
        heartbeat interval (across all processes sharing the cache) does the work.
        """
        if not cache.add(self.SWEEP_LOCK_KEY, 1, timeout=self.HEARTBEAT_INTERVAL):
            return []
        index = cache.get(self.ANNOUNCED_INDEX_KEY)
        if not isinstance(index, dict) or not index:
            return []
        expired = []
        for raw_id in list(index.keys()):
            try:
                user_id = int(raw_id)
            except (TypeError, ValueError):
                self._update_announced_index(raw_id, False)
                continue
            key = self._user_key(user_id)
            with self._locked(key):
                if self._live(cache.get(key), self._now()):
                    continue
                if not self._announce_offline(user_id):
                    self._update_announced_index(user_id, False)
                    continue
            last_seen = cache.get(self._last_seen_key(user_id))
            expired.append((user_id, self._record_offline(user_id, last_seen)))
        return expired

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
