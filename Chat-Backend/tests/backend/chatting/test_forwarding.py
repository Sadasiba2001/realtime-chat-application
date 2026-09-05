from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from chatting_service.services import MessageService

User = get_user_model()


class MessageForwardingUnitTests(TestCase):
    def setUp(self):
        self.service = MessageService()
        self.user1 = User.objects.create_user(email="fwd1@example.com", username="fwd1", password="Password123!")
        self.user2 = User.objects.create_user(email="fwd2@example.com", username="fwd2", password="Password123!")
        self.user3 = User.objects.create_user(email="fwd3@example.com", username="fwd3", password="Password123!")

        # Original message in Conv 1 (user1 <-> user2)
        self.orig_msg = self.service.send_message(sender=self.user1, receiver_id=self.user2.id, content="Important announcement!")

    def test_forward_message_success(self):
        # User 2 forwards original message to User 3
        forwarded = self.service.forward_message(user=self.user2, message_id=self.orig_msg["id"], target_user_ids=[self.user3.id])
        self.assertEqual(len(forwarded), 1)
        fmsg = forwarded[0]
        self.assertTrue(fmsg["is_forwarded"])
        self.assertEqual(fmsg["forwarded_from_name"], "fwd1")
        self.assertEqual(fmsg["sender_id"], self.user2.id)
        self.assertEqual(fmsg["receiver_id"], self.user3.id)
        self.assertEqual(fmsg["content"], "Important announcement!")

    def test_unauthorized_forward_raises_permission_error(self):
        # User 3 attempts to forward user1 <-> user2 message
        with self.assertRaises(PermissionError):
            self.service.forward_message(user=self.user3, message_id=self.orig_msg["id"], target_user_ids=[self.user1.id])

    def test_forward_deleted_message_raises_value_error(self):
        # Delete original message for everyone
        self.service.delete_message_for_everyone(message_id=self.orig_msg["id"], user_id=self.user1.id)
        with self.assertRaises(ValueError):
            self.service.forward_message(user=self.user2, message_id=self.orig_msg["id"], target_user_ids=[self.user3.id])


class MessageForwardingAPITests(APITestCase):
    def setUp(self):
        self.service = MessageService()
        self.user1 = User.objects.create_user(email="api_f1@example.com", username="api_f1", password="Password123!")
        self.user2 = User.objects.create_user(email="api_f2@example.com", username="api_f2", password="Password123!")
        self.user3 = User.objects.create_user(email="api_f3@example.com", username="api_f3", password="Password123!")
        self.orig_msg = self.service.send_message(sender=self.user1, receiver_id=self.user2.id, content="API message to forward")

    def test_api_forward_message_success(self):
        self.client.force_authenticate(user=self.user2)
        url = f"/api/v1/chat/messages/{self.orig_msg['id']}/forward/"
        response = self.client.post(url, {"target_user_ids": [self.user3.id]}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["status"])
        self.assertEqual(len(response.data["data"]), 1)
        self.assertTrue(response.data["data"][0]["is_forwarded"])

    def test_api_unauthorized_forward_forbidden(self):
        self.client.force_authenticate(user=self.user3)
        url = f"/api/v1/chat/messages/{self.orig_msg['id']}/forward/"
        response = self.client.post(url, {"target_user_ids": [self.user1.id]}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(response.data["status"])
