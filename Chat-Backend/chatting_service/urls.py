from django.urls import path
from chatting_service.controller import get_conversations, edit_message_view, delete_message_view

urlpatterns = [
    path("conversations/", get_conversations, name="get_conversations"),
    path("messages/<int:message_id>/edit/", edit_message_view, name="edit_message"),
    path("messages/<int:message_id>/delete/", delete_message_view, name="delete_message"),
    path("messages/<int:message_id>/for-me/", delete_message_view, name="delete_message_for_me"),
    path("messages/<int:message_id>/", edit_message_view, name="edit_message_alt"),
]
