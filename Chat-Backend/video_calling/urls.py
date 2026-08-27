from django.urls import path
from .views import VideoIceServersConfigView

urlpatterns = [
    path("ice-servers/", VideoIceServersConfigView.as_view(), name="video_ice_servers_config"),
]
