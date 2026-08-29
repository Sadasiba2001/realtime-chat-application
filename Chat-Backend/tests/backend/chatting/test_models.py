from django.test import TestCase
from django.contrib.auth import get_user_model
from chatting_service.models import Message, MessageStatus

User = get_user_model()


class ChattingModelTests(TestCase):
    def setUp(self):
        self.sender = User.objects.create_user(email="sender@example.com", username="sender", password="Password123!")
        self.receiver = User.objects.create_user(email="receiver@example.com", username="receiver", password="Password123!")

    def test_create_message_default_status(self):
        msg = Message.objects.create(
            sender=self.sender,
            receiver=self.receiver,
            content="Hello world message"
        )
        self.assertEqual(msg.sender, self.sender)
        self.assertEqual(msg.receiver, self.receiver)
        self.assertEqual(msg.content, "Hello world message")
        self.assertEqual(msg.status, MessageStatus.SENT)
        self.assertIsNotNone(msg.created_at)

    def test_message_str_representation(self):
        msg = Message.objects.create(
            sender=self.sender,
            receiver=self.receiver,
            content="Test str"
        )
        self.assertIn("Message", str(msg))
        self.assertIn("Test str", str(msg))
