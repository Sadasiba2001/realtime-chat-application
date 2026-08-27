from django.test import TestCase
from django.contrib.auth import get_user_model
from chatting_service.services import MessageService

User = get_user_model()


class MessageServiceTests(TestCase):
    def setUp(self):
        self.service = MessageService()
        self.user1 = User.objects.create_user(email="svc1@example.com", username="svc1", password="Password123!")
        self.user2 = User.objects.create_user(email="svc2@example.com", username="svc2", password="Password123!")

    def test_send_message_success(self):
        msg_data = self.service.send_message(sender=self.user1, receiver_id=self.user2.id, content="Service test")
        self.assertEqual(msg_data["content"], "Service test")
        self.assertEqual(msg_data["sender_id"], self.user1.id)

    def test_send_empty_message_raises_error(self):
        with self.assertRaises(ValueError):
            self.service.send_message(sender=self.user1, receiver_id=self.user2.id, content="   ")

    def test_send_message_to_self_raises_error(self):
        with self.assertRaises(ValueError):
            self.service.send_message(sender=self.user1, receiver_id=self.user1.id, content="Self chat")

    def test_send_message_to_nonexistent_user_raises_error(self):
        with self.assertRaises(ValueError):
            self.service.send_message(sender=self.user1, receiver_id=999999, content="Ghost user")
