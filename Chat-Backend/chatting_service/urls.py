from django.urls import path
from chatting_service.controller import get_conversations

urlpatterns = [
    path("conversations/", get_conversations, name="get_conversations"),
]
