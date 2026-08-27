from django.db import models

# No persistent database models needed for real-time WebRTC video signaling.
# Signaling sessions and active locks are managed in high-speed Django cache.
