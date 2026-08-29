from django.test import TransactionTestCase
from django.contrib.auth import get_user_model
from channels.testing import WebsocketCommunicator
from chatting_service.consumers.chat_consumer import ChatConsumer

User = get_user_model()


class ChatConsumerTests(TransactionTestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(email="ws1@example.com", username="ws1", password="Password123!")
        self.user2 = User.objects.create_user(email="ws2@example.com", username="ws2", password="Password123!")

    async def test_unauthenticated_connection_rejected(self):
        communicator = WebsocketCommunicator(ChatConsumer.as_asgi(), "/ws/chat/")
        communicator.scope["user"] = None
        connected, close_code = await communicator.connect()
        self.assertFalse(connected)

    async def test_authenticated_connection_accepted(self):
        communicator = WebsocketCommunicator(ChatConsumer.as_asgi(), "/ws/chat/")
        communicator.scope["user"] = self.user1
        communicator.scope["subprotocols"] = ["access_token"]
        connected, close_code = await communicator.connect()
        self.assertTrue(connected)

        # Connection acknowledgement message
        response = await communicator.receive_json_from()
        self.assertEqual(response["type"], "connection")
        await communicator.disconnect()
