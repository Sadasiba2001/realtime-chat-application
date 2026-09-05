from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from chatting_service.services import MessageService
from chatting_service.repository import MessageRepository
from chatting_service.models import UserMessageDeletion

User = get_user_model()


class MessageDeletionUnitTests(TestCase):
    def setUp(self):
        self.service = MessageService()
        self.repo = MessageRepository()
        self.user1 = User.objects.create_user(email="del1@example.com", username="del1", password="Password123!")
        self.user2 = User.objects.create_user(email="del2@example.com", username="del2", password="Password123!")
        self.message = self.service.send_message(sender=self.user1, receiver_id=self.user2.id, content="Secret message")

    def test_delete_for_me_success(self):
        res = self.service.delete_message_for_me(message_id=self.message["id"], user_id=self.user1.id)
        self.assertEqual(res["message_id"], self.message["id"])
        self.assertTrue(UserMessageDeletion.objects.filter(user=self.user1, message_id=self.message["id"]).exists())

        # Verify history query for user1 excludes message
        h1 = self.service.get_conversation_messages(user1_id=self.user1.id, user2_id=self.user2.id, requesting_user_id=self.user1.id)
        self.assertEqual(h1["count"], 0)

        # Verify history query for user2 still includes message
        h2 = self.service.get_conversation_messages(user1_id=self.user2.id, user2_id=self.user1.id, requesting_user_id=self.user2.id)
        self.assertEqual(h2["count"], 1)
        self.assertEqual(h2["results"][0]["content"], "Secret message")

    def test_delete_for_everyone_success(self):
        res = self.service.delete_message_for_everyone(message_id=self.message["id"], user_id=self.user1.id)
        self.assertEqual(res["message_id"], self.message["id"])

        h1 = self.service.get_conversation_messages(user1_id=self.user1.id, user2_id=self.user2.id, requesting_user_id=self.user1.id)
        self.assertEqual(h1["results"][0]["content"], "This message was deleted")
        self.assertTrue(h1["results"][0]["is_deleted"])

    def test_unauthorized_delete_for_everyone_raises_permission_error(self):
        with self.assertRaises(PermissionError):
            self.service.delete_message_for_everyone(message_id=self.message["id"], user_id=self.user2.id)

    def test_edit_deleted_message_raises_value_error(self):
        self.service.delete_message_for_everyone(message_id=self.message["id"], user_id=self.user1.id)
        with self.assertRaises(ValueError):
            self.service.edit_message(message_id=self.message["id"], user_id=self.user1.id, content="New content")


class MessageDeletionAPITests(APITestCase):
    def setUp(self):
        self.service = MessageService()
        self.user1 = User.objects.create_user(email="api_del1@example.com", username="api_del1", password="Password123!")
        self.user2 = User.objects.create_user(email="api_del2@example.com", username="api_del2", password="Password123!")
        self.message = self.service.send_message(sender=self.user1, receiver_id=self.user2.id, content="API message")

    def test_api_delete_for_me_success(self):
        self.client.force_authenticate(user=self.user1)
        url = f"/api/v1/chat/messages/{self.message['id']}/delete/"
        response = self.client.delete(url, {"delete_type": "me"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["status"])

    def test_api_delete_for_everyone_success(self):
        self.client.force_authenticate(user=self.user1)
        url = f"/api/v1/chat/messages/{self.message['id']}/delete/"
        response = self.client.delete(url, {"delete_type": "everyone"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["status"])

    def test_api_unauthorized_delete_for_everyone_forbidden(self):
        self.client.force_authenticate(user=self.user2)
        url = f"/api/v1/chat/messages/{self.message['id']}/delete/"
        response = self.client.delete(url, {"delete_type": "everyone"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(response.data["status"])
