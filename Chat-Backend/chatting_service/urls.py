from django.urls import path
from chatting_service.controller import get_conversations, edit_message_view

urlpatterns = [
    path("conversations/", get_conversations, name="get_conversations"),
    path("messages/<int:message_id>/edit/", edit_message_view, name="edit_message"),
    path("messages/<int:message_id>/", edit_message_view, name="edit_message_alt"),
]
