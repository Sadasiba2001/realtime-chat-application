from typing import Optional, List, Tuple
from django.contrib.auth import get_user_model
from django.db.models import BigIntegerField, Case, CharField, F, OuterRef, Q, QuerySet, Subquery, When
from chatting_service.models import Message, MessageStatus, UserMessageDeletion, MessageReaction

User = get_user_model()


class MessageRepository:
    @staticmethod
    def create_message(
        sender: User,
        receiver: User,
        content: str,
        status: str = MessageStatus.SENT,
        reply_to_id: Optional[int] = None,
        is_forwarded: bool = False,
        forwarded_from_name: Optional[str] = None,
    ) -> Message:
        parent_msg = None
        if reply_to_id:
            try:
                parent_msg = Message.objects.select_related("sender", "receiver").get(id=reply_to_id)
                is_valid_conv = (
                    (parent_msg.sender_id == sender.id and parent_msg.receiver_id == receiver.id)
                    or (parent_msg.sender_id == receiver.id and parent_msg.receiver_id == sender.id)
                )
                if not is_valid_conv:
                    raise PermissionError("Referenced reply message does not belong to this conversation.")
            except Message.DoesNotExist:
                raise ValueError("Referenced reply message not found.")

        return Message.objects.create(
            sender=sender,
            receiver=receiver,
            content=content,
            status=status,
            reply_to=parent_msg,
            is_forwarded=is_forwarded,
            forwarded_from_name=forwarded_from_name,
        )

    @staticmethod
    def get_messages_between_users(
        user1_id: int,
        user2_id: int,
        offset: int = 0,
        limit: int = 50,
        requesting_user_id: Optional[int] = None,
    ) -> QuerySet[Message]:
        qs = Message.objects.filter(
            (Q(sender_id=user1_id) & Q(receiver_id=user2_id))
            | (Q(sender_id=user2_id) & Q(receiver_id=user1_id))
        )
        filter_user_id = requesting_user_id if requesting_user_id is not None else user1_id
        if filter_user_id:
            deleted_ids = UserMessageDeletion.objects.filter(user_id=filter_user_id).values_list("message_id", flat=True)
            qs = qs.exclude(id__in=deleted_ids)

        return (
            qs.select_related("sender", "receiver", "reply_to", "reply_to__sender")
            .prefetch_related("reactions__user")
            .order_by("created_at")[offset : offset + limit]
        )

    @staticmethod
    def get_messages_count_between_users(user1_id: int, user2_id: int, requesting_user_id: Optional[int] = None) -> int:
        qs = Message.objects.filter(
            (Q(sender_id=user1_id) & Q(receiver_id=user2_id))
            | (Q(sender_id=user2_id) & Q(receiver_id=user1_id))
        )
        filter_user_id = requesting_user_id if requesting_user_id is not None else user1_id
        if filter_user_id:
            deleted_ids = UserMessageDeletion.objects.filter(user_id=filter_user_id).values_list("message_id", flat=True)
            qs = qs.exclude(id__in=deleted_ids)
        return qs.count()

    @staticmethod
    def get_message_by_id(message_id: int) -> Optional[Message]:
        try:
            return Message.objects.select_related("sender", "receiver").prefetch_related("reactions__user").get(id=message_id)
        except Message.DoesNotExist:
            return None

    @staticmethod
    def edit_message(message_id: int, user_id: int, new_content: str) -> Optional[Message]:
        try:
            msg = Message.objects.select_related("sender", "receiver").get(id=message_id)
            if msg.sender_id != user_id:
                raise PermissionError("You do not have permission to edit this message.")
            if msg.is_deleted or msg.content == "This message was deleted":
                raise ValueError("Cannot edit a deleted message.")
            if msg.content != new_content:
                msg.content = new_content
                msg.is_edited = True
                msg.save(update_fields=["content", "is_edited", "updated_at"])
            return msg
        except Message.DoesNotExist:
            return None

    @staticmethod
    def delete_message_for_everyone(message_id: int, user_id: int) -> Optional[dict]:
        try:
            msg = Message.objects.select_related("sender", "receiver").get(id=message_id)
            if msg.sender_id != user_id:
                raise PermissionError("You do not have permission to delete this message for everyone.")
            msg.content = "This message was deleted"
            msg.is_deleted = True
            msg.save(update_fields=["content", "is_deleted", "updated_at"])
            partner_id = msg.receiver_id if msg.sender_id == user_id else msg.sender_id
            return {
                "message_id": msg.id,
                "sender_id": msg.sender_id,
                "receiver_id": msg.receiver_id,
                "partner_id": partner_id,
            }
        except Message.DoesNotExist:
            return None

    @staticmethod
    def delete_message_for_me(message_id: int, user_id: int) -> Optional[dict]:
        try:
            msg = Message.objects.select_related("sender", "receiver").get(id=message_id)
            if msg.sender_id != user_id and msg.receiver_id != user_id:
                raise PermissionError("You are not a participant in this conversation.")
            UserMessageDeletion.objects.get_or_create(user_id=user_id, message_id=msg.id)
            partner_id = msg.receiver_id if msg.sender_id == user_id else msg.sender_id
            return {
                "message_id": msg.id,
                "sender_id": msg.sender_id,
                "receiver_id": msg.receiver_id,
                "partner_id": partner_id,
            }
        except Message.DoesNotExist:
            return None

    @staticmethod
    def toggle_reaction(message_id: int, user_id: int, emoji: str) -> dict:
        try:
            msg = Message.objects.select_related("sender", "receiver").prefetch_related("reactions__user").get(id=message_id)
        except Message.DoesNotExist:
            raise ValueError("Message not found.")

        if msg.sender_id != user_id and msg.receiver_id != user_id:
            raise PermissionError("You are not a participant in this conversation.")

        if msg.is_deleted or msg.content == "This message was deleted":
            raise ValueError("Cannot react to a deleted message.")

        existing = MessageReaction.objects.filter(message=msg, user_id=user_id).first()
        if existing:
            if existing.emoji == emoji:
                existing.delete()
                action = "removed"
            else:
                existing.emoji = emoji
                existing.save(update_fields=["emoji"])
                action = "updated"
        else:
            MessageReaction.objects.create(message=msg, user_id=user_id, emoji=emoji)
            action = "added"

        partner_id = msg.receiver_id if msg.sender_id == user_id else msg.sender_id
        reactions_qs = MessageReaction.objects.filter(message=msg).select_related("user")
        reactions_data = [
            {
                "id": r.id,
                "emoji": r.emoji,
                "user_id": r.user_id,
                "user_name": r.user.username or r.user.first_name,
            }
            for r in reactions_qs
        ]
        return {
            "message_id": msg.id,
            "action": action,
            "emoji": emoji,
            "user_id": user_id,
            "sender_id": msg.sender_id,
            "receiver_id": msg.receiver_id,
            "partner_id": partner_id,
            "reactions": reactions_data,
        }

    @staticmethod
    def get_pending_sent_messages_for_user(user_id: int) -> QuerySet[Message]:
        """
        Retrieves all messages awaiting delivery to user_id (status is 'sent').
        """
        return (
            Message.objects.filter(receiver_id=user_id, status=MessageStatus.SENT)
            .select_related("sender", "receiver")
            .order_by("created_at")
        )

    @staticmethod
    def mark_messages_delivered(message_ids: List[int], receiver_id: int) -> List[Tuple[int, int]]:
        """
        Marks messages as delivered if their current status is 'sent' and receiver matches.
        Returns a list of (message_id, sender_id) tuples for updated messages.
        Prevents status regression (never downgrades 'read').
        """
        if not message_ids:
            return []

        # Find eligible messages
        eligible_msgs = list(
            Message.objects.filter(
                id__in=message_ids,
                receiver_id=receiver_id,
                status=MessageStatus.SENT,
            ).values_list("id", "sender_id")
        )

        if not eligible_msgs:
            return []

        ids_to_update = [msg[0] for msg in eligible_msgs]
        Message.objects.filter(id__in=ids_to_update).update(status=MessageStatus.DELIVERED)

        return eligible_msgs

    @staticmethod
    def mark_messages_read(
        receiver_id: int,
        sender_id: int,
        message_ids: Optional[List[int]] = None,
    ) -> List[int]:
        """
        Marks messages sent by sender_id to receiver_id as 'read'.
        Returns list of updated message IDs.
        Prevents regression and only touches messages not already 'read'.
        """
        qs = Message.objects.filter(
            receiver_id=receiver_id,
            sender_id=sender_id,
        ).exclude(status=MessageStatus.READ)

        if message_ids is not None:
            qs = qs.filter(id__in=message_ids)

        ids_to_update = list(qs.values_list("id", flat=True))
        if ids_to_update:
            Message.objects.filter(id__in=ids_to_update).update(status=MessageStatus.READ)

        return ids_to_update

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
                last_message_status=Subquery(latest_message_subquery.values("status")[:1]),
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



