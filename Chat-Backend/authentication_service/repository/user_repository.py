from typing import Optional
from authentication_service.models import User, UserRole


class UserRepository:
    @staticmethod
    def get_by_email(email: str) -> Optional[User]:
        try:
            return User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return None

    @staticmethod
    def get_by_username(username: str) -> Optional[User]:
        try:
            return User.objects.get(username__iexact=username)
        except User.DoesNotExist:
            return None

    @staticmethod
    def get_by_id(user_id) -> Optional[User]:
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None

    @staticmethod
    def get_user_by_id(user_id) -> Optional[User]:
        return UserRepository.get_by_id(user_id)

    @staticmethod
    def get_all_users():
        return User.objects.all().order_by("-created_at")

    @staticmethod
    def exists_by_email(email: str) -> bool:
        return User.objects.filter(email__iexact=email).exists()

    @staticmethod
    def exists_by_username(username: str) -> bool:
        return User.objects.filter(username__iexact=username).exists()

    @staticmethod
    def create_user(
        name: str,
        username: str,
        email: str,
        phone_number: str = "",
        password: str = None,
        role: str = UserRole.NORMAL_USER
    ) -> User:
        return User.objects.create_user(
            email=email,
            username=username,
            name=name,
            phone_number=phone_number,
            password=password,
            role=role
        )
