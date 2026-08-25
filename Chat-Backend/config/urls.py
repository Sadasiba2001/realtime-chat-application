from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/auth/", include("authentication_service.urls")),
    path("api/chat/", include("chatting_service.urls")),
    path("api/v1/chat/", include("chatting_service.urls")),
    path("api/voice/", include("voice_calling.urls")),
    path("api/v1/voice/", include("voice_calling.urls")),
]

