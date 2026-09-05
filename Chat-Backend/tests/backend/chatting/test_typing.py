from django.contrib.auth import get_user_model
from django.test import TestCase
from asgiref.sync import async_to_sync
from channels.testing import WebsocketCommunicator
from chatting_service.consumers.chat_consumer import ChatConsumer

User = get_user_model()


class TypingIndicatorUnitTests(TestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(email="typ1@example.com", username="typ1", password="Password123!")
        self.user2 = User.objects.create_user(email="typ2@example.com", username="typ2", password="Password123!")

    def test_typing_start_and_stop_routing(self):
        async def _test():
            communicator = WebsocketCommunicator(ChatConsumer.as_asgi(), "/ws/chat/")
            communicator.scope["user"] = self.user1

            connected, _ = await communicator.connect()
            self.assertTrue(connected)

            await communicator.receive_json_from()

            await communicator.send_json_to({
                "type": "typing_start",
                "target_user_id": self.user2.id,
            })

            await communicator.send_json_to({
                "type": "typing_stop",
                "target_user_id": self.user2.id,
            })

            await communicator.disconnect()

        async_to_sync(_test)()
