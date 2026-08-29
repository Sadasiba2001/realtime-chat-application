from typing import Optional, List, Dict, Any, Tuple

from datetime import timedelta
from django.db.models import Q
from django.utils import timezone
from django.conf import settings
from django.contrib.auth import get_user_model
from authentication_service.repository import UserRepository
from chatting_service.repository import MessageRepository
from chatting_service.models import Message, UserChatPin, UserChatArchive, UserChatMute, UserBlock, UserReport
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

    def send_message(self, sender: User, receiver_id: int, content: str, reply_to_id: Optional[int] = None) -> Dict[str, Any]:
        if not isinstance(content, str) or not content.strip():
            raise ValueError("Message content cannot be empty.")

        cleaned_content = content.strip()
        max_length = getattr(settings, "MAX_MESSAGE_LENGTH", 1000)
        if len(cleaned_content) > max_length:
            raise ValueError(f"Message exceeds maximum allowed length of {max_length} characters.")

        receiver = self.validate_target_user(receiver_id, sender.id)

        if self.is_blocked_between(sender.id, receiver.id):
            raise PermissionError("Messaging is restricted between these users.")

        message = self.message_repository.create_message(
            sender=sender,
            receiver=receiver,
            content=cleaned_content,
            reply_to_id=reply_to_id,
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
        pinned_partner_ids = set(UserChatPin.objects.filter(user_id=user_id).values_list("partner_id", flat=True))
        archived_partner_ids = set(UserChatArchive.objects.filter(user_id=user_id).values_list("partner_id", flat=True))
        now = timezone.now()
        muted_partner_ids = set(
            UserChatMute.objects.filter(user_id=user_id)
            .filter(Q(is_always=True) | Q(muted_until__gt=now))
            .values_list("partner_id", flat=True)
        )
        my_blocked_partner_ids = set(UserBlock.objects.filter(blocker_id=user_id).values_list("blocked_id", flat=True))
        partner_blocking_me_ids = set(UserBlock.objects.filter(blocked_id=user_id).values_list("blocker_id", flat=True))
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
                    "is_blocked": partner.id in my_blocked_partner_ids,
                    "is_blocked_by_them": partner.id in partner_blocking_me_ids,
                },
                "user_id": partner.id,
                "username": partner.username,
                "profile_image": getattr(partner, "profile_image", None),
                "profile_image_url": getattr(partner, "profile_image", None),
                "avatar": getattr(partner, "profile_image", None) or "",
                "status": presence["status"],
                "last_seen": presence["last_seen"],
                "is_pinned": partner.id in pinned_partner_ids,
                "is_archived": partner.id in archived_partner_ids,
                "is_muted": partner.id in muted_partner_ids,
                "is_blocked": partner.id in my_blocked_partner_ids,
                "is_blocked_by_them": partner.id in partner_blocking_me_ids,

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

        reply_to_data = None
        if getattr(message, "reply_to", None):
            parent = message.reply_to
            parent_deleted = getattr(parent, "is_deleted", False) or (parent.content == "This message was deleted")
            sender_name = getattr(parent.sender, "username", None) or getattr(parent.sender, "first_name", None) or f"User {parent.sender_id}"
            reply_to_data = {
                "id": parent.id,
                "sender_id": parent.sender_id,
                "sender_name": sender_name,
                "content": "This message was deleted" if parent_deleted else parent.content,
                "is_deleted": parent_deleted,
            }

    def forward_message(self, user: User, message_id: int, target_user_ids: List[int]) -> List[Dict[str, Any]]:
        orig_msg = Message.objects.select_related("sender", "receiver").filter(id=message_id).first()
        if not orig_msg:
            raise ValueError("Original message not found.")

        if user.id != orig_msg.sender_id and user.id != orig_msg.receiver_id:
            raise PermissionError("You do not have permission to forward this message.")

        if getattr(orig_msg, "is_deleted", False) or orig_msg.content == "This message was deleted":
            raise ValueError("Cannot forward a deleted message.")

        if orig_msg.is_forwarded and orig_msg.forwarded_from_name:
            original_sender_name = orig_msg.forwarded_from_name
        else:
            original_sender_name = orig_msg.sender.username or orig_msg.sender.first_name or f"User {orig_msg.sender_id}"

        forwarded_messages = []
        for target_id in target_user_ids:
            target_user = self.validate_target_user(target_id, user.id)
            new_msg = self.message_repository.create_message(
                sender=user,
                receiver=target_user,
                content=orig_msg.content,
                is_forwarded=True,
                forwarded_from_name=original_sender_name,
            )
            forwarded_messages.append(self.format_message(new_msg))

        return forwarded_messages

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

        reply_to_data = None
        if getattr(message, "reply_to", None):
            parent = message.reply_to
            parent_deleted = getattr(parent, "is_deleted", False) or (parent.content == "This message was deleted")
            sender_name = getattr(parent.sender, "username", None) or getattr(parent.sender, "first_name", None) or f"User {parent.sender_id}"
            reply_to_data = {
                "id": parent.id,
                "sender_id": parent.sender_id,
                "sender_name": sender_name,
                "content": "This message was deleted" if parent_deleted else parent.content,
                "is_deleted": parent_deleted,
            }

        return {
            "id": message.id,
            "sender_id": message.sender_id,
            "receiver_id": message.receiver_id,
            "content": message.content,
            "status": message.status,
            "is_edited": getattr(message, "is_edited", False),
            "is_deleted": is_deleted,
            "reactions": reactions_data,
            "reply_to": reply_to_data,
            "is_forwarded": getattr(message, "is_forwarded", False),
            "forwarded_from_name": getattr(message, "forwarded_from_name", None),
            "created_at": message.created_at.isoformat().replace("+00:00", "Z"),
            "updated_at": message.updated_at.isoformat().replace("+00:00", "Z") if getattr(message, "updated_at", None) else None,
        }

    def search_messages(self, user: User, query: str, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        if not isinstance(query, str) or not query.strip():
            raise ValueError("Search query cannot be empty.")

        cleaned_query = query.strip()
        page = max(1, page)
        page_size = min(max(1, page_size), self.MAX_PAGE_SIZE)
        offset = (page - 1) * page_size

        total_count, messages = self.message_repository.search_user_messages(
            user_id=user.id,
            query=cleaned_query,
            offset=offset,
            limit=page_size,
        )

        formatted = [self.format_message(msg) for msg in messages]

        return {
            "query": cleaned_query,
            "count": total_count,
            "page": page,
            "page_size": page_size,
            "results": formatted,
        }

    def pin_chat(self, user: User, target_user_id: int) -> bool:
        target_user = self.validate_target_user(target_user_id, user.id)
        UserChatPin.objects.get_or_create(user=user, partner=target_user)
        return True

    def unpin_chat(self, user: User, target_user_id: int) -> bool:
        UserChatPin.objects.filter(user=user, partner_id=target_user_id).delete()
        return True

    def unblock_user(self, blocker: User, target_user_id: int) -> bool:
        target_user_id = int(target_user_id)
        UserBlock.objects.filter(blocker=blocker, blocked_id=target_user_id).delete()
        return True

    def report_user(self, reporter: User, target_user_id: int, reason: str, description: str = "") -> Dict[str, Any]:
        target_user_id = int(target_user_id)
        if reporter.id == target_user_id:
            raise ValueError("You cannot report yourself.")

        try:
            target_user = User.objects.get(id=target_user_id)
        except User.DoesNotExist:
            raise User.DoesNotExist(f"Target user with ID {target_user_id} does not exist.")

        valid_reasons = ["SPAM", "HARASSMENT", "ABUSE", "INAPPROPRIATE_CONTENT", "OTHER"]
        upper_reason = str(reason).strip().upper()
        if upper_reason not in valid_reasons:
            raise ValueError(f"Invalid report reason. Allowed reasons: {', '.join(valid_reasons)}")

        clean_description = str(description).strip() if description else ""
        if len(clean_description) > 500:
            raise ValueError("Description cannot exceed 500 characters.")

        if upper_reason == "OTHER" and not clean_description:
            raise ValueError("An explanation description is required when reason is 'Other'.")

        report, created = UserReport.objects.update_or_create(
            reporter=reporter,
            reported_user=target_user,
            status="PENDING",
            defaults={
                "reason": upper_reason,
                "description": clean_description,
            },
        )

        return {
            "id": report.id,
            "reporter_id": report.reporter_id,
            "reported_user_id": report.reported_user_id,
            "reason": report.reason,
            "description": report.description,
            "status": report.status,
            "created_at": report.created_at.isoformat().replace("+00:00", "Z"),
        }

    def report_message(self, reporter: User, message_id: int, reason: str, description: str = "") -> Dict[str, Any]:
        message_id = int(message_id)

        try:
            target_message = Message.objects.select_related("sender", "receiver").get(id=message_id)
        except Message.DoesNotExist:
            raise Message.DoesNotExist(f"Message with ID {message_id} does not exist.")

        # Privacy / Accessibility Check: Reporter must be a participant in the conversation
        if target_message.sender_id != reporter.id and target_message.receiver_id != reporter.id:
            raise PermissionError("You do not have permission to view or report this message.")

        # Self-message report check
        if target_message.sender_id == reporter.id:
            raise ValueError("You cannot report your own message.")

        valid_reasons = ["SPAM", "HARASSMENT", "ABUSE", "INAPPROPRIATE_CONTENT", "OTHER"]
        upper_reason = str(reason).strip().upper()
        if upper_reason not in valid_reasons:
            raise ValueError(f"Invalid report reason. Allowed reasons: {', '.join(valid_reasons)}")

        clean_description = str(description).strip() if description else ""
        if len(clean_description) > 500:
            raise ValueError("Description cannot exceed 500 characters.")

        if upper_reason == "OTHER" and not clean_description:
            raise ValueError("An explanation description is required when reason is 'Other'.")

        report, created = UserReport.objects.update_or_create(
            reporter=reporter,
            reported_message=target_message,
            status="PENDING",
            defaults={
                "reported_user": target_message.sender,
                "reason": upper_reason,
                "description": clean_description,
            },
        )

        return {
            "id": report.id,
            "reporter_id": report.reporter_id,
            "reported_user_id": report.reported_user_id,
            "reported_message_id": report.reported_message_id,
            "reason": report.reason,
            "description": report.description,
            "status": report.status,
            "created_at": report.created_at.isoformat().replace("+00:00", "Z"),
        }

    def toggle_pin_chat(self, user: User, target_user_id: int) -> bool:
        target_user = self.validate_target_user(target_user_id, user.id)
        pin_obj, created = UserChatPin.objects.get_or_create(user=user, partner=target_user)
        if not created:
            pin_obj.delete()
            return False
        return True

    def archive_chat(self, user: User, target_user_id: int) -> bool:
        target_user = self.validate_target_user(target_user_id, user.id)
        UserChatArchive.objects.get_or_create(user=user, partner=target_user)
        return True

    def unarchive_chat(self, user: User, target_user_id: int) -> bool:
        UserChatArchive.objects.filter(user=user, partner_id=target_user_id).delete()
        return True

    def toggle_archive_chat(self, user: User, target_user_id: int) -> bool:
        target_user = self.validate_target_user(target_user_id, user.id)
        arc_obj, created = UserChatArchive.objects.get_or_create(user=user, partner=target_user)
        if not created:
            arc_obj.delete()
            return False
        return True

    def is_chat_muted(self, user_id: int, partner_id: int) -> bool:
        now = timezone.now()
        return UserChatMute.objects.filter(user_id=user_id, partner_id=partner_id).filter(
            Q(is_always=True) | Q(muted_until__gt=now)
        ).exists()

    def mute_chat(self, user: User, target_user_id: int, duration: str = "always") -> bool:
        target_user = self.validate_target_user(target_user_id, user.id)
        now = timezone.now()
        muted_until = None
        is_always = False

        if duration == "1h":
            muted_until = now + timedelta(hours=1)
        elif duration == "8h":
            muted_until = now + timedelta(hours=8)
        elif duration == "1w":
            muted_until = now + timedelta(days=7)
        else:
            is_always = True

        UserChatMute.objects.update_or_create(
            user=user,
            partner=target_user,
            defaults={
                "muted_until": muted_until,
                "is_always": is_always,
            },
        )
        return True

    def unmute_chat(self, user: User, target_user_id: int) -> bool:
        UserChatMute.objects.filter(user=user, partner_id=target_user_id).delete()
        return True

    def is_blocked_between(self, user_a_id: int, user_b_id: int) -> bool:
        return UserBlock.objects.filter(
            (Q(blocker_id=user_a_id, blocked_id=user_b_id) | Q(blocker_id=user_b_id, blocked_id=user_a_id))
        ).exists()

    def is_user_blocked(self, blocker_id: int, blocked_id: int) -> bool:
        return UserBlock.objects.filter(blocker_id=blocker_id, blocked_id=blocked_id).exists()

    def block_user(self, blocker: User, target_user_id: int) -> bool:
        target_user_id = int(target_user_id)
        if blocker.id == target_user_id:
            raise ValueError("You cannot block yourself.")
        target_user = self.validate_target_user(target_user_id, blocker.id)
        UserBlock.objects.get_or_create(blocker=blocker, blocked=target_user)
        return True

    def unblock_user(self, blocker: User, target_user_id: int) -> bool:
        target_user_id = int(target_user_id)
        UserBlock.objects.filter(blocker=blocker, blocked_id=target_user_id).delete()
        return True



