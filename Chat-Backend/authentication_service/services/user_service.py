from typing import Optional
from django.db.models import QuerySet
from authentication_service.models import User
from authentication_service.repository import UserRepository


class UserService:
    def __init__(self, user_repository: Optional[UserRepository] = None):
        self.user_repository = user_repository or UserRepository()

    def search_users(self, query: str, current_user_id: int) -> QuerySet[User]:
        if not query or not query.strip():
            raise ValueError("Search query is required.")

        cleaned_query = query.strip()
        return self.user_repository.search_users(
            query=cleaned_query,
            exclude_user_id=current_user_id,
        )
