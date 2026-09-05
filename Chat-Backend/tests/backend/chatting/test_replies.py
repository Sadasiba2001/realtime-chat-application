from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APITestCase
from chatting_service.services import MessageService
from chatting_service.models import Message

User = get_user_model()


class MessageReplyUnitTests(TestCase):
    def setUp(self):
        self.service = MessageService()
        self.user1 = User.objects.create_user(email="reply1@example.com", username="reply1", password="Password123!")
        self.user2 = User.objects.create_user(email="reply2@example.com", username="reply2", password="Password123!")
        self.user3 = User.objects.create_user(email="reply3@example.com", username="reply3", password="Password123!")

        # Original message in Conv (user1 <-> user2)
        self.orig_msg = self.service.send_message(sender=self.user1, receiver_id=self.user2.id, content="Where are you?")

    def test_send_reply_success(self):
        # User 2 replies to User 1's message
        reply = self.service.send_message(
            sender=self.user2,
            receiver_id=self.user1.id,
            content="I am on my way!",
            reply_to_id=self.orig_msg["id"],
        )
        self.assertIsNotNone(reply["reply_to"])
        self.assertEqual(reply["reply_to"]["id"], self.orig_msg["id"])
        self.assertEqual(reply["reply_to"]["content"], "Where are you?")
        self.assertEqual(reply["reply_to"]["sender_id"], self.user1.id)

    def test_unauthorized_cross_conversation_reply_fails(self):
        # User 3 attempts to reply to user1 <-> user2 message inside user3's conversation
        with self.assertRaises(PermissionError):
            self.service.send_message(
                sender=self.user3,
                receiver_id=self.user1.id,
                content="Hacking reply",
                reply_to_id=self.orig_msg["id"],
            )

    def test_nonexistent_reply_to_id_fails(self):
        with self.assertRaises(ValueError):
            self.service.send_message(
                sender=self.user2,
                receiver_id=self.user1.id,
                content="Replying to ghost message",
                reply_to_id=999999,
            )

    def test_reply_to_deleted_message_handles_safely(self):
        # Delete original message for everyone
        self.service.delete_message_for_everyone(message_id=self.orig_msg["id"], user_id=self.user1.id)

        # User 2 sends reply
        reply = self.service.send_message(
            sender=self.user2,
            receiver_id=self.user1.id,
            content="Got it",
            reply_to_id=self.orig_msg["id"],
        )
        self.assertIsNotNone(reply["reply_to"])
        self.assertTrue(reply["reply_to"]["is_deleted"])
        self.assertEqual(reply["reply_to"]["content"], "This message was deleted")

    def test_standard_messages_have_none_reply_to(self):
        msg = self.service.send_message(sender=self.user1, receiver_id=self.user2.id, content="Plain message")
        self.assertIsNone(msg["reply_to"])
