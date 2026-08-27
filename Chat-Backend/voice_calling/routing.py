from django.urls import path
from voice_calling.consumers import VoiceCallConsumer

websocket_urlpatterns = [
    path("ws/voice/", VoiceCallConsumer.as_asgi()),
    path("ws/call/", VoiceCallConsumer.as_asgi()),
]
