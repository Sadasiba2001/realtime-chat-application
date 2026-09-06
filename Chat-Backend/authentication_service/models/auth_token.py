import hashlib
import secrets
from datetime import timedelta
from typing import Tuple
from django.db import models
from django.utils import timezone
from authentication_service.models.user import User


class TokenType(models.TextChoices):
    EMAIL_VERIFICATION = "EMAIL_VERIFICATION", "Email Verification"
    PASSWORD_RESET = "PASSWORD_RESET", "Password Reset"


class AuthToken(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="auth_tokens")
    token_hash = models.CharField(max_length=64, db_index=True)
    token_type = models.CharField(max_length=32, choices=TokenType.choices)
    expires_at = models.DateTimeField(db_index=True)
    used_at = models.DateTimeField(null=True, blank=True, default=None)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "auth_tokens"
        indexes = [
            models.Index(fields=["token_hash", "token_type"]),
            models.Index(fields=["user", "token_type", "used_at"]),
        ]

    def __str__(self):
        return f"{self.token_type} Token (User ID: {self.user_id})"

    @staticmethod
    def hash_token(raw_token: str) -> str:
        """Computes SHA-256 hash of a raw token."""
        return hashlib.sha256(raw_token.strip().encode("utf-8")).hexdigest()

    @classmethod
    def generate_token(
        cls,
        user: User,
        token_type: str,
        expiry_minutes: int = 10
    ) -> Tuple["AuthToken", str]:
        """
        Generates a cryptographically random token (secrets.token_urlsafe(32)),
        hashes it with SHA-256 for server-side storage, invalidates any existing unused
        tokens of the same type for this user, and returns (token_instance, raw_token).
        The raw_token is never persisted.
        """
        raw_token = secrets.token_urlsafe(32)
        token_hash = cls.hash_token(raw_token)
        expires_at = timezone.now() + timedelta(minutes=expiry_minutes)

        # Invalidate old unused tokens of this type for this user
        cls.objects.filter(
            user=user,
            token_type=token_type,
            used_at__isnull=True
        ).update(used_at=timezone.now())

        token_instance = cls.objects.create(
            user=user,
            token_hash=token_hash,
            token_type=token_type,
            expires_at=expires_at,
        )
        return token_instance, raw_token

    @property
    def is_valid(self) -> bool:
        """Returns True if the token has not been used and has not expired."""
        return self.used_at is None and timezone.now() <= self.expires_at

    def mark_as_used(self) -> None:
        """Marks token as used immediately."""
        self.used_at = timezone.now()
        self.save(update_fields=["used_at"])
