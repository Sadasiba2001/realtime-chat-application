from unittest.mock import patch
from django.test import TestCase
from django.core import mail
from django.conf import settings
from email_service.services import EmailService
from email_service.exceptions import EmailDeliveryError


class EmailServiceTests(TestCase):
    """
    Unit and integration test suite for EmailService.
    """

    def setUp(self):
        mail.outbox.clear()
        self.recipient = "alice.smith@example.com"
        self.user_name = "Alice Smith"
        self.verification_url = "https://sbchatwebpro.online/verify-email/test-token-12345"
        self.reset_url = "https://sbchatwebpro.online/reset-password/test-token-67890"

    def test_send_verification_email_success(self):
        """Verification email is constructed and dispatched to outbox with proper content."""
        result = EmailService.send_verification_email(
            recipient_email=self.recipient,
            verification_url=self.verification_url,
            expires_in_minutes=10,
            user_name=self.user_name
        )

        self.assertTrue(result)
        self.assertEqual(len(mail.outbox), 1)

        sent_email = mail.outbox[0]
        self.assertEqual(sent_email.to, [self.recipient])
        self.assertEqual(sent_email.subject, "Verify your SB Chat email address")
        self.assertEqual(sent_email.from_email, settings.DEFAULT_FROM_EMAIL)

        # Plain text assertions
        self.assertIn("Verify your email address", sent_email.body)
        self.assertIn(self.verification_url, sent_email.body)
        self.assertIn("expires in 10 minutes", sent_email.body)
        self.assertIn("Alice Smith", sent_email.body)

        # HTML assertions
        html_content, mimetype = sent_email.alternatives[0]
        self.assertEqual(mimetype, "text/html")
        self.assertIn("Verify Email", html_content)
        self.assertIn(self.verification_url, html_content)
        self.assertIn("expires in 10 minutes", html_content)

    def test_send_password_reset_email_success(self):
        """Password reset email is constructed and dispatched to outbox with proper content."""
        result = EmailService.send_password_reset_email(
            recipient_email=self.recipient,
            reset_url=self.reset_url,
            expires_in_minutes=10,
            user_name=self.user_name
        )

        self.assertTrue(result)
        self.assertEqual(len(mail.outbox), 1)

        sent_email = mail.outbox[0]
        self.assertEqual(sent_email.to, [self.recipient])
        self.assertEqual(sent_email.subject, "Reset your SB Chat password")
        self.assertEqual(sent_email.from_email, settings.DEFAULT_FROM_EMAIL)

        # Plain text assertions
        self.assertIn("Reset your password", sent_email.body)
        self.assertIn(self.reset_url, sent_email.body)
        self.assertIn("expires in 10 minutes", sent_email.body)

        # HTML assertions
        html_content, mimetype = sent_email.alternatives[0]
        self.assertEqual(mimetype, "text/html")
        self.assertIn("Reset Password", html_content)
        self.assertIn(self.reset_url, html_content)
        self.assertIn("expires in 10 minutes", html_content)

    def test_send_email_without_username(self):
        """Templates render clean generic greetings when user_name is None."""
        EmailService.send_verification_email(
            recipient_email=self.recipient,
            verification_url=self.verification_url,
            user_name=None
        )

        sent_email = mail.outbox[0]
        self.assertIn("Hello,", sent_email.body)
        html_content, _ = sent_email.alternatives[0]
        self.assertIn("Hello,", html_content)

    def test_invalid_recipient_or_url_raises_error(self):
        """Invalid emails or empty URLs raise EmailDeliveryError."""
        with self.assertRaises(EmailDeliveryError):
            EmailService.send_verification_email(
                recipient_email="not-an-email",
                verification_url=self.verification_url
            )

        with self.assertRaises(EmailDeliveryError):
            EmailService.send_verification_email(
                recipient_email=self.recipient,
                verification_url=""
            )

        with self.assertRaises(EmailDeliveryError):
            EmailService.send_password_reset_email(
                recipient_email=self.recipient,
                reset_url=""
            )

    @patch("email_service.services.email_service.EmailMultiAlternatives.send")
    def test_email_delivery_failure_raises_clean_error(self, mock_send):
        """SMTP / network failures raise EmailDeliveryError without leaking internal traces."""
        mock_send.side_effect = Exception("SMTP connection refused: sensitive-internal-host:587")

        with self.assertRaises(EmailDeliveryError) as ctx:
            EmailService.send_verification_email(
                recipient_email=self.recipient,
                verification_url=self.verification_url
            )

        self.assertNotIn("sensitive-internal-host", str(ctx.exception))
        self.assertEqual(str(ctx.exception), "Failed to deliver email. Please try again later.")

    def test_logger_redacts_email_and_does_not_log_secrets(self):
        """Application logs must redact recipient emails and never log raw tokens or passwords."""
        with self.assertLogs("email_service.services.email_service", level="INFO") as log_context:
            EmailService.send_verification_email(
                recipient_email="security.user@example.com",
                verification_url="https://sbchatwebpro.online/verify-email/secret-raw-token"
            )

            all_logs = " ".join(log_context.output)
            self.assertNotIn("security.user@example.com", all_logs)
            self.assertIn("se***@example.com", all_logs)
            # The raw token in the URL must not be explicitly logged in log text
            self.assertNotIn("secret-raw-token", all_logs)

    def test_no_hardcoded_credentials(self):
        """Ensure no SMTP credentials or production secrets are hardcoded in email_service."""
        import inspect
        from email_service.services import email_service
        source = inspect.getsource(email_service)
        self.assertNotIn("smtp.gmail.com", source)
        self.assertNotIn("password=", source)
