from django.contrib import admin
from chatting_service.models import Message


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
