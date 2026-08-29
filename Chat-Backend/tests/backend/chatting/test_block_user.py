from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from chatting_service.services import MessageService
from chatting_service.models import UserChatPin, UserChatArchive, UserChatMute, UserBlock

User = get_user_model()


class BlockUserUnitTests(APITestCase):
    def setUp(self):
        self.service = MessageService()
        self.user1 = User.objects.create_user(email="block1@example.com", username="block1", password="Password123!")
        self.user2 = User.objects.create_user(email="block2@example.com", username="block2", password="Password123!")
        self.user3 = User.objects.create_user(email="block3@example.com", username="block3", password="Password123!")

        self.service.send_message(sender=self.user1, receiver_id=self.user2.id, content="Hello User 2!")
        self.service.send_message(sender=self.user3, receiver_id=self.user2.id, content="Hi User 2!")

    def test_block_user_authenticated(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.post(f"/api/v1/chat/users/{self.user2.id}/block/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["status"])
        self.assertTrue(response.data["data"]["is_blocked"])
        self.assertTrue(UserBlock.objects.filter(blocker=self.user1, blocked=self.user2).exists())

    def test_unblock_user_authenticated(self):
        UserBlock.objects.create(blocker=self.user1, blocked=self.user2)
        self.client.force_authenticate(user=self.user1)
        response = self.client.delete(f"/api/v1/chat/users/{self.user2.id}/unblock/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(UserBlock.objects.filter(blocker=self.user1, blocked=self.user2).exists())

    def test_self_block_rejected(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.post(f"/api/v1/chat/users/{self.user1.id}/block/")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["status"])

    def test_messaging_restricted_when_blocked(self):
        UserBlock.objects.create(blocker=self.user1, blocked=self.user2)

        # User 2 sending to User 1 should fail
        with self.assertRaises(PermissionError):
            self.service.send_message(sender=self.user2, receiver_id=self.user1.id, content="Blocked msg")

        # User 1 sending to User 2 should fail
        with self.assertRaises(PermissionError):
            self.service.send_message(sender=self.user1, receiver_id=self.user2.id, content="Blocked msg 2")

    def test_multi_user_block_isolation(self):
        UserBlock.objects.create(blocker=self.user1, blocked=self.user2)

        self.assertTrue(self.service.is_blocked_between(self.user1.id, self.user2.id))
        self.assertFalse(self.service.is_blocked_between(self.user3.id, self.user2.id))

    def test_quadruple_compatibility_pin_archive_mute_block(self):
        UserChatPin.objects.create(user=self.user1, partner=self.user2)
        UserChatArchive.objects.create(user=self.user1, partner=self.user2)
        UserChatMute.objects.create(user=self.user1, partner=self.user2, is_always=True)
        UserBlock.objects.create(blocker=self.user1, blocked=self.user2)

        convs = self.service.get_user_conversations(self.user1.id)
        u2_conv = next(c for c in convs if c["user_id"] == self.user2.id)
        self.assertTrue(u2_conv["is_pinned"])
        self.assertTrue(u2_conv["is_archived"])
        self.assertTrue(u2_conv["is_muted"])
        self.assertTrue(u2_conv["is_blocked"])

        # Unblock preserves pin, archive, and mute states
        self.service.unblock_user(blocker=self.user1, target_user_id=self.user2.id)
        convs_after = self.service.get_user_conversations(self.user1.id)
        u2_conv_after = next(c for c in convs_after if c["user_id"] == self.user2.id)
        self.assertTrue(u2_conv_after["is_pinned"])
        self.assertTrue(u2_conv_after["is_archived"])
        self.assertTrue(u2_conv_after["is_muted"])
        self.assertFalse(u2_conv_after["is_blocked"])
