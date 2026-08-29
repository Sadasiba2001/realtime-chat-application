from django.conf import settings
from django.db import models


class MessageStatus(models.TextChoices):
    SENT = "sent", "Sent"
    DELIVERED = "delivered", "Delivered"
    READ = "read", "Read"


class Message(models.Model):
    id = models.BigAutoField(primary_key=True)
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_messages",
    )
    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="received_messages",
    )
    content = models.TextField()
    status = models.CharField(
        max_length=10,
        choices=MessageStatus.choices,
        default=MessageStatus.SENT,
        db_index=True,
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_edited = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    reply_to = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="replies",
    )
    is_forwarded = models.BooleanField(default=False)
    forwarded_from_name = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        db_table = "messages"
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["sender", "receiver", "created_at"]),
            models.Index(fields=["receiver", "sender", "created_at"]),
            models.Index(fields=["receiver", "status"]),
        ]

    def __str__(self):
        return f"Message {self.id} [{self.status}] from {self.sender_id} to {self.receiver_id}: {self.content[:30]}"


class UserMessageDeletion(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="message_deletions",
    )
    message = models.ForeignKey(
        Message,
        on_delete=models.CASCADE,
        related_name="user_deletions",
    )
    deleted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "user_message_deletions"
        unique_together = ("user", "message")

    def __str__(self):
        return f"User {self.user_id} deleted message {self.message_id} for self"


class MessageReaction(models.Model):
    id = models.BigAutoField(primary_key=True)
    message = models.ForeignKey(
        Message,
        on_delete=models.CASCADE,
        related_name="reactions",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="message_reactions",
    )
    emoji = models.CharField(max_length=16)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "message_reactions"
        unique_together = ("message", "user")
        indexes = [
            models.Index(fields=["message", "emoji"]),
            models.Index(fields=["user", "message"]),
        ]

    def __str__(self):
        return f"User {self.user_id} reacted {self.emoji} to message {self.message_id}"


class UserChatPin(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="chat_pins",
    )
    partner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="pinned_by_users",
    )
    pinned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "user_chat_pins"
        unique_together = ("user", "partner")
        ordering = ["-pinned_at"]

    def __str__(self):
        return f"User {self.user_id} pinned chat with {self.partner_id}"


class UserChatArchive(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="chat_archives",
    )
    partner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="archived_by_users",
    )
    archived_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "user_chat_archives"
        unique_together = ("user", "partner")
        ordering = ["-archived_at"]

    def __str__(self):
        return f"User {self.user_id} archived chat with {self.partner_id}"


class UserChatMute(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="chat_mutes",
    )
    partner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="muted_by_users",
    )
    muted_until = models.DateTimeField(null=True, blank=True)
    is_always = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "user_chat_mutes"
        unique_together = ("user", "partner")

    def is_active(self) -> bool:
        from django.utils import timezone
        if self.is_always:
            return True
        return bool(self.muted_until and self.muted_until > timezone.now())

    def __str__(self):
        return f"User {self.user_id} muted chat with {self.partner_id} (always={self.is_always}, until={self.muted_until})"


class UserBlock(models.Model):
    blocker = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="blocks_initiated",
    )
    blocked = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="blocked_by_users",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "user_blocks"
        unique_together = ("blocker", "blocked")
        ordering = ["-created_at"]

    def __str__(self):
        return f"User {self.blocker_id} blocked User {self.blocked_id}"


class UserReport(models.Model):
    REASON_CHOICES = [
        ("SPAM", "Spam"),
        ("HARASSMENT", "Harassment"),
        ("ABUSE", "Abuse"),
        ("INAPPROPRIATE_CONTENT", "Inappropriate content"),
        ("OTHER", "Other"),
    ]

    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("INVESTIGATING", "Investigating"),
        ("RESOLVED", "Resolved"),
        ("REJECTED", "Rejected"),
    ]

    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reports_submitted",
    )
    reported_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reports_received",
    )
    reported_message = models.ForeignKey(
        "Message",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="message_reports",
    )
    reason = models.CharField(max_length=50, choices=REASON_CHOICES)
    description = models.TextField(blank=True, default="")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="PENDING")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "user_reports"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Report #{self.id}: User {self.reporter_id} reported User {self.reported_user_id} ({self.reason})"


class MessageAttachment(models.Model):
    ATTACHMENT_TYPES = [
        ("image", "Image"),
        ("document", "Document"),
        ("audio", "Audio"),
        ("video", "Video"),
        ("archive", "Archive"),
        ("other", "Other"),
    ]

    id = models.BigAutoField(primary_key=True)
    message = models.ForeignKey(
        Message,
        on_delete=models.CASCADE,
        related_name="attachments",
        null=True,
        blank=True,
    )
    uploader = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="uploaded_attachments",
    )
    file_type = models.CharField(max_length=20, choices=ATTACHMENT_TYPES, default="document")
    file_name = models.CharField(max_length=255)
    file_path = models.FileField(upload_to="chat_attachments/")
    file_size = models.PositiveIntegerField(default=0)
    mime_type = models.CharField(max_length=100, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "message_attachments"
        ordering = ["created_at"]

    def __str__(self):
        return f"Attachment #{self.id}: {self.file_name} ({self.file_type})"

