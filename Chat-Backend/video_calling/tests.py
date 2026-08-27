import uuid
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase, TransactionTestCase, override_settings
from channels.testing import WebsocketCommunicator
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken

from config.asgi import application
from video_calling.services import VideoCallStateService, VideoCallState

User = get_user_model()


@override_settings(
    PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"],
    CHANNEL_LAYERS={"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}},
)
class VideoCallStateServiceUnitTests(TestCase):
    def setUp(self):
        cache.clear()
        self.user1 = User.objects.create_user(
            email="vu1@example.com", username="vu1", name="Video User One", password="Password@123"
        )
        self.user2 = User.objects.create_user(
            email="vu2@example.com", username="vu2", name="Video User Two", password="Password@123"
        )
        self.user3 = User.objects.create_user(
            email="vu3@example.com", username="vu3", name="Video User Three", password="Password@123"
        )

    def tearDown(self):
        cache.clear()

    def test_create_video_call_and_retrieve(self):
        call_id = "test-video-call-123"
        call = VideoCallStateService.create_call(call_id, self.user1.id, self.user2.id)
        self.assertIsNotNone(call)
        self.assertEqual(call["call_id"], call_id)
        self.assertEqual(call["state"], VideoCallState.CALLING)

        retrieved = VideoCallStateService.get_call(call_id)
        self.assertEqual(retrieved["caller_id"], self.user1.id)
        self.assertEqual(retrieved["receiver_id"], self.user2.id)

    def test_user_busy_check(self):
        call_id = "test-video-call-456"
        VideoCallStateService.create_call(call_id, self.user1.id, self.user2.id)
        self.assertTrue(VideoCallStateService.is_user_busy(self.user1.id))
        self.assertTrue(VideoCallStateService.is_user_busy(self.user2.id))
        self.assertFalse(VideoCallStateService.is_user_busy(self.user3.id))

    def test_prevent_concurrent_video_call_creation(self):
        call_id_1 = "vcall-1"
        call_id_2 = "vcall-2"
        call1 = VideoCallStateService.create_call(call_id_1, self.user1.id, self.user2.id)
        self.assertIsNotNone(call1)

        call2 = VideoCallStateService.create_call(call_id_2, self.user3.id, self.user2.id)
        self.assertIsNone(call2)

    def test_video_state_transitions_and_lock_release(self):
        call_id = "vcall-transitions"
        VideoCallStateService.create_call(call_id, self.user1.id, self.user2.id)
        self.assertTrue(VideoCallStateService.is_user_busy(self.user1.id))

        VideoCallStateService.update_call_state(call_id, VideoCallState.CONNECTED)
        call = VideoCallStateService.get_call(call_id)
        self.assertEqual(call["state"], VideoCallState.CONNECTED)
        self.assertTrue(VideoCallStateService.is_user_busy(self.user1.id))

        VideoCallStateService.update_call_state(call_id, VideoCallState.ENDED)
        self.assertFalse(VideoCallStateService.is_user_busy(self.user1.id))
        self.assertFalse(VideoCallStateService.is_user_busy(self.user2.id))


@override_settings(
    PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"],
)
class VideoIceServersApiTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="api_vuser@example.com", username="api_vuser", name="API VUser", password="Password@123"
        )
        self.client = APIClient()

    def test_unauthenticated_request_rejected(self):
        response = self.client.get("/api/v1/video/ice-servers/")
        self.assertEqual(response.status_code, 401)

    def test_authenticated_request_returns_ice_servers(self):
        token = str(AccessToken.for_user(self.user))
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = self.client.get("/api/v1/video/ice-servers/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("ice_servers", data)
        self.assertIsInstance(data["ice_servers"], list)


@override_settings(
    PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"],
    CHANNEL_LAYERS={"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}},
)
class VideoCallSignalingIntegrationTests(TransactionTestCase):
    def setUp(self):
        cache.clear()
        self.caller = User.objects.create_user(
            email="vcaller@example.com", username="vcaller", name="VCaller", password="Password@123"
        )
        self.receiver = User.objects.create_user(
            email="vreceiver@example.com", username="vreceiver", name="VReceiver", password="Password@123"
        )
        self.other = User.objects.create_user(
            email="vother@example.com", username="vother", name="VOther", password="Password@123"
        )

        self.caller_token = str(AccessToken.for_user(self.caller))
        self.receiver_token = str(AccessToken.for_user(self.receiver))
        self.other_token = str(AccessToken.for_user(self.other))

    def tearDown(self):
        cache.clear()

    async def connect_user(self, token: str, route: str = "/ws/chat/"):
        subprotocols = ["access_token", token] if token is not None else None
        communicator = WebsocketCommunicator(application, route, subprotocols=subprotocols)
        connected, _ = await communicator.connect()
        self.assertTrue(connected)
        await communicator.receive_json_from()
        return communicator

    async def test_full_video_call_offer_answer_and_ice_flow(self):
        caller_comm = await self.connect_user(self.caller_token)
        receiver_comm = await self.connect_user(self.receiver_token)

        call_id = f"vcall_{uuid.uuid4().hex[:12]}"
        fake_offer_sdp = {"type": "offer", "sdp": "v=0\r\no=caller\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\nm=video 9 UDP/TLS/RTP/SAVPF 96\r\n"}
        fake_answer_sdp = {"type": "answer", "sdp": "v=0\r\no=receiver\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\nm=video 9 UDP/TLS/RTP/SAVPF 96\r\n"}

        # 1. Caller sends video_call_offer
        await caller_comm.send_json_to({
            "type": "video_call_offer",
            "call_id": call_id,
            "receiver_id": self.receiver.id,
            "sdp": fake_offer_sdp,
        })

        # 2. Caller receives video_call_initiated
        caller_ack = await caller_comm.receive_json_from()
        self.assertEqual(caller_ack["type"], "video_call_initiated")
        self.assertEqual(caller_ack["call_id"], call_id)

        # 3. Receiver receives video_call_offer
        receiver_offer = await receiver_comm.receive_json_from()
        self.assertEqual(receiver_offer["type"], "video_call_offer")
        self.assertEqual(receiver_offer["call_id"], call_id)
        self.assertEqual(receiver_offer["caller_id"], self.caller.id)

        # 4. Receiver sends video_call_answer
        await receiver_comm.send_json_to({
            "type": "video_call_answer",
            "call_id": call_id,
            "sdp": fake_answer_sdp,
        })

        # 5. Receiver receives video_call_connected
        receiver_ack = await receiver_comm.receive_json_from()
        self.assertEqual(receiver_ack["type"], "video_call_connected")

        # 6. Caller receives video_call_answer
        caller_answer = await caller_comm.receive_json_from()
        self.assertEqual(caller_answer["type"], "video_call_answer")
        self.assertEqual(caller_answer["call_id"], call_id)

        # 7. Exchange video_ice_candidate
        fake_candidate = {"candidate": "candidate:1 1 UDP 2122260223 192.168.1.5 50000 typ host", "sdpMid": "1", "sdpMLineIndex": 1}
        await caller_comm.send_json_to({
            "type": "video_ice_candidate",
            "call_id": call_id,
            "candidate": fake_candidate,
        })

        receiver_candidate_event = await receiver_comm.receive_json_from()
        self.assertEqual(receiver_candidate_event["type"], "video_ice_candidate")
        self.assertEqual(receiver_candidate_event["candidate"], fake_candidate)

        # 8. End call
        await caller_comm.send_json_to({
            "type": "video_call_end",
            "call_id": call_id,
        })

        receiver_end_event = await receiver_comm.receive_json_from()
        self.assertEqual(receiver_end_event["type"], "video_call_end")

        await caller_comm.disconnect()
        await receiver_comm.disconnect()

    async def test_video_call_busy_when_receiver_in_active_call(self):
        caller_comm = await self.connect_user(self.caller_token)
        receiver_comm = await self.connect_user(self.receiver_token)
        other_comm = await self.connect_user(self.other_token)

        call_id_1 = f"vcall_active_{uuid.uuid4().hex[:8]}"
        await caller_comm.send_json_to({
            "type": "video_call_offer",
            "call_id": call_id_1,
            "receiver_id": self.receiver.id,
            "sdp": {"type": "offer", "sdp": "fake_offer"},
        })
        await caller_comm.receive_json_from()
        await receiver_comm.receive_json_from()

        # Other tries to call receiver while busy
        call_id_2 = f"vcall_other_{uuid.uuid4().hex[:8]}"
        await other_comm.send_json_to({
            "type": "video_call_offer",
            "call_id": call_id_2,
            "receiver_id": self.receiver.id,
            "sdp": {"type": "offer", "sdp": "fake_offer_2"},
        })

        busy_resp = await other_comm.receive_json_from()
        self.assertEqual(busy_resp["type"], "video_call_busy")
        self.assertEqual(busy_resp["call_id"], call_id_2)

        await caller_comm.disconnect()
        await receiver_comm.disconnect()
        await other_comm.disconnect()

    async def test_video_call_reject(self):
        caller_comm = await self.connect_user(self.caller_token)
        receiver_comm = await self.connect_user(self.receiver_token)

        call_id = f"vcall_rej_{uuid.uuid4().hex[:8]}"
        await caller_comm.send_json_to({
            "type": "video_call_offer",
            "call_id": call_id,
            "receiver_id": self.receiver.id,
            "sdp": {"type": "offer", "sdp": "fake"},
        })
        await caller_comm.receive_json_from()
        await receiver_comm.receive_json_from()

        # Receiver rejects
        await receiver_comm.send_json_to({
            "type": "video_call_reject",
            "call_id": call_id,
            "reason": "Declined by user",
        })

        caller_reject_event = await caller_comm.receive_json_from()
        self.assertEqual(caller_reject_event["type"], "video_call_reject")
        self.assertEqual(caller_reject_event["call_id"], call_id)

        await caller_comm.disconnect()
        await receiver_comm.disconnect()

    async def test_video_call_cancel_by_caller(self):
        caller_comm = await self.connect_user(self.caller_token)
        receiver_comm = await self.connect_user(self.receiver_token)

        call_id = f"vcall_canc_{uuid.uuid4().hex[:8]}"
        await caller_comm.send_json_to({
            "type": "video_call_offer",
            "call_id": call_id,
            "receiver_id": self.receiver.id,
            "sdp": {"type": "offer", "sdp": "fake"},
        })
        await caller_comm.receive_json_from()
        await receiver_comm.receive_json_from()

        # Caller cancels
        await caller_comm.send_json_to({
            "type": "video_call_cancel",
            "call_id": call_id,
        })

        receiver_cancel_event = await receiver_comm.receive_json_from()
        self.assertEqual(receiver_cancel_event["type"], "video_call_cancel")
        self.assertEqual(receiver_cancel_event["call_id"], call_id)

        await caller_comm.disconnect()
        await receiver_comm.disconnect()
