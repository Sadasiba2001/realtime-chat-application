from typing import Optional
from django.contrib.auth import get_user_model
from django.db.models import Q, QuerySet
from chatting_service.models import Message

User = get_user_model()


class MessageRepository:
    @staticmethod
    def create_message(sender: User, receiver: User, content: str) -> Message:
        return Message.objects.create(
            sender=sender,
            receiver=receiver,
            content=content,
        )

    @staticmethod
    def get_messages_between_users(
        user1_id: int,
        user2_id: int,
        offset: int = 0,
        limit: int = 50,
    ) -> QuerySet[Message]:
        return (
            Message.objects.filter(
                (Q(sender_id=user1_id) & Q(receiver_id=user2_id))
                | (Q(sender_id=user2_id) & Q(receiver_id=user1_id))
            )
            .select_related("sender", "receiver")
            .order_by("created_at")[offset : offset + limit]
        )

    @staticmethod
    def get_messages_count_between_users(user1_id: int, user2_id: int) -> int:
        return Message.objects.filter(
            (Q(sender_id=user1_id) & Q(receiver_id=user2_id))
            | (Q(sender_id=user2_id) & Q(receiver_id=user1_id))
        ).count()

    @staticmethod
    def get_message_by_id(message_id: int) -> Optional[Message]:
        try:
            return Message.objects.select_related("sender", "receiver").get(id=message_id)
        except Message.DoesNotExist:
            return None
