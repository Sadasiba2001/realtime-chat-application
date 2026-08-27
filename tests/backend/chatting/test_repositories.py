from django.test import TestCase
from django.contrib.auth import get_user_model
from chatting_service.models import Message, MessageStatus
from chatting_service.repository import MessageRepository

User = get_user_model()


class MessageRepositoryTests(TestCase):
    def setUp(self):
        self.repo = MessageRepository()
        self.user1 = User.objects.create_user(email="repo1@example.com", username="repo1", password="Password123!")
        self.user2 = User.objects.create_user(email="repo2@example.com", username="repo2", password="Password123!")

    def test_create_message(self):
        msg = self.repo.create_message(sender=self.user1, receiver=self.user2, content="Repo test message")
        self.assertIsNotNone(msg.id)
        self.assertEqual(msg.content, "Repo test message")

    def test_get_messages_between_users(self):
        self.repo.create_message(sender=self.user1, receiver=self.user2, content="Msg 1")
        self.repo.create_message(sender=self.user2, receiver=self.user1, content="Msg 2")

        messages = list(self.repo.get_messages_between_users(self.user1.id, self.user2.id))
        self.assertEqual(len(messages), 2)

    def test_mark_messages_delivered(self):
        msg1 = self.repo.create_message(sender=self.user1, receiver=self.user2, content="Delivered Msg")
        updated = self.repo.mark_messages_delivered(message_ids=[msg1.id], receiver_id=self.user2.id)
        self.assertEqual(len(updated), 1)

        msg1.refresh_from_db()
        self.assertEqual(msg1.status, MessageStatus.DELIVERED)

    def test_mark_messages_read(self):
        msg1 = self.repo.create_message(sender=self.user1, receiver=self.user2, content="Read Msg")
        updated_ids = self.repo.mark_messages_read(receiver_id=self.user2.id, sender_id=self.user1.id)
        self.assertIn(msg1.id, updated_ids)

        msg1.refresh_from_db()
        self.assertEqual(msg1.status, MessageStatus.READ)

    def test_delete_message_for_everyone(self):
        msg = self.repo.create_message(sender=self.user1, receiver=self.user2, content="Delete me")
        res = self.repo.delete_message_for_everyone(message_id=msg.id, user_id=self.user1.id)
        self.assertIsNotNone(res)
        self.assertEqual(res["message_id"], msg.id)

        msg.refresh_from_db()
        self.assertEqual(msg.content, "This message was deleted")
