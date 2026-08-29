from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from chatting_service.services import MessageService
from chatting_service.models import UserChatPin, UserChatArchive

User = get_user_model()


class ArchiveChatUnitTests(APITestCase):
    def setUp(self):
        self.service = MessageService()
        self.user1 = User.objects.create_user(email="arc1@example.com", username="arc1", password="Password123!")
        self.user2 = User.objects.create_user(email="arc2@example.com", username="arc2", password="Password123!")
        self.user3 = User.objects.create_user(email="arc3@example.com", username="arc3", password="Password123!")

        # Create initial messages
        self.service.send_message(sender=self.user1, receiver_id=self.user2.id, content="Hello User 2!")
        self.service.send_message(sender=self.user3, receiver_id=self.user2.id, content="Hi User 2!")

    def test_archive_chat_authenticated(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.post(f"/api/v1/chat/conversations/{self.user2.id}/archive/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["status"])
        self.assertTrue(response.data["data"]["is_archived"])
        self.assertTrue(UserChatArchive.objects.filter(user=self.user1, partner=self.user2).exists())

    def test_unarchive_chat_authenticated(self):
        UserChatArchive.objects.create(user=self.user1, partner=self.user2)
        self.client.force_authenticate(user=self.user1)
        response = self.client.delete(f"/api/v1/chat/conversations/{self.user2.id}/unarchive/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(UserChatArchive.objects.filter(user=self.user1, partner=self.user2).exists())

    def test_multi_user_archive_isolation(self):
        # User 1 archives User 2
        UserChatArchive.objects.create(user=self.user1, partner=self.user2)

        # Check conversations for User 1
        convs_u1 = self.service.get_user_conversations(self.user1.id)
        u1_arc_state = next(c["is_archived"] for c in convs_u1 if c["user_id"] == self.user2.id)
        self.assertTrue(u1_arc_state)

        # Check conversations for User 3 (should NOT be archived)
        convs_u3 = self.service.get_user_conversations(self.user3.id)
        u3_arc_state = next(c["is_archived"] for c in convs_u3 if c["user_id"] == self.user2.id)
        self.assertFalse(u3_arc_state)

    def test_pin_and_archive_independence(self):
        # User 1 pins and archives User 2
        UserChatPin.objects.create(user=self.user1, partner=self.user2)
        UserChatArchive.objects.create(user=self.user1, partner=self.user2)

        convs_u1 = self.service.get_user_conversations(self.user1.id)
        u2_conv = next(c for c in convs_u1 if c["user_id"] == self.user2.id)
        self.assertTrue(u2_conv["is_pinned"])
        self.assertTrue(u2_conv["is_archived"])

        # Unarchive preserves pin state
        self.service.unarchive_chat(user=self.user1, target_user_id=self.user2.id)
        convs_u1_after = self.service.get_user_conversations(self.user1.id)
        u2_conv_after = next(c for c in convs_u1_after if c["user_id"] == self.user2.id)
        self.assertTrue(u2_conv_after["is_pinned"])
        self.assertFalse(u2_conv_after["is_archived"])

    def test_unauthenticated_archive_rejected(self):
        response = self.client.post(f"/api/v1/chat/conversations/{self.user2.id}/archive/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
