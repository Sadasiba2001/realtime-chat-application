import logging
from typing import Optional, Dict, Any
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models import QuerySet
from authentication_service.models import User
from authentication_service.repository import UserRepository
from authentication_service.services.cloudinary_service import CloudinaryService
from chatting_service.services import MessageService

logger = logging.getLogger(__name__)


class UserService:
    def __init__(
        self,
        user_repository: Optional[UserRepository] = None,
        cloudinary_service: Optional[CloudinaryService] = None,
        message_service: Optional[MessageService] = None,
    ):
        self.user_repository = user_repository or UserRepository()
        self.cloudinary_service = cloudinary_service or CloudinaryService()
        self.message_service = message_service or MessageService()

    def search_users(self, query: str, current_user_id: int) -> QuerySet[User]:
        if not query or not query.strip():
            raise ValueError("Search query is required.")

        cleaned_query = query.strip()
        return self.user_repository.search_users(
            query=cleaned_query,
            exclude_user_id=current_user_id,
        )

    def upload_profile_image(self, user: User, file) -> Dict[str, Any]:
        if not user or not user.id:
            raise ValueError("Authenticated user is required.")

        # Upload & optimize to Cloudinary (using deterministic public ID user_{id})
        upload_result = self.cloudinary_service.upload_profile_image(user.id, file)

        # Update database
        updated_user = self.user_repository.update_profile_image(
            user=user,
            profile_image_url=upload_result["profile_image_url"],
            profile_image_public_id=upload_result["profile_image_public_id"],
        )

        # Broadcast real-time profile update to conversation partners & own sessions
        self._broadcast_profile_update(updated_user)

        return {
            "profile_image": updated_user.profile_image,
            "profile_image_url": updated_user.profile_image_url,
            "profile_image_public_id": updated_user.profile_image_public_id,
        }

    def remove_profile_image(self, user: User) -> Dict[str, Any]:
        if not user or not user.id:
            raise ValueError("Authenticated user is required.")

        old_public_id = user.profile_image_public_id

        # Update database first
        updated_user = self.user_repository.remove_profile_image(user)

        # Cleanup Cloudinary asset if public ID was present
        if old_public_id:
            self.cloudinary_service.delete_image(old_public_id)

        # Broadcast real-time profile update
        self._broadcast_profile_update(updated_user)

        return {
            "profile_image": None,
            "profile_image_url": None,
            "profile_image_public_id": None,
        }

    def _broadcast_profile_update(self, user: User) -> None:
        try:
            channel_layer = get_channel_layer()
            if not channel_layer:
                return

            partner_ids = self.message_service.get_conversation_partner_ids(user.id)
            targets = set(partner_ids)
            targets.add(user.id)  # Also synchronize all open tabs of current user

            for target_id in targets:
                async_to_sync(channel_layer.group_send)(
                    f"user_{target_id}",
                    {
                        "type": "user.profile.event",
                        "data": {
                            "type": "profile_update",
                            "user_id": user.id,
                            "profile_image_url": user.profile_image_url,
                            "profile_image": user.profile_image,
                            "avatar": user.profile_image_url,
                        },
                    },
                )
        except Exception as exc:
            logger.warning(f"[UserService] Failed to broadcast profile update: {exc}")

