import os
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter
from chatting_service.middleware import JWTAuthMiddlewareStack
import chatting_service.routing
import voice_calling.routing
import video_calling.routing

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": JWTAuthMiddlewareStack(
            URLRouter(
                chatting_service.routing.websocket_urlpatterns
                + voice_calling.routing.websocket_urlpatterns
                + video_calling.routing.websocket_urlpatterns
            )
        ),
    }
)
