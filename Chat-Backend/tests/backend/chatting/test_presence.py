from django.contrib.auth import get_user_model
from django.test import TransactionTestCase
from asgiref.sync import async_to_sync
from channels.testing import WebsocketCommunicator
from chatting_service.services import PresenceService
from chatting_service.consumers.chat_consumer import ChatConsumer

from django.core.cache import cache

User = get_user_model()


class PresenceServiceUnitTests(TransactionTestCase):
    def setUp(self):
        cache.clear()
        self.presence_service = PresenceService()
        self.user1 = User.objects.create_user(email="prs1@example.com", username="prs1", password="Password123!")
        self.user2 = User.objects.create_user(email="prs2@example.com", username="prs2", password="Password123!")

    def test_single_and_multi_connection_lifecycle(self):
        # 1. User initially offline
        self.assertFalse(self.presence_service.is_user_online(self.user1.id))

        # 2. First tab connects -> becomes ONLINE
        is_first_tab1 = self.presence_service.user_connected(self.user1.id)
        self.assertTrue(is_first_tab1)
        self.assertTrue(self.presence_service.is_user_online(self.user1.id))

        # 3. Second tab connects -> remains ONLINE (not first connection)
        is_first_tab2 = self.presence_service.user_connected(self.user1.id)
        self.assertFalse(is_first_tab2)
        self.assertTrue(self.presence_service.is_user_online(self.user1.id))

        # 4. First tab disconnects -> remains ONLINE (tab 2 still active)
        is_last_tab1, last_seen1 = self.presence_service.user_disconnected(self.user1.id)
        self.assertFalse(is_last_tab1)
        self.assertIsNone(last_seen1)
        self.assertTrue(self.presence_service.is_user_online(self.user1.id))

        # 5. Second tab disconnects -> becomes OFFLINE
        is_last_tab2, last_seen2 = self.presence_service.user_disconnected(self.user1.id)
        self.assertTrue(is_last_tab2)
        self.assertIsNotNone(last_seen2)
        self.assertFalse(self.presence_service.is_user_online(self.user1.id))

    def test_get_users_presence_batch(self):
        self.presence_service.user_connected(self.user1.id)
        presence_map = self.presence_service.get_users_presence([self.user1.id, self.user2.id])
        self.assertEqual(presence_map[self.user1.id]["status"], "online")
        self.assertEqual(presence_map[self.user2.id]["status"], "offline")

    def test_websocket_presence_broadcast(self):
        async def _test():
            communicator = WebsocketCommunicator(ChatConsumer.as_asgi(), "/ws/chat/")
            communicator.scope["user"] = self.user1
            connected, _ = await communicator.connect()
            self.assertTrue(connected)
            await communicator.receive_json_from()
            await communicator.disconnect()

        async_to_sync(_test)()
