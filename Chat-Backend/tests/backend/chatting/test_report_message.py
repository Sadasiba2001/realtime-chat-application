from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from chatting_service.services import MessageService
from chatting_service.models import UserReport

User = get_user_model()


class ReportMessageUnitTests(APITestCase):
    def setUp(self):
        self.service = MessageService()
        self.user1 = User.objects.create_user(email="repmsg1@example.com", username="repmsg1", password="Password123!")
        self.user2 = User.objects.create_user(email="repmsg2@example.com", username="repmsg2", password="Password123!")
        self.user3 = User.objects.create_user(email="repmsg3@example.com", username="repmsg3", password="Password123!")

        # User 2 sends message to User 1
        self.msg_data = self.service.send_message(sender=self.user2, receiver_id=self.user1.id, content="Suspicious spam link message")
        self.message_id = self.msg_data["id"]

    def test_report_message_authenticated_success(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.post(
            f"/api/v1/chat/messages/{self.message_id}/report/",
            {"reason": "SPAM", "description": "Contains phishing link."},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["status"])
        self.assertEqual(response.data["data"]["reason"], "SPAM")
        self.assertEqual(response.data["data"]["reported_message_id"], self.message_id)
        self.assertEqual(response.data["data"]["reported_user_id"], self.user2.id)

        report = UserReport.objects.get(reporter=self.user1, reported_message_id=self.message_id)
        self.assertEqual(report.reported_user, self.user2)
        self.assertEqual(report.status, "PENDING")

    def test_unauthenticated_report_rejected(self):
        response = self.client.post(
            f"/api/v1/chat/messages/{self.message_id}/report/",
            {"reason": "SPAM"},
            format="json",
        )
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_self_message_report_rejected(self):
        # User 2 tries to report User 2's own message
        self.client.force_authenticate(user=self.user2)
        response = self.client.post(
            f"/api/v1/chat/messages/{self.message_id}/report/",
            {"reason": "SPAM"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["status"])

    def test_inaccessible_message_rejected(self):
        # User 3 attempts to report a private message between User 1 & User 2
        self.client.force_authenticate(user=self.user3)
        response = self.client.post(
            f"/api/v1/chat/messages/{self.message_id}/report/",
            {"reason": "SPAM"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_non_existent_message_rejected(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.post(
            "/api/v1/chat/messages/99999/report/",
            {"reason": "SPAM"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_invalid_reason_rejected(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.post(
            f"/api/v1/chat/messages/{self.message_id}/report/",
            {"reason": "INVALID_REASON"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_other_reason_requires_description(self):
        self.client.force_authenticate(user=self.user1)
        res1 = self.client.post(
            f"/api/v1/chat/messages/{self.message_id}/report/",
            {"reason": "OTHER", "description": ""},
            format="json",
        )
        self.assertEqual(res1.status_code, status.HTTP_400_BAD_REQUEST)

        res2 = self.client.post(
            f"/api/v1/chat/messages/{self.message_id}/report/",
            {"reason": "OTHER", "description": "Explanation of offensive text."},
            format="json",
        )
        self.assertEqual(res2.status_code, status.HTTP_201_CREATED)

    def test_duplicate_message_report_updates_existing(self):
        self.client.force_authenticate(user=self.user1)
        # First submission
        self.client.post(
            f"/api/v1/chat/messages/{self.message_id}/report/",
            {"reason": "SPAM", "description": "First report"},
            format="json",
        )

        # Second submission
        self.client.post(
            f"/api/v1/chat/messages/{self.message_id}/report/",
            {"reason": "HARASSMENT", "description": "Updated report description"},
            format="json",
        )

        # Verify database record updated cleanly without duplicate rows
        self.assertEqual(UserReport.objects.filter(reporter=self.user1, reported_message_id=self.message_id).count(), 1)
        report = UserReport.objects.get(reporter=self.user1, reported_message_id=self.message_id)
        self.assertEqual(report.reason, "HARASSMENT")
        self.assertEqual(report.description, "Updated report description")

    def test_report_user_and_report_message_compatibility(self):
        self.client.force_authenticate(user=self.user1)

        # Report User 2 (User report)
        self.client.post(
            f"/api/v1/chat/users/{self.user2.id}/report/",
            {"reason": "ABUSE"},
            format="json",
        )

        # Report User 2's specific message (Message report)
        self.client.post(
            f"/api/v1/chat/messages/{self.message_id}/report/",
            {"reason": "SPAM"},
            format="json",
        )

        # Both reports must exist independently in UserReport
        user_reports = UserReport.objects.filter(reporter=self.user1, reported_user=self.user2)
        self.assertEqual(user_reports.count(), 2)
        self.assertTrue(user_reports.filter(reported_message__isnull=True).exists())
        self.assertTrue(user_reports.filter(reported_message_id=self.message_id).exists())
