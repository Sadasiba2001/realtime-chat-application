from django.urls import path
from voice_calling.views import IceServersConfigView

urlpatterns = [
    path("ice-servers/", IceServersConfigView.as_view(), name="ice_servers_config"),
]
