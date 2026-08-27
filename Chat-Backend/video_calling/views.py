from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated


class VideoIceServersConfigView(APIView):
    """
    Returns safe WebRTC ICE server configuration (STUN/TURN)
    to authenticated users for video calling.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        ice_servers = []

        stun_server = getattr(
            settings,
            "WEBRTC_STUN_SERVER",
            [
                "stun:stun.l.google.com:19302",
                "stun:stun1.l.google.com:19302",
                "stun:stun2.l.google.com:19302",
                "stun:stun.cloudflare.com:3478",
            ],
        )
        if stun_server:
            if isinstance(stun_server, list):
                ice_servers.append({"urls": stun_server})
            else:
                ice_servers.append({"urls": [stun_server]})

        turn_server = getattr(settings, "WEBRTC_TURN_SERVER", None)
        turn_username = getattr(settings, "WEBRTC_TURN_USERNAME", None)
        turn_credential = getattr(settings, "WEBRTC_TURN_CREDENTIAL", None)

        if turn_server:
            turn_config = {
                "urls": [turn_server] if isinstance(turn_server, str) else turn_server
            }
            if turn_username:
                turn_config["username"] = turn_username
            if turn_credential:
                turn_config["credential"] = turn_credential
            ice_servers.append(turn_config)

        return Response({"ice_servers": ice_servers})
