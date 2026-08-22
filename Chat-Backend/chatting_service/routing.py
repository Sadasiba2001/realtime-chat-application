from django.urls import path
from chatting_service.consumers import ChatConsumer

websocket_urlpatterns = [
    path("ws/chat/", ChatConsumer.as_asgi()),
    path("ws/chat/<int:user_id>/", ChatConsumer.as_asgi()),
]
