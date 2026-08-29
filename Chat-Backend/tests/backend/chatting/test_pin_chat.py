from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from chatting_service.services import MessageService
from chatting_service.models import UserChatPin

User = get_user_model()


class PinChatUnitTests(APITestCase):
    def setUp(self):
        self.service = MessageService()
        self.user1 = User.objects.create_user(email="pin1@example.com", username="pin1", password="Password123!")
        self.user2 = User.objects.create_user(email="pin2@example.com", username="pin2", password="Password123!")
        self.user3 = User.objects.create_user(email="pin3@example.com", username="pin3", password="Password123!")

        # Create initial messages so conversations exist
        self.service.send_message(sender=self.user1, receiver_id=self.user2.id, content="Hello User 2!")
        self.service.send_message(sender=self.user3, receiver_id=self.user2.id, content="Hi User 2!")

    def test_pin_chat_authenticated(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.post(f"/api/v1/chat/conversations/{self.user2.id}/pin/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["status"])
        self.assertTrue(response.data["data"]["is_pinned"])
        self.assertTrue(UserChatPin.objects.filter(user=self.user1, partner=self.user2).exists())

    def test_unpin_chat_authenticated(self):
        UserChatPin.objects.create(user=self.user1, partner=self.user2)
        self.client.force_authenticate(user=self.user1)
        response = self.client.delete(f"/api/v1/chat/conversations/{self.user2.id}/unpin/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(UserChatPin.objects.filter(user=self.user1, partner=self.user2).exists())

    def test_multi_user_pin_isolation(self):
        # User 1 pins User 2
        UserChatPin.objects.create(user=self.user1, partner=self.user2)

        # Check conversations for User 1
        convs_u1 = self.service.get_user_conversations(self.user1.id)
        u1_pin_state = next(c["is_pinned"] for c in convs_u1 if c["user_id"] == self.user2.id)
        self.assertTrue(u1_pin_state)

        # Check conversations for User 3 (should NOT be pinned)
        convs_u3 = self.service.get_user_conversations(self.user3.id)
        u3_pin_state = next(c["is_pinned"] for c in convs_u3 if c["user_id"] == self.user2.id)
        self.assertFalse(u3_pin_state)

    def test_unauthenticated_pin_rejected(self):
        response = self.client.post(f"/api/v1/chat/conversations/{self.user2.id}/pin/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
