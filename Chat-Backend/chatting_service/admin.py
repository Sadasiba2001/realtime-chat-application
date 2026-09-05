from django.contrib import admin
from chatting_service.models import Message, UserReport, MessageAttachment


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("id", "sender", "receiver", "short_content", "created_at")
    list_filter = ("created_at",)
    search_fields = (
        "content",
        "sender__email",
        "sender__username",
        "receiver__email",
        "receiver__username",
    )
    readonly_fields = ("created_at", "updated_at")
    ordering = ("-created_at",)

    @admin.display(description="Content")
    def short_content(self, obj):
        if len(obj.content) > 50:
            return f"{obj.content[:47]}..."
        return obj.content


@admin.register(UserReport)
class UserReportAdmin(admin.ModelAdmin):
    list_display = ("id", "reporter", "reported_user", "reported_message", "reason", "status", "created_at")
    list_filter = ("reason", "status", "created_at")
    search_fields = (
        "reporter__email",
        "reporter__username",
        "reported_user__email",
        "reported_user__username",
        "description",
    )
    raw_id_fields = ("reported_message",)
    readonly_fields = ("created_at", "updated_at")
    ordering = ("-created_at",)


@admin.register(MessageAttachment)
class MessageAttachmentAdmin(admin.ModelAdmin):
    list_display = ("id", "uploader", "file_name", "file_type", "file_size", "created_at")
    list_filter = ("file_type", "created_at")
    search_fields = ("file_name", "uploader__email", "uploader__username")
    raw_id_fields = ("message",)
    readonly_fields = ("created_at",)
    ordering = ("-created_at",)
