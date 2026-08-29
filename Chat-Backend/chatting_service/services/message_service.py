from typing import Optional, List, Dict, Any, Tuple

from django.conf import settings
from django.contrib.auth import get_user_model
from authentication_service.repository import UserRepository
from chatting_service.repository import MessageRepository
from chatting_service.models import Message
from chatting_service.services.presence_service import PresenceService

User = get_user_model()


class MessageService:
    MAX_PAGE_SIZE = 100
    DEFAULT_PAGE_SIZE = 50

    def __init__(
        self,
        message_repository: Optional[MessageRepository] = None,
        user_repository: Optional[UserRepository] = None,
        presence_service: Optional[PresenceService] = None,
    ):
        self.message_repository = message_repository or MessageRepository()
        self.user_repository = user_repository or UserRepository()
        self.presence_service = presence_service or PresenceService()


    def validate_target_user(self, target_user_id: int, authenticated_user_id: int) -> User:
        try:
            target_user_id = int(target_user_id)
        except (ValueError, TypeError):
            raise ValueError("Invalid target user ID.")

        if target_user_id == authenticated_user_id:
            raise ValueError("You cannot start a conversation with yourself.")

        target_user = self.user_repository.get_by_id(target_user_id)
        if not target_user:
            raise ValueError("Target user does not exist.")

        if not target_user.is_active:
            raise ValueError("Target user is inactive.")

        return target_user

    def send_message(self, sender: User, receiver_id: int, content: str) -> Dict[str, Any]:
        if not isinstance(content, str) or not content.strip():
            raise ValueError("Message content cannot be empty.")

        cleaned_content = content.strip()
        max_length = getattr(settings, "MAX_MESSAGE_LENGTH", 1000)
        if len(cleaned_content) > max_length:
            raise ValueError(f"Message exceeds maximum allowed length of {max_length} characters.")

        receiver = self.validate_target_user(receiver_id, sender.id)

        message = self.message_repository.create_message(
            sender=sender,
            receiver=receiver,
            content=cleaned_content,
        )

        return self.format_message(message)

    def get_conversation_messages(
        self,
        user1_id: int,
        user2_id: int,
        page: int = 1,
        page_size: int = DEFAULT_PAGE_SIZE,
        requesting_user_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        try:
            page = int(page)
            if page < 1:
                page = 1
        except (ValueError, TypeError):
            page = 1

        try:
            page_size = int(page_size)
            if page_size < 1:
                page_size = self.DEFAULT_PAGE_SIZE
            elif page_size > self.MAX_PAGE_SIZE:
                page_size = self.MAX_PAGE_SIZE
        except (ValueError, TypeError):
            page_size = self.DEFAULT_PAGE_SIZE

        filter_user_id = requesting_user_id if requesting_user_id is not None else user1_id
        total_count = self.message_repository.get_messages_count_between_users(
            user1_id=user1_id,
            user2_id=user2_id,
            requesting_user_id=filter_user_id,
        )

        offset = (page - 1) * page_size
        messages = self.message_repository.get_messages_between_users(
            user1_id=user1_id,
            user2_id=user2_id,
            offset=offset,
            limit=page_size,
            requesting_user_id=filter_user_id,
        )

        results = [self.format_message(msg) for msg in messages]

        return {
            "count": total_count,
            "page": page,
            "page_size": page_size,
            "results": results,
        }

    def get_user_conversations(self, user_id: int) -> List[Dict[str, Any]]:
        conversations_qs = self.message_repository.get_user_conversations(user_id=user_id)
        results = []
        for partner in conversations_qs:
            last_message_at_str = (
                partner.last_message_created_at.isoformat().replace("+00:00", "Z")
                if partner.last_message_created_at
                else None
            )
            presence = self.presence_service.get_user_presence(partner.id)
            results.append({
                "user": {
                    "id": partner.id,
                    "name": partner.name or partner.username,
                    "username": partner.username,
                    "email": partner.email,
                    "phone_number": partner.phone_number or "",
                    "profile_image": getattr(partner, "profile_image", None),
                    "profile_image_url": getattr(partner, "profile_image", None),
                    "avatar": getattr(partner, "profile_image", None) or "",
                    "is_active": partner.is_active,
                    "status": presence["status"],
                    "last_seen": presence["last_seen"],
                },
                "user_id": partner.id,
                "username": partner.username,
                "profile_image": getattr(partner, "profile_image", None),
                "profile_image_url": getattr(partner, "profile_image", None),
                "avatar": getattr(partner, "profile_image", None) or "",
                "status": presence["status"],
                "last_seen": presence["last_seen"],

                "last_message": {
                    "id": partner.last_message_id,
                    "sender_id": partner.last_message_sender_id,
                    "receiver_id": partner.last_message_receiver_id,
                    "content": partner.last_message_content,
                    "status": partner.last_message_status or "sent",
                    "created_at": last_message_at_str,
                } if partner.last_message_id else None,
                "last_message_at": last_message_at_str,
                "unread_count": 0,
            })
        return results

    def get_conversation_partner_ids(self, user_id: int) -> List[int]:
        return self.message_repository.get_conversation_partner_ids(user_id=user_id)

    def mark_messages_delivered(self, receiver_id: int, message_ids: List[int]) -> List[Tuple[int, int]]:
        return self.message_repository.mark_messages_delivered(
            message_ids=message_ids,
            receiver_id=receiver_id,
        )

    def mark_messages_read(
        self,
        receiver_id: int,
        sender_id: int,
        message_ids: Optional[List[int]] = None,
    ) -> List[int]:
        return self.message_repository.mark_messages_read(
            receiver_id=receiver_id,
            sender_id=sender_id,
            message_ids=message_ids,
        )

    def get_pending_sent_messages(self, user_id: int) -> List[Dict[str, Any]]:
        messages = self.message_repository.get_pending_sent_messages_for_user(user_id=user_id)
        return [self.format_message(msg) for msg in messages]

    def delete_message_for_everyone(self, message_id: int, user_id: int) -> Dict[str, Any]:
        res = self.message_repository.delete_message_for_everyone(message_id=message_id, user_id=user_id)
        if res is None:
            raise ValueError("Message not found.")
        return res

    def delete_message_for_me(self, message_id: int, user_id: int) -> Dict[str, Any]:
        res = self.message_repository.delete_message_for_me(message_id=message_id, user_id=user_id)
        if res is None:
            raise ValueError("Message not found.")
        return res

    def edit_message(self, message_id: int, user_id: int, content: str) -> Dict[str, Any]:
        if not isinstance(content, str) or not content.strip():
            raise ValueError("Message content cannot be empty.")

        cleaned_content = content.strip()
        max_length = getattr(settings, "MAX_MESSAGE_LENGTH", 1000)
        if len(cleaned_content) > max_length:
            raise ValueError(f"Message exceeds maximum allowed length of {max_length} characters.")

        message = self.message_repository.edit_message(
            message_id=message_id,
            user_id=user_id,
            new_content=cleaned_content,
        )
        if message is None:
            raise ValueError("Message not found.")

        return self.format_message(message)

    def toggle_reaction(self, message_id: int, user_id: int, emoji: str) -> Dict[str, Any]:
        if not emoji or not isinstance(emoji, str):
            raise ValueError("Emoji reaction cannot be empty.")
        return self.message_repository.toggle_reaction(message_id=message_id, user_id=user_id, emoji=emoji)

    @staticmethod
    def format_message(message: Message) -> Dict[str, Any]:
        is_deleted = getattr(message, "is_deleted", False) or (message.content == "This message was deleted")
        reactions_data = []
        if not is_deleted and hasattr(message, "reactions"):
            try:
                reactions_data = [
                    {
                        "id": r.id,
                        "emoji": r.emoji,
                        "user_id": r.user_id,
                        "user_name": r.user.username or r.user.first_name,
                    }
                    for r in message.reactions.all()
                ]
            except Exception:
                reactions_data = []

        return {
            "id": message.id,
            "sender_id": message.sender_id,
            "receiver_id": message.receiver_id,
            "content": message.content,
            "status": message.status,
            "is_edited": getattr(message, "is_edited", False),
            "is_deleted": is_deleted,
            "reactions": reactions_data,
            "created_at": message.created_at.isoformat().replace("+00:00", "Z"),
            "updated_at": message.updated_at.isoformat().replace("+00:00", "Z") if getattr(message, "updated_at", None) else None,
        }



