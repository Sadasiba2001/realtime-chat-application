from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from chatting_service.services import MessageService
from chatting_service.models import UserReport, UserBlock, UserChatMute, UserChatArchive, UserChatPin

User = get_user_model()


class ReportUserUnitTests(APITestCase):
    def setUp(self):
        self.service = MessageService()
        self.user1 = User.objects.create_user(email="reporter1@example.com", username="reporter1", password="Password123!")
        self.user2 = User.objects.create_user(email="reported1@example.com", username="reported1", password="Password123!")

        self.service.send_message(sender=self.user1, receiver_id=self.user2.id, content="Sample chat message")

    def test_report_user_authenticated_success(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.post(
            f"/api/v1/chat/users/{self.user2.id}/report/",
            {"reason": "SPAM", "description": "Sending excessive promotional links."},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["status"])
        self.assertEqual(response.data["data"]["reason"], "SPAM")
        self.assertEqual(response.data["data"]["status"], "PENDING")
        self.assertTrue(UserReport.objects.filter(reporter=self.user1, reported_user=self.user2, reason="SPAM").exists())

    def test_unauthenticated_report_rejected(self):
        response = self.client.post(
            f"/api/v1/chat/users/{self.user2.id}/report/",
            {"reason": "SPAM"},
            format="json",
        )
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_self_report_rejected(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.post(
            f"/api/v1/chat/users/{self.user1.id}/report/",
            {"reason": "SPAM"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["status"])

    def test_invalid_target_user_rejected(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.post(
            "/api/v1/chat/users/99999/report/",
            {"reason": "SPAM"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_invalid_reason_rejected(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.post(
            f"/api/v1/chat/users/{self.user2.id}/report/",
            {"reason": "INVALID_REASON"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_other_reason_requires_description(self):
        self.client.force_authenticate(user=self.user1)
        # Without description -> HTTP 400
        res1 = self.client.post(
            f"/api/v1/chat/users/{self.user2.id}/report/",
            {"reason": "OTHER", "description": ""},
            format="json",
        )
        self.assertEqual(res1.status_code, status.HTTP_400_BAD_REQUEST)

        # With description -> HTTP 201
        res2 = self.client.post(
            f"/api/v1/chat/users/{self.user2.id}/report/",
            {"reason": "OTHER", "description": "Custom detailed explanation."},
            format="json",
        )
        self.assertEqual(res2.status_code, status.HTTP_201_CREATED)

    def test_description_length_limit(self):
        self.client.force_authenticate(user=self.user1)
        long_desc = "x" * 501
        response = self.client.post(
            f"/api/v1/chat/users/{self.user2.id}/report/",
            {"reason": "SPAM", "description": long_desc},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_duplicate_report_updates_existing(self):
        self.client.force_authenticate(user=self.user1)
        # First submission
        self.client.post(
            f"/api/v1/chat/users/{self.user2.id}/report/",
            {"reason": "SPAM", "description": "Initial report"},
            format="json",
        )

        # Second submission
        self.client.post(
            f"/api/v1/chat/users/{self.user2.id}/report/",
            {"reason": "HARASSMENT", "description": "Updated report details"},
            format="json",
        )

        # Count should still be 1 (updated, not duplicated)
        self.assertEqual(UserReport.objects.filter(reporter=self.user1, reported_user=self.user2).count(), 1)
        report = UserReport.objects.get(reporter=self.user1, reported_user=self.user2)
        self.assertEqual(report.reason, "HARASSMENT")
        self.assertEqual(report.description, "Updated report details")

    def test_reporting_preserves_block_mute_archive_pin_states(self):
        self.client.force_authenticate(user=self.user1)

        # Report user 2
        self.client.post(
            f"/api/v1/chat/users/{self.user2.id}/report/",
            {"reason": "SPAM"},
            format="json",
        )

        # Verify block, mute, archive, pin remain unaffected (not automatically triggered)
        self.assertFalse(UserBlock.objects.filter(blocker=self.user1, blocked=self.user2).exists())
        self.assertFalse(UserChatMute.objects.filter(user=self.user1, partner=self.user2).exists())
        self.assertFalse(UserChatArchive.objects.filter(user=self.user1, partner=self.user2).exists())
        self.assertFalse(UserChatPin.objects.filter(user=self.user1, partner=self.user2).exists())
