from datetime import timedelta
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from chatting_service.services import MessageService
from chatting_service.models import UserChatPin, UserChatArchive, UserChatMute

User = get_user_model()


class MuteChatUnitTests(APITestCase):
    def setUp(self):
        self.service = MessageService()
        self.user1 = User.objects.create_user(email="mute1@example.com", username="mute1", password="Password123!")
        self.user2 = User.objects.create_user(email="mute2@example.com", username="mute2", password="Password123!")
        self.user3 = User.objects.create_user(email="mute3@example.com", username="mute3", password="Password123!")

        self.service.send_message(sender=self.user1, receiver_id=self.user2.id, content="Hello User 2!")
        self.service.send_message(sender=self.user3, receiver_id=self.user2.id, content="Hi User 2!")

    def test_mute_chat_durations(self):
        self.client.force_authenticate(user=self.user1)

        # 1-hour mute
        res_1h = self.client.post(f"/api/v1/chat/conversations/{self.user2.id}/mute/", {"duration": "1h"}, format="json")
        self.assertEqual(res_1h.status_code, status.HTTP_200_OK)
        self.assertTrue(self.service.is_chat_muted(self.user1.id, self.user2.id))

        # 8-hour mute
        res_8h = self.client.post(f"/api/v1/chat/conversations/{self.user2.id}/mute/", {"duration": "8h"}, format="json")
        self.assertEqual(res_8h.status_code, status.HTTP_200_OK)
        self.assertTrue(self.service.is_chat_muted(self.user1.id, self.user2.id))

        # 1-week mute
        res_1w = self.client.post(f"/api/v1/chat/conversations/{self.user2.id}/mute/", {"duration": "1w"}, format="json")
        self.assertEqual(res_1w.status_code, status.HTTP_200_OK)
        self.assertTrue(self.service.is_chat_muted(self.user1.id, self.user2.id))

        # Always mute
        res_always = self.client.post(f"/api/v1/chat/conversations/{self.user2.id}/mute/", {"duration": "always"}, format="json")
        self.assertEqual(res_always.status_code, status.HTTP_200_OK)
        self.assertTrue(self.service.is_chat_muted(self.user1.id, self.user2.id))

    def test_unmute_chat(self):
        UserChatMute.objects.create(user=self.user1, partner=self.user2, is_always=True)
        self.assertTrue(self.service.is_chat_muted(self.user1.id, self.user2.id))

        self.client.force_authenticate(user=self.user1)
        res_unmute = self.client.delete(f"/api/v1/chat/conversations/{self.user2.id}/unmute/")
        self.assertEqual(res_unmute.status_code, status.HTTP_200_OK)
        self.assertFalse(self.service.is_chat_muted(self.user1.id, self.user2.id))

    def test_mute_expiration(self):
        # Mute expired 10 minutes ago
        past_time = timezone.now() - timedelta(minutes=10)
        UserChatMute.objects.create(user=self.user1, partner=self.user2, muted_until=past_time, is_always=False)

        # Should NOT be active
        self.assertFalse(self.service.is_chat_muted(self.user1.id, self.user2.id))

        convs = self.service.get_user_conversations(self.user1.id)
        u2_conv = next(c for c in convs if c["user_id"] == self.user2.id)
        self.assertFalse(u2_conv["is_muted"])

    def test_multi_user_mute_isolation(self):
        UserChatMute.objects.create(user=self.user1, partner=self.user2, is_always=True)

        self.assertTrue(self.service.is_chat_muted(self.user1.id, self.user2.id))
        self.assertFalse(self.service.is_chat_muted(self.user3.id, self.user2.id))

    def test_triple_compatibility_pin_archive_mute(self):
        UserChatPin.objects.create(user=self.user1, partner=self.user2)
        UserChatArchive.objects.create(user=self.user1, partner=self.user2)
        UserChatMute.objects.create(user=self.user1, partner=self.user2, is_always=True)

        convs = self.service.get_user_conversations(self.user1.id)
        u2_conv = next(c for c in convs if c["user_id"] == self.user2.id)
        self.assertTrue(u2_conv["is_pinned"])
        self.assertTrue(u2_conv["is_archived"])
        self.assertTrue(u2_conv["is_muted"])

        # Unmute preserves pin and archive states
        self.service.unmute_chat(user=self.user1, target_user_id=self.user2.id)
        convs_after = self.service.get_user_conversations(self.user1.id)
        u2_conv_after = next(c for c in convs_after if c["user_id"] == self.user2.id)
        self.assertTrue(u2_conv_after["is_pinned"])
        self.assertTrue(u2_conv_after["is_archived"])
        self.assertFalse(u2_conv_after["is_muted"])
