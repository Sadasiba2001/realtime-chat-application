from typing import Optional
from django.contrib.auth import get_user_model
from django.db.models import BigIntegerField, Case, F, OuterRef, Q, QuerySet, Subquery, When
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

    @staticmethod
    def get_user_conversations(user_id: int) -> QuerySet:
        partner_id_expr = Case(
            When(sender_id=user_id, then=F("receiver_id")),
            default=F("sender_id"),
            output_field=BigIntegerField(),
        )

        partner_ids = (
            Message.objects.filter(Q(sender_id=user_id) | Q(receiver_id=user_id))
            .annotate(partner_id=partner_id_expr)
            .values("partner_id")
            .distinct()
        )

        latest_message_subquery = Message.objects.filter(
            (Q(sender_id=user_id, receiver_id=OuterRef("pk")) | Q(sender_id=OuterRef("pk"), receiver_id=user_id))
        ).order_by("-created_at", "-id")

        return (
            User.objects.filter(id__in=Subquery(partner_ids))
            .annotate(
                last_message_id=Subquery(latest_message_subquery.values("id")[:1]),
                last_message_content=Subquery(latest_message_subquery.values("content")[:1]),
                last_message_created_at=Subquery(latest_message_subquery.values("created_at")[:1]),
                last_message_sender_id=Subquery(latest_message_subquery.values("sender_id")[:1]),
                last_message_receiver_id=Subquery(latest_message_subquery.values("receiver_id")[:1]),
            )
            .order_by("-last_message_created_at")
        )

    @staticmethod
    def get_conversation_partner_ids(user_id: int) -> list[int]:
        partner_id_expr = Case(
            When(sender_id=user_id, then=F("receiver_id")),
            default=F("sender_id"),
            output_field=BigIntegerField(),
        )
        return list(
            Message.objects.filter(Q(sender_id=user_id) | Q(receiver_id=user_id))
            .annotate(partner_id=partner_id_expr)
            .values_list("partner_id", flat=True)
            .distinct()
        )


