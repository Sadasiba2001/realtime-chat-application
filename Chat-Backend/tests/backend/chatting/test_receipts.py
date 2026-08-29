from django.contrib.auth import get_user_model
from django.test import TestCase
from chatting_service.services import MessageService
from chatting_service.models import Message, MessageStatus

User = get_user_model()


class MessageReceiptUnitTests(TestCase):
    def setUp(self):
        self.service = MessageService()
        self.user1 = User.objects.create_user(email="rcpt1@example.com", username="rcpt1", password="Password123!")
        self.user2 = User.objects.create_user(email="rcpt2@example.com", username="rcpt2", password="Password123!")
        self.user3 = User.objects.create_user(email="rcpt3@example.com", username="rcpt3", password="Password123!")

        self.msg = self.service.send_message(sender=self.user1, receiver_id=self.user2.id, content="Status test message")

    def test_message_created_with_sent_status(self):
        self.assertEqual(self.msg["status"], MessageStatus.SENT)

    def test_mark_messages_delivered(self):
        updated = self.service.mark_messages_delivered(receiver_id=self.user2.id, message_ids=[self.msg["id"]])
        self.assertEqual(len(updated), 1)
        self.assertEqual(updated[0], (self.msg["id"], self.user1.id))

        m = Message.objects.get(id=self.msg["id"])
        self.assertEqual(m.status, MessageStatus.DELIVERED)

    def test_mark_messages_read(self):
        # 1. Mark delivered
        self.service.mark_messages_delivered(receiver_id=self.user2.id, message_ids=[self.msg["id"]])

        # 2. Mark read
        read_ids = self.service.mark_messages_read(receiver_id=self.user2.id, sender_id=self.user1.id, message_ids=[self.msg["id"]])
        self.assertEqual(read_ids, [self.msg["id"]])

        m = Message.objects.get(id=self.msg["id"])
        self.assertEqual(m.status, MessageStatus.READ)

    def test_status_non_regression_read_cannot_regress_to_delivered(self):
        # 1. Mark read
        self.service.mark_messages_read(receiver_id=self.user2.id, sender_id=self.user1.id, message_ids=[self.msg["id"]])

        # 2. Attempt to mark delivered
        updated = self.service.mark_messages_delivered(receiver_id=self.user2.id, message_ids=[self.msg["id"]])
        self.assertEqual(len(updated), 0)

        # Status must remain READ
        m = Message.objects.get(id=self.msg["id"])
        self.assertEqual(m.status, MessageStatus.READ)

    def test_unauthorized_receipt_update_fails(self):
        # User 3 attempts to mark User 1 <-> User 2 message delivered or read
        updated_deliv = self.service.mark_messages_delivered(receiver_id=self.user3.id, message_ids=[self.msg["id"]])
        self.assertEqual(len(updated_deliv), 0)

        updated_read = self.service.mark_messages_read(receiver_id=self.user3.id, sender_id=self.user1.id, message_ids=[self.msg["id"]])
        self.assertEqual(len(updated_read), 0)
