from django.contrib.auth import get_user_model
from django.test import TestCase
from chatting_service.services import MessageService

User = get_user_model()


from chatting_service.models import MessageReaction

class NotificationUnitTests(TestCase):
    def setUp(self):
        self.service = MessageService()
        self.user1 = User.objects.create_user(email="notif1@example.com", username="notif1", password="Password123!")
        self.user2 = User.objects.create_user(email="notif2@example.com", username="notif2", password="Password123!")

        self.msg = self.service.send_message(sender=self.user1, receiver_id=self.user2.id, content="Notification test message")

    def test_message_notification_payload_structure(self):
        self.assertEqual(self.msg["sender_id"], self.user1.id)
        self.assertEqual(self.msg["receiver_id"], self.user2.id)
        self.assertEqual(self.msg["content"], "Notification test message")
        self.assertIn("created_at", self.msg)

    def test_reaction_notification_payload_structure(self):
        rxn = MessageReaction.objects.create(message_id=self.msg["id"], user=self.user2, emoji="❤️")
        self.assertEqual(rxn.message_id, self.msg["id"])
        self.assertEqual(rxn.user_id, self.user2.id)
        self.assertEqual(rxn.emoji, "❤️")
