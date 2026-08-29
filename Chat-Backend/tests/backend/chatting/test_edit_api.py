from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from chatting_service.services import MessageService

User = get_user_model()


class MessageEditAPITests(APITestCase):
    def setUp(self):
        self.message_service = MessageService()
        self.user1 = User.objects.create_user(email="api_edit1@example.com", username="api_edit1", password="Password123!")
        self.user2 = User.objects.create_user(email="api_edit2@example.com", username="api_edit2", password="Password123!")
        self.message = self.message_service.send_message(sender=self.user1, receiver_id=self.user2.id, content="Initial message")

    def test_edit_own_message_via_api_success(self):
        self.client.force_authenticate(user=self.user1)
        url = f"/api/v1/chat/messages/{self.message['id']}/edit/"
        response = self.client.patch(url, {"content": "Updated via API"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["status"])
        self.assertEqual(response.data["data"]["content"], "Updated via API")
        self.assertTrue(response.data["data"]["is_edited"])

    def test_edit_other_user_message_via_api_forbidden(self):
        self.client.force_authenticate(user=self.user2)
        url = f"/api/v1/chat/messages/{self.message['id']}/edit/"
        response = self.client.patch(url, {"content": "Hacked content"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(response.data["status"])

    def test_edit_nonexistent_message_via_api_not_found(self):
        self.client.force_authenticate(user=self.user1)
        url = "/api/v1/chat/messages/999999/edit/"
        response = self.client.patch(url, {"content": "Ghost content"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_edit_empty_content_via_api_bad_request(self):
        self.client.force_authenticate(user=self.user1)
        url = f"/api/v1/chat/messages/{self.message['id']}/edit/"
        response = self.client.patch(url, {"content": "   "}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
