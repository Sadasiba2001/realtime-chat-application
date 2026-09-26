import os
import threading
import unittest
import uuid
from unittest import mock

from asgiref.sync import async_to_sync
from channels.db import database_sync_to_async
from channels.testing import WebsocketCommunicator
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TransactionTestCase, override_settings

from chatting_service.consumers.chat_consumer import ChatConsumer
from chatting_service.repository import MessageRepository
from chatting_service.services import PresenceService
from channels.layers import get_channel_layer
from video_calling.consumers import VideoCallConsumer
from voice_calling.consumers import VoiceCallConsumer

User = get_user_model()


class FakeClock:
    def __init__(self, start=1_000_000.0):
        self.now = start

    def __call__(self):
        return self.now

    def advance(self, seconds):
        self.now += seconds


class PresenceServiceUnitTests(TransactionTestCase):
    def setUp(self):
        cache.clear()
        self.presence = PresenceService()
        self.user_a = User.objects.create_user(email="prs1@example.com", username="prs1", password="Password123!")
        self.user_b = User.objects.create_user(email="prs2@example.com", username="prs2", password="Password123!")

    def _conn(self):
        return PresenceService.new_connection_id()

    # Test 1
    def test_user_initially_offline(self):
        self.assertFalse(self.presence.is_user_online(self.user_a.id))
        self.assertEqual(self.presence.get_user_presence(self.user_a.id)["status"], "offline")

    # Test 2
    def test_first_connection_goes_online(self):
        became_online = self.presence.user_connected(self.user_a.id, self._conn())
        self.assertTrue(became_online)
        self.assertTrue(self.presence.is_user_online(self.user_a.id))

    # Test 3
    def test_second_connection_stays_online_without_new_transition(self):
        self.presence.user_connected(self.user_a.id, self._conn())
        became_online = self.presence.user_connected(self.user_a.id, self._conn())
        self.assertFalse(became_online)
        self.assertTrue(self.presence.is_user_online(self.user_a.id))
        self.assertEqual(self.presence.count_user_connections(self.user_a.id), 2)

    # Test 4
    def test_closing_one_of_two_connections_stays_online(self):
        tab1, tab2 = self._conn(), self._conn()
        self.presence.user_connected(self.user_a.id, tab1)
        self.presence.user_connected(self.user_a.id, tab2)
        became_offline, last_seen = self.presence.user_disconnected(self.user_a.id, tab1)
        self.assertFalse(became_offline)
        self.assertIsNone(last_seen)
        self.assertTrue(self.presence.is_user_online(self.user_a.id))

    # Test 5
    def test_last_connection_closing_goes_offline(self):
        tab1, tab2 = self._conn(), self._conn()
        self.presence.user_connected(self.user_a.id, tab1)
        self.presence.user_connected(self.user_a.id, tab2)
        self.presence.user_disconnected(self.user_a.id, tab1)
        became_offline, last_seen = self.presence.user_disconnected(self.user_a.id, tab2)
        self.assertTrue(became_offline)
        self.assertIsNotNone(last_seen)
        self.assertFalse(self.presence.is_user_online(self.user_a.id))
        self.user_a.refresh_from_db()
        self.assertIsNotNone(self.user_a.last_seen)

    # Test 6
    def test_stale_connection_expires_without_heartbeat(self):
        clock = FakeClock()
        with mock.patch.object(PresenceService, "_now", clock):
            self.presence.user_connected(self.user_a.id, self._conn())
            self.assertTrue(self.presence.is_user_online(self.user_a.id))

            clock.advance(PresenceService.CONNECTION_TTL - 1)
            self.assertTrue(self.presence.is_user_online(self.user_a.id))

            clock.advance(2)  # no heartbeat: TTL passed
            self.assertFalse(self.presence.is_user_online(self.user_a.id))
            self.assertEqual(self.presence.get_user_presence(self.user_a.id)["status"], "offline")

    def test_heartbeat_keeps_connection_alive_past_ttl(self):
        clock = FakeClock()
        conn = self._conn()
        with mock.patch.object(PresenceService, "_now", clock):
            self.presence.user_connected(self.user_a.id, conn)
            for _ in range(5):
                clock.advance(PresenceService.HEARTBEAT_INTERVAL)
                became_online = self.presence.heartbeat(self.user_a.id, conn)
                self.assertFalse(became_online)
            # Well past a single TTL since connecting, still online thanks to heartbeats.
            self.assertTrue(self.presence.is_user_online(self.user_a.id))

    def test_heartbeat_after_expiry(self):
        clock = FakeClock()
        conn = self._conn()
        with mock.patch.object(PresenceService, "_now", clock):
            self.presence.user_connected(self.user_a.id, conn)
            clock.advance(PresenceService.CONNECTION_TTL + 1)
            self.assertFalse(self.presence.is_user_online(self.user_a.id))
            # No sweep has broadcast OFFLINE yet, so partners still think ONLINE: no new event.
            self.assertFalse(self.presence.heartbeat(self.user_a.id, conn))
            self.assertTrue(self.presence.is_user_online(self.user_a.id))

            clock.advance(PresenceService.CONNECTION_TTL + 1)
            self.assertEqual([uid for uid, _ in self._sweep()], [self.user_a.id])
            # OFFLINE was broadcast; a late heartbeat must announce ONLINE again.
            self.assertTrue(self.presence.heartbeat(self.user_a.id, conn))

    # --- expiry sweep (stale connections that never ran disconnect) ---

    def _sweep(self):
        cache.delete(PresenceService.SWEEP_LOCK_KEY)
        return self.presence.sweep_expired()

    def test_sweep_emits_offline_once_when_final_connection_expires(self):
        clock = FakeClock()
        with mock.patch.object(PresenceService, "_now", clock):
            self.presence.user_connected(self.user_b.id, self._conn())
            self.assertEqual(self._sweep(), [])
            clock.advance(PresenceService.CONNECTION_TTL + 1)
            expired = self._sweep()
            self.assertEqual([uid for uid, _ in expired], [self.user_b.id])
            self.assertIsNotNone(expired[0][1])
            self.assertEqual(self._sweep(), [])  # no duplicate offline

    def test_sweep_ignores_partial_expiry(self):
        clock = FakeClock()
        with mock.patch.object(PresenceService, "_now", clock):
            self.presence.user_connected(self.user_b.id, self._conn())
            clock.advance(PresenceService.CONNECTION_TTL / 2)
            self.presence.user_connected(self.user_b.id, self._conn())
            clock.advance(PresenceService.CONNECTION_TTL / 2 + 1)  # first expired, second alive
            self.assertEqual(self._sweep(), [])
            self.assertTrue(self.presence.is_user_online(self.user_b.id))
            clock.advance(PresenceService.CONNECTION_TTL)  # second expired too
            self.assertEqual([uid for uid, _ in self._sweep()], [self.user_b.id])

    def test_late_disconnect_after_sweep_does_not_duplicate_offline(self):
        clock = FakeClock()
        conn = self._conn()
        with mock.patch.object(PresenceService, "_now", clock):
            self.presence.user_connected(self.user_b.id, conn)
            clock.advance(PresenceService.CONNECTION_TTL + 1)
            self.assertEqual(len(self._sweep()), 1)
            self.assertEqual(self.presence.user_disconnected(self.user_b.id, conn), (False, None))

    def test_sweep_after_clean_disconnect_emits_nothing(self):
        conn = self._conn()
        self.presence.user_connected(self.user_b.id, conn)
        self.assertTrue(self.presence.user_disconnected(self.user_b.id, conn)[0])
        self.assertEqual(self._sweep(), [])

    def test_reconnect_after_sweep_announces_online(self):
        clock = FakeClock()
        with mock.patch.object(PresenceService, "_now", clock):
            self.presence.user_connected(self.user_b.id, self._conn())
            clock.advance(PresenceService.CONNECTION_TTL + 1)
            self._sweep()
            self.assertTrue(self.presence.user_connected(self.user_b.id, self._conn()))

    def test_only_one_sweeper_per_interval(self):
        clock = FakeClock()
        with mock.patch.object(PresenceService, "_now", clock):
            self.presence.user_connected(self.user_b.id, self._conn())
            clock.advance(PresenceService.CONNECTION_TTL + 1)
            self.assertEqual(len(self._sweep()), 1)
            self.presence.user_connected(self.user_a.id, self._conn())
            clock.advance(PresenceService.CONNECTION_TTL + 1)
            self.assertEqual(self.presence.sweep_expired(), [])  # lock still held this interval

    # --- concurrent registry updates ---

    def test_concurrent_add_add_then_remove_keeps_survivor(self):
        a, b = self._conn(), self._conn()
        threads = [threading.Thread(target=self.presence.user_connected, args=(self.user_a.id, c)) for c in (a, b)]
        [t.start() for t in threads]
        [t.join() for t in threads]
        self.presence.user_disconnected(self.user_a.id, a)
        self.assertEqual(set(cache.get(self.presence._user_key(self.user_a.id))), {b})

    def test_concurrent_heartbeat_and_disconnect(self):
        a, b = self._conn(), self._conn()
        self.presence.user_connected(self.user_a.id, a)
        for _ in range(25):
            self.presence.user_connected(self.user_a.id, b)
            t1 = threading.Thread(target=self.presence.heartbeat, args=(self.user_a.id, a))
            t2 = threading.Thread(target=self.presence.user_disconnected, args=(self.user_a.id, b))
            t1.start(); t2.start(); t1.join(); t2.join()
            self.assertEqual(set(cache.get(self.presence._user_key(self.user_a.id))), {a})

    def test_many_concurrent_connections_are_not_lost(self):
        conns = [self._conn() for _ in range(30)]
        threads = [threading.Thread(target=self.presence.user_connected, args=(self.user_a.id, c)) for c in conns]
        [t.start() for t in threads]
        [t.join() for t in threads]
        self.assertEqual(self.presence.count_user_connections(self.user_a.id), 30)

    def test_stale_connection_does_not_count_towards_connection_limit(self):
        clock = FakeClock()
        with mock.patch.object(PresenceService, "_now", clock):
            self.presence.user_connected(self.user_a.id, self._conn(), "10.0.0.1")
            clock.advance(PresenceService.CONNECTION_TTL + 1)
            self.assertEqual(self.presence.count_user_connections(self.user_a.id), 0)
            self.assertEqual(self.presence.count_ip_connections("10.0.0.1"), 0)

    # Test 7
    def test_reconnect_after_offline(self):
        conn = self._conn()
        self.presence.user_connected(self.user_a.id, conn)
        self.presence.user_disconnected(self.user_a.id, conn)
        self.assertFalse(self.presence.is_user_online(self.user_a.id))
        self.assertTrue(self.presence.user_connected(self.user_a.id, self._conn()))
        self.assertTrue(self.presence.is_user_online(self.user_a.id))

    # Test 8
    def test_rapid_disconnect_reconnect(self):
        old = self._conn()
        self.presence.user_connected(self.user_a.id, old)
        for _ in range(10):
            new = self._conn()
            # New socket registers before the old socket's close is processed...
            self.assertFalse(self.presence.user_connected(self.user_a.id, new))
            became_offline, _ = self.presence.user_disconnected(self.user_a.id, old)
            # ...so closing the old one never reports offline.
            self.assertFalse(became_offline)
            self.assertTrue(self.presence.is_user_online(self.user_a.id))
            old = new
        self.assertEqual(self.presence.count_user_connections(self.user_a.id), 1)
        became_offline, _ = self.presence.user_disconnected(self.user_a.id, old)
        self.assertTrue(became_offline)
        self.assertFalse(self.presence.is_user_online(self.user_a.id))

    # Test 9
    def test_disconnect_cleanup_called_twice(self):
        tab1, tab2 = self._conn(), self._conn()
        self.presence.user_connected(self.user_a.id, tab1)
        self.presence.user_connected(self.user_a.id, tab2)

        self.assertEqual(self.presence.user_disconnected(self.user_a.id, tab1), (False, None))
        # Second cleanup of the same connection must not remove tab2 or go negative.
        self.assertEqual(self.presence.user_disconnected(self.user_a.id, tab1), (False, None))
        self.assertTrue(self.presence.is_user_online(self.user_a.id))
        self.assertEqual(self.presence.count_user_connections(self.user_a.id), 1)

        became_offline, _ = self.presence.user_disconnected(self.user_a.id, tab2)
        self.assertTrue(became_offline)
        # Repeating the final cleanup does not broadcast offline again.
        self.assertEqual(self.presence.user_disconnected(self.user_a.id, tab2), (False, None))
        self.assertEqual(self.presence.count_user_connections(self.user_a.id), 0)

    # Test 10
    def test_unknown_user_does_not_raise(self):
        unknown_id = 987654
        self.assertFalse(self.presence.is_user_online(unknown_id))
        self.assertEqual(self.presence.get_user_presence(unknown_id), {"status": "offline", "last_seen": None})
        self.assertEqual(self.presence.user_disconnected(unknown_id, self._conn()), (False, None))
        self.assertEqual(self.presence.get_users_presence([unknown_id])[unknown_id]["status"], "offline")

    # Test 11
    def test_connecting_user_a_does_not_make_user_b_online(self):
        self.presence.user_connected(self.user_a.id, self._conn())
        self.assertTrue(self.presence.is_user_online(self.user_a.id))
        self.assertFalse(self.presence.is_user_online(self.user_b.id))
        batch = self.presence.get_users_presence([self.user_a.id, self.user_b.id])
        self.assertEqual(batch[self.user_a.id]["status"], "online")
        self.assertEqual(batch[self.user_b.id]["status"], "offline")

    def test_old_last_seen_does_not_mean_online(self):
        from django.utils import timezone
        User.objects.filter(id=self.user_b.id).update(last_seen=timezone.now())
        self.assertEqual(self.presence.get_user_presence(self.user_b.id)["status"], "offline")

    def test_legacy_counter_key_is_ignored(self):
        # Counters written by the previous implementation never expired; they must not count.
        cache.set(f"presence_conn_{self.user_b.id}", 3, timeout=None)
        self.assertFalse(self.presence.is_user_online(self.user_b.id))


class PresenceWebSocketTests(TransactionTestCase):
    def setUp(self):
        cache.clear()
        self.user_a = User.objects.create_user(email="wsa@example.com", username="wsa", password="Password123!")
        self.user_b = User.objects.create_user(email="wsb@example.com", username="wsb", password="Password123!")
        # A conversation makes A and B presence partners.
        MessageRepository().create_message(self.user_a, self.user_b, "hello")
        self.presence = PresenceService()

    async def _connect(self, user):
        comm = WebsocketCommunicator(ChatConsumer.as_asgi(), "/ws/chat/")
        comm.scope["user"] = user
        connected, _ = await comm.connect()
        self.assertTrue(connected)
        first = await comm.receive_json_from()
        self.assertEqual(first["type"], "connection")
        return comm

    async def _next_presence(self, comm):
        while True:
            event = await comm.receive_json_from(timeout=2)
            if event.get("type") == "presence":
                return event

    def test_user_b_offline_until_it_connects_then_offline_after_disconnect(self):
        async def scenario():
            comm_a = await self._connect(self.user_a)
            self.assertTrue(self.presence.is_user_online(self.user_a.id))
            self.assertFalse(self.presence.is_user_online(self.user_b.id))
            # A must not hear about B before B actually connects.
            self.assertTrue(await comm_a.receive_nothing(timeout=0.3))

            comm_b = await self._connect(self.user_b)
            event = await self._next_presence(comm_a)
            self.assertEqual(event["user_id"], self.user_b.id)
            self.assertEqual(event["status"], "online")
            self.assertTrue(self.presence.is_user_online(self.user_b.id))

            await comm_b.disconnect()
            event = await self._next_presence(comm_a)
            self.assertEqual(event["user_id"], self.user_b.id)
            self.assertEqual(event["status"], "offline")
            self.assertIsNotNone(event.get("last_seen"))
            self.assertFalse(self.presence.is_user_online(self.user_b.id))
            self.assertTrue(self.presence.is_user_online(self.user_a.id))

            await comm_a.disconnect()
            self.assertFalse(self.presence.is_user_online(self.user_a.id))

        async_to_sync(scenario)()

    def test_multiple_tabs_keep_user_online_until_last_closes(self):
        async def scenario():
            comm_a = await self._connect(self.user_a)

            tab1 = await self._connect(self.user_b)
            event = await self._next_presence(comm_a)
            self.assertEqual(event["status"], "online")

            tab2 = await self._connect(self.user_b)
            # Second tab: no new broadcast, and tab 1 is not kicked out.
            self.assertTrue(await comm_a.receive_nothing(timeout=0.3))
            self.assertEqual(self.presence.count_user_connections(self.user_b.id), 2)

            await tab1.disconnect()
            self.assertTrue(await comm_a.receive_nothing(timeout=0.3))
            self.assertTrue(self.presence.is_user_online(self.user_b.id))

            await tab2.disconnect()
            event = await self._next_presence(comm_a)
            self.assertEqual(event["status"], "offline")
            self.assertFalse(self.presence.is_user_online(self.user_b.id))

            await comm_a.disconnect()

        async_to_sync(scenario)()

    def test_reconnect_after_disconnect_goes_online_again(self):
        async def scenario():
            comm_a = await self._connect(self.user_a)
            comm_b = await self._connect(self.user_b)
            self.assertEqual((await self._next_presence(comm_a))["status"], "online")
            await comm_b.disconnect()
            self.assertEqual((await self._next_presence(comm_a))["status"], "offline")

            comm_b = await self._connect(self.user_b)
            event = await self._next_presence(comm_a)
            self.assertEqual(event["status"], "online")
            self.assertTrue(self.presence.is_user_online(self.user_b.id))

            await comm_b.disconnect()
            await comm_a.disconnect()

        async_to_sync(scenario)()

    def test_expired_connection_is_broadcast_offline_to_watching_partner(self):
        async def scenario():
            comm_a = await self._connect(self.user_a)
            # B has a connection whose socket died without disconnect(): registered, never refreshed.
            await database_sync_to_async(self.presence.user_connected)(self.user_b.id, "ghost-connection")
            self.assertTrue(self.presence.is_user_online(self.user_b.id))

            event = await self._next_presence(comm_a)  # A's heartbeat loop runs the expiry sweep
            self.assertEqual(event["user_id"], self.user_b.id)
            self.assertEqual(event["status"], "offline")
            self.assertIsNotNone(event.get("last_seen"))
            self.assertFalse(self.presence.is_user_online(self.user_b.id))
            # Exactly one OFFLINE event.
            self.assertTrue(await comm_a.receive_nothing(timeout=0.5))
            await comm_a.disconnect()

        with mock.patch.object(PresenceService, "HEARTBEAT_INTERVAL", 0.1), \
                mock.patch.object(PresenceService, "CONNECTION_TTL", 0.3):
            async_to_sync(scenario)()


class CallConsumerGroupEventTests(TransactionTestCase):
    """VoiceCallConsumer/VideoCallConsumer share the user_<id> group with ChatConsumer."""

    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(email="call@example.com", username="caller", password="Password123!")

    async def _connect(self, consumer_cls, path):
        comm = WebsocketCommunicator(consumer_cls.as_asgi(), path)
        comm.scope["user"] = self.user
        connected, _ = await comm.connect()
        self.assertTrue(connected)
        await comm.receive_json_from()  # connection greeting
        return comm

    def test_presence_and_chat_events_do_not_break_call_consumers(self):
        async def scenario():
            voice = await self._connect(VoiceCallConsumer, "/ws/voice/")
            video = await self._connect(VideoCallConsumer, "/ws/video/")
            layer = get_channel_layer()
            group = f"user_{self.user.id}"
            for event in (
                {"type": "presence.event", "data": {"type": "presence", "user_id": 99, "status": "online"}},
                {"type": "chat.message", "data": {"type": "message"}},
                {"type": "message.status.event", "data": {}},
            ):
                await layer.group_send(group, event)
            # Ignored silently: nothing forwarded and no crash.
            self.assertTrue(await voice.receive_nothing(timeout=0.3))
            self.assertTrue(await video.receive_nothing(timeout=0.3))

            # Call events still reach them afterwards.
            await layer.group_send(group, {"type": "voice.call.event", "data": {"type": "call_end", "call_id": "x"}})
            self.assertEqual((await voice.receive_json_from())["type"], "call_end")
            await layer.group_send(group, {"type": "video.call.event", "data": {"type": "video_call_end", "call_id": "y"}})
            self.assertEqual((await video.receive_json_from())["type"], "video_call_end")

            await voice.disconnect()
            await video.disconnect()

        async_to_sync(scenario)()


REAL_REDIS_URL = os.environ.get("PRESENCE_TEST_REDIS_URL")


@unittest.skipUnless(REAL_REDIS_URL, "Set PRESENCE_TEST_REDIS_URL to a disposable local Redis to run")
class PresenceRealRedisTests(TransactionTestCase):
    """
    Runs the registry against a real Redis to exercise its atomic operations and locking.
    Use a throwaway local Redis only (e.g. redis://localhost:6379/15); keys are namespaced
    per run and are not flushed.
    """

    def setUp(self):
        self.override = override_settings(CACHES={
            "default": {
                "BACKEND": "django.core.cache.backends.redis.RedisCache",
                "LOCATION": REAL_REDIS_URL,
                "KEY_PREFIX": f"presence-test-{uuid.uuid4().hex}",
            }
        })
        self.override.enable()
        self.presence = PresenceService()
        self.user_id = 10_000_000 + uuid.uuid4().int % 1_000_000

    def tearDown(self):
        self.override.disable()

    def test_add_add_remove_keeps_survivor(self):
        a, b = PresenceService.new_connection_id(), PresenceService.new_connection_id()
        threads = [threading.Thread(target=self.presence.user_connected, args=(self.user_id, c)) for c in (a, b)]
        [t.start() for t in threads]
        [t.join() for t in threads]
        self.presence.user_disconnected(self.user_id, a)
        self.assertEqual(set(cache.get(self.presence._user_key(self.user_id))), {b})
        self.assertTrue(self.presence.user_disconnected(self.user_id, b)[0])

    def test_heartbeat_and_disconnect_race(self):
        a, b = PresenceService.new_connection_id(), PresenceService.new_connection_id()
        self.presence.user_connected(self.user_id, a)
        for _ in range(25):
            self.presence.user_connected(self.user_id, b)
            t1 = threading.Thread(target=self.presence.heartbeat, args=(self.user_id, a))
            t2 = threading.Thread(target=self.presence.user_disconnected, args=(self.user_id, b))
            t1.start(); t2.start(); t1.join(); t2.join()
            self.assertEqual(set(cache.get(self.presence._user_key(self.user_id))), {a})
        self.presence.user_disconnected(self.user_id, a)

    def test_many_concurrent_connections(self):
        conns = [PresenceService.new_connection_id() for _ in range(30)]
        threads = [threading.Thread(target=self.presence.user_connected, args=(self.user_id, c)) for c in conns]
        [t.start() for t in threads]
        [t.join() for t in threads]
        self.assertEqual(self.presence.count_user_connections(self.user_id), 30)
        for c in conns:
            self.presence.user_disconnected(self.user_id, c)
        self.assertFalse(self.presence.is_user_online(self.user_id))

    def test_expiry_of_one_connection_keeps_other(self):
        clock = FakeClock()
        with mock.patch.object(PresenceService, "_now", clock):
            self.presence.user_connected(self.user_id, "expiring")
            clock.advance(PresenceService.CONNECTION_TTL / 2)
            self.presence.user_connected(self.user_id, "alive")
            clock.advance(PresenceService.CONNECTION_TTL / 2 + 1)
            self.assertEqual(self.presence.count_user_connections(self.user_id), 1)
            self.assertTrue(self.presence.is_user_online(self.user_id))
            self.presence.user_disconnected(self.user_id, "alive")
