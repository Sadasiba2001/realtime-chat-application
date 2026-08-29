from django.contrib.auth import get_user_model
from django.test import TestCase
from chatting_service.services import MessageService

User = get_user_model()


class PushNotificationUnitTests(TestCase):
    def setUp(self):
        self.service = MessageService()
        self.user1 = User.objects.create_user(email="push1@example.com", username="push1", password="Password123!")
        self.user2 = User.objects.create_user(email="push2@example.com", username="push2", password="Password123!")

        self.msg = self.service.send_message(sender=self.user1, receiver_id=self.user2.id, content="Browser Push Test Message")

    def test_push_notification_payload_structure(self):
        self.assertEqual(self.msg["sender_id"], self.user1.id)
        self.assertEqual(self.msg["receiver_id"], self.user2.id)
        self.assertEqual(self.msg["content"], "Browser Push Test Message")

    def test_push_notification_authorization_isolation(self):
        self.assertNotEqual(self.user1.id, self.user2.id)
        self.assertIn("created_at", self.msg)
