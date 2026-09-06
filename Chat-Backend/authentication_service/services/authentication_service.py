import logging
from typing import Optional
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
from authentication_service.models import User, UserRole, AuthToken, TokenType
from authentication_service.repository import UserRepository
from email_service.services import EmailService
from email_service.exceptions import EmailDeliveryError

logger = logging.getLogger(__name__)


class AuthenticationService:
    def __init__(self, user_repository: Optional[UserRepository] = None):
        self.user_repository = user_repository or UserRepository()

    @staticmethod
    def generate_tokens_for_user(user: User) -> dict:
        refresh = RefreshToken.for_user(user)
        refresh["email"] = user.email
        refresh["username"] = user.username
        refresh["role"] = user.role
        refresh["pwd_hash"] = user.password[-12:] if user.password else ""
        return {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }

    def register_user(
        self,
        name: str,
        username: str,
        email: str,
        phone_number: str,
        password: str,
        send_email: bool = True
    ) -> dict:
        if not name or not name.strip():
            raise ValueError("Name is required.")
        if not username or not username.strip():
            raise ValueError("Username is required.")
        if not email or not email.strip():
            raise ValueError("Email is required.")
        if not password or not password.strip():
            raise ValueError("Password is required.")

        email = email.strip().lower()
        username = username.strip()

        if self.user_repository.exists_by_email(email):
            raise ValueError("A user with this email already exists.")

        if self.user_repository.exists_by_username(username):
            raise ValueError("A user with this username already exists.")

        user = self.user_repository.create_user(
            name=name.strip(),
            username=username,
            email=email,
            phone_number=phone_number.strip() if phone_number else "",
            password=password,
            role=UserRole.NORMAL_USER
        )

        # Generate single-use, 10-minute verification token
        _, raw_token = AuthToken.generate_token(
            user=user,
            token_type=TokenType.EMAIL_VERIFICATION,
            expiry_minutes=10
        )

        if send_email:
            frontend_base = getattr(settings, "FRONTEND_BASE_URL", "https://sbchatwebpro.online").rstrip("/")
            verification_url = f"{frontend_base}/verify-email/{raw_token}"
            try:
                EmailService.send_verification_email(
                    recipient_email=user.email,
                    verification_url=verification_url,
                    expires_in_minutes=10,
                    user_name=user.name
                )
            except EmailDeliveryError as exc:
                logger.error("Failed to send verification email for user %s: %s", user.id, exc)
                # We do not fail registration completely, but the unverified state remains

        return self.generate_tokens_for_user(user)

    def verify_email(self, token: str) -> User:
        if not token or not str(token).strip():
            raise ValueError("Verification token is required.")

        token_hash = AuthToken.hash_token(token)
        token_obj = AuthToken.objects.filter(
            token_hash=token_hash,
            token_type=TokenType.EMAIL_VERIFICATION
        ).select_related("user").first()

        if not token_obj or not token_obj.is_valid:
            raise ValueError("Invalid, expired, or already used verification token.")

        user = token_obj.user
        user.is_email_verified = True
        user.save(update_fields=["is_email_verified", "updated_at"])

        token_obj.mark_as_used()
        return user

    def resend_verification_email(self, email: str) -> bool:
        if not email or not str(email).strip():
            raise ValueError("Email is required.")

        email = str(email).strip().lower()
        user = self.user_repository.get_by_email(email)

        # Protect against enumeration: return True whether user exists or is already verified
        if user and user.is_active and not user.is_email_verified:
            _, raw_token = AuthToken.generate_token(
                user=user,
                token_type=TokenType.EMAIL_VERIFICATION,
                expiry_minutes=10
            )
            frontend_base = getattr(settings, "FRONTEND_BASE_URL", "https://sbchatwebpro.online").rstrip("/")
            verification_url = f"{frontend_base}/verify-email/{raw_token}"
            try:
                EmailService.send_verification_email(
                    recipient_email=user.email,
                    verification_url=verification_url,
                    expires_in_minutes=10,
                    user_name=user.name
                )
            except EmailDeliveryError as exc:
                logger.error("Failed to resend verification email for user %s: %s", user.id, exc)

        return True

    def request_password_reset(self, email: str) -> bool:
        if not email or not str(email).strip():
            raise ValueError("Email is required.")

        email = str(email).strip().lower()
        user = self.user_repository.get_by_email(email)

        # Account enumeration protection: return True even if user does not exist
        if user and user.is_active:
            _, raw_token = AuthToken.generate_token(
                user=user,
                token_type=TokenType.PASSWORD_RESET,
                expiry_minutes=10
            )
            frontend_base = getattr(settings, "FRONTEND_BASE_URL", "https://sbchatwebpro.online").rstrip("/")
            reset_url = f"{frontend_base}/reset-password/{raw_token}"
            try:
                EmailService.send_password_reset_email(
                    recipient_email=user.email,
                    reset_url=reset_url,
                    expires_in_minutes=10,
                    user_name=user.name
                )
            except EmailDeliveryError as exc:
                logger.error("Failed to dispatch password reset email for user %s: %s", user.id, exc)

        return True

    def verify_password_reset_token(self, token: str) -> User:
        if not token or not str(token).strip():
            raise ValueError("Reset token is required.")

        token_hash = AuthToken.hash_token(token)
        token_obj = AuthToken.objects.filter(
            token_hash=token_hash,
            token_type=TokenType.PASSWORD_RESET
        ).select_related("user").first()

        if not token_obj or not token_obj.is_valid or not token_obj.user.is_active:
            raise ValueError("Invalid, expired, or already used password reset token.")

        return token_obj.user

    def reset_password(self, token: str, new_password: str) -> User:
        if not new_password or len(new_password) < 6:
            raise ValueError("Password must be at least 6 characters.")

        token_hash = AuthToken.hash_token(token)
        token_obj = AuthToken.objects.filter(
            token_hash=token_hash,
            token_type=TokenType.PASSWORD_RESET
        ).select_related("user").first()

        if not token_obj or not token_obj.is_valid or not token_obj.user.is_active:
            raise ValueError("Invalid, expired, or already used password reset token.")

        user = token_obj.user
        user.set_password(new_password)
        user.save(update_fields=["password", "updated_at"])

        token_obj.mark_as_used()

        # Invalidate any other active reset tokens for this user
        AuthToken.objects.filter(
            user=user,
            token_type=TokenType.PASSWORD_RESET,
            used_at__isnull=True
        ).update(used_at=token_obj.used_at)

        return user

    def authenticate_user(self, email: str, password: str) -> User:
        if not email or not password:
            raise ValueError("Invalid email or password.")

        user = self.user_repository.get_by_email(email.strip())
        if not user:
            raise ValueError("Invalid email or password.")

        if not user.check_password(password):
            raise ValueError("Invalid email or password.")

        if not user.is_active:
            raise ValueError("User account is inactive.")

        return user

    def login_user(self, email: str, password: str) -> dict:
        user = self.authenticate_user(email, password)
        return self.generate_tokens_for_user(user)

    def logout_user(self, refresh_token: str) -> None:
        if not refresh_token:
            raise ValueError("Refresh token is required.")
        token = RefreshToken(refresh_token)
        token.blacklist()

    def get_users(self):
        return self.user_repository.get_all_users()

    def get_user_by_id(self, user_id) -> Optional[User]:
        return self.user_repository.get_user_by_id(user_id)
