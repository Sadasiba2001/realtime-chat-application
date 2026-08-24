from typing import Optional
from rest_framework_simplejwt.tokens import RefreshToken
from authentication_service.models import User, UserRole
from authentication_service.repository import UserRepository


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
        password: str
    ) -> dict:
        if not name or not name.strip():
            raise ValueError("Name is required.")
        if not username or not username.strip():
            raise ValueError("Username is required.")
        if not email or not email.strip():
            raise ValueError("Email is required.")
        if not password or not password.strip():
            raise ValueError("Password is required.")

        email = email.strip()
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
        return self.generate_tokens_for_user(user)

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
