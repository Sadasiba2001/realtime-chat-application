from typing import Optional
from django.db.models import Q, QuerySet
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
        role: str = UserRole.NORMAL_USER,
    ) -> User:
        return User.objects.create_user(
            email=email,
            username=username,
            name=name,
            phone_number=phone_number,
            password=password,
            role=role,
        )

    @staticmethod
    def search_users(query: str, exclude_user_id: int) -> QuerySet[User]:
        return (
            User.objects.filter(is_active=True)
            .exclude(id=exclude_user_id)
            .filter(
                Q(username__icontains=query)
                | Q(name__icontains=query)
                | Q(email__icontains=query)
                | Q(phone_number__icontains=query)
            )
            .order_by("username")
        )

    @staticmethod
    def update_profile_image(
        user: User,
        profile_image_url: str,
        profile_image_public_id: str,
    ) -> User:
        user.profile_image = profile_image_url
        user.profile_image_public_id = profile_image_public_id
        user.save(update_fields=["profile_image", "profile_image_public_id", "updated_at"])
        return user

    @staticmethod
    def remove_profile_image(user: User) -> User:
        user.profile_image = None
        user.profile_image_public_id = None
        user.save(update_fields=["profile_image", "profile_image_public_id", "updated_at"])
        return user

