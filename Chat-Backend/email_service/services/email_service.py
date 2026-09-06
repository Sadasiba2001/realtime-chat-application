import logging
from typing import Optional, Dict, Any
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from email_service.exceptions import EmailDeliveryError

logger = logging.getLogger(__name__)


class EmailService:
    """
    Centralized email delivery service for SB Chat backend.
    Responsible for rendering email templates and sending emails via Django's configured mailer.
    Authentication logic and token generation remain inside authentication_service.
    """

    @staticmethod
    def _redact_email(email: str) -> str:
        """
        Redacts email address for secure logging.
        Example: 'vikram.reddy@example.com' -> 'vi***@example.com'
        """
        if not email or "@" not in email:
            return "<redacted>"
        try:
            local_part, domain = email.split("@", 1)
            if len(local_part) <= 2:
                masked_local = local_part[0] + "***" if local_part else "***"
            else:
                masked_local = local_part[:2] + "***"
            return f"{masked_local}@{domain}"
        except Exception:
            return "<redacted>"

    @classmethod
    def _send_templated_email(
        cls,
        recipient_email: str,
        subject: str,
        template_base_name: str,
        context: Dict[str, Any],
        from_email: Optional[str] = None
    ) -> bool:
        """
        Renders HTML and text versions of a template and sends a multi-part email.
        """
        if not recipient_email or not str(recipient_email).strip():
            raise EmailDeliveryError("Recipient email address is required.")

        recipient_email = str(recipient_email).strip()
        try:
            validate_email(recipient_email)
        except ValidationError as e:
            raise EmailDeliveryError("Invalid recipient email address.") from e

        sender = from_email or getattr(settings, "DEFAULT_FROM_EMAIL", "SB Chat <no-reply@sbchatwebpro.online>")
        redacted_recipient = cls._redact_email(recipient_email)

        template_context = {
            "app_name": "SB Chat",
            **context
        }

        try:
            html_template = f"{template_base_name}.html"
            txt_template = f"{template_base_name}.txt"

            html_content = render_to_string(html_template, template_context)
            text_content = render_to_string(txt_template, template_context)
        except Exception as exc:
            logger.error(
                "Failed to render email template '%s' for recipient %s: %s",
                template_base_name,
                redacted_recipient,
                exc.__class__.__name__
            )
            raise EmailDeliveryError("Failed to prepare email content.") from exc

        try:
            logger.info("Initiating email delivery to %s for template '%s'", redacted_recipient, template_base_name)

            message = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=sender,
                to=[recipient_email]
            )
            message.attach_alternative(html_content, "text/html")

            # Explicitly fail_silently=False for transactional delivery
            message.send(fail_silently=False)

            logger.info("Email successfully dispatched to %s for template '%s'", redacted_recipient, template_base_name)
            return True
        except Exception as exc:
            logger.error("Email delivery failed to %s: %s", redacted_recipient, exc.__class__.__name__)
            raise EmailDeliveryError("Failed to deliver email. Please try again later.") from exc

    @classmethod
    def send_verification_email(
        cls,
        recipient_email: str,
        verification_url: str,
        expires_in_minutes: int = 10,
        user_name: Optional[str] = None
    ) -> bool:
        """
        Sends an email address verification link to the recipient.
        """
        if not verification_url or not str(verification_url).strip():
            raise EmailDeliveryError("Verification URL is required.")

        if not isinstance(expires_in_minutes, (int, float)) or expires_in_minutes <= 0:
            raise EmailDeliveryError("Valid expiration time in minutes is required.")

        subject = "Verify your SB Chat email address"
        context = {
            "verification_url": str(verification_url).strip(),
            "expires_in_minutes": int(expires_in_minutes),
            "user_name": user_name.strip() if user_name and user_name.strip() else None,
        }

        return cls._send_templated_email(
            recipient_email=recipient_email,
            subject=subject,
            template_base_name="emails/verification/verify_email",
            context=context
        )

    @classmethod
    def send_password_reset_email(
        cls,
        recipient_email: str,
        reset_url: str,
        expires_in_minutes: int = 10,
        user_name: Optional[str] = None
    ) -> bool:
        """
        Sends a password reset link to the recipient.
        """
        if not reset_url or not str(reset_url).strip():
            raise EmailDeliveryError("Password reset URL is required.")

        if not isinstance(expires_in_minutes, (int, float)) or expires_in_minutes <= 0:
            raise EmailDeliveryError("Valid expiration time in minutes is required.")

        subject = "Reset your SB Chat password"
        context = {
            "reset_url": str(reset_url).strip(),
            "expires_in_minutes": int(expires_in_minutes),
            "user_name": user_name.strip() if user_name and user_name.strip() else None,
        }

        return cls._send_templated_email(
            recipient_email=recipient_email,
            subject=subject,
            template_base_name="emails/password_reset/reset_password",
            context=context
        )
