import uuid
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase, TransactionTestCase, override_settings
from channels.testing import WebsocketCommunicator
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken

from config.asgi import application
from voice_calling.services import CallStateService, CallState

User = get_user_model()


@override_settings(
    PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"],
    CHANNEL_LAYERS={"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}},
)
class CallStateServiceUnitTests(TestCase):
    def setUp(self):
        cache.clear()
        self.user1 = User.objects.create_user(
            email="u1@example.com", username="u1", name="User One", password="Password@123"
        )
        self.user2 = User.objects.create_user(
            email="u2@example.com", username="u2", name="User Two", password="Password@123"
        )
        self.user3 = User.objects.create_user(
            email="u3@example.com", username="u3", name="User Three", password="Password@123"
        )

    def tearDown(self):
        cache.clear()

    def test_create_call_and_retrieve(self):
        call_id = "test-call-123"
        call = CallStateService.create_call(call_id, self.user1.id, self.user2.id)
        self.assertIsNotNone(call)
        self.assertEqual(call["call_id"], call_id)
        self.assertEqual(call["state"], CallState.CALLING)

        retrieved = CallStateService.get_call(call_id)
        self.assertEqual(retrieved["caller_id"], self.user1.id)
        self.assertEqual(retrieved["receiver_id"], self.user2.id)

    def test_user_busy_check(self):
        call_id = "test-call-456"
        CallStateService.create_call(call_id, self.user1.id, self.user2.id)
        self.assertTrue(CallStateService.is_user_busy(self.user1.id))
        self.assertTrue(CallStateService.is_user_busy(self.user2.id))
        self.assertFalse(CallStateService.is_user_busy(self.user3.id))

    def test_prevent_concurrent_call_creation(self):
        call_id_1 = "call-1"
        call_id_2 = "call-2"
        call1 = CallStateService.create_call(call_id_1, self.user1.id, self.user2.id)
        self.assertIsNotNone(call1)

        # Attempt to call user2 who is already in call
        call2 = CallStateService.create_call(call_id_2, self.user3.id, self.user2.id)
        self.assertIsNone(call2)

        # Attempt to call from user1 who is already in call
        call3 = CallStateService.create_call(call_id_2, self.user1.id, self.user3.id)
        self.assertIsNone(call3)

    def test_state_transitions_and_termination(self):
        call_id = "test-call-state"
        CallStateService.create_call(call_id, self.user1.id, self.user2.id)

        # Transition to CONNECTED
        updated = CallStateService.update_call_state(call_id, CallState.CONNECTED)
        self.assertEqual(updated["state"], CallState.CONNECTED)
        self.assertTrue(CallStateService.is_user_busy(self.user1.id))

        # Terminate with ENDED
        ended = CallStateService.terminate_call(call_id, CallState.ENDED)
        self.assertEqual(ended["state"], CallState.ENDED)
        self.assertFalse(CallStateService.is_user_busy(self.user1.id))
        self.assertFalse(CallStateService.is_user_busy(self.user2.id))


@override_settings(
    PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"],
    CHANNEL_LAYERS={"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}},
    WEBRTC_STUN_SERVER="stun:stun.example.com:3478",
    WEBRTC_TURN_SERVER="turn:turn.example.com:3478",
    WEBRTC_TURN_USERNAME="turnuser",
    WEBRTC_TURN_CREDENTIAL="turnsecretpassword",
)
class IceServerConfigApiTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="iceuser@example.com", username="iceuser", password="Password@123"
        )
        self.client = APIClient()

    def test_unauthenticated_ice_servers_rejected(self):
        response = self.client.get("/api/voice/ice-servers/")
        self.assertEqual(response.status_code, 401)

    def test_authenticated_ice_servers_returns_config(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/voice/ice-servers/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("ice_servers", data)
        ice_servers = data["ice_servers"]
        self.assertTrue(len(ice_servers) >= 2)
        urls = [s.get("urls") for s in ice_servers]
        self.assertTrue(any("stun:stun.example.com:3478" in u for u in urls))


@override_settings(
    PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"],
    CHANNEL_LAYERS={"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}},
)
class VoiceSignalingWebSocketTests(TransactionTestCase):
    def setUp(self):
        cache.clear()
        self.user_a = User.objects.create_user(
            email="usera@example.com", username="usera", name="User A", password="Password@123"
        )
        self.user_b = User.objects.create_user(
            email="userb@example.com", username="userb", name="User B", password="Password@123"
        )
        self.user_c = User.objects.create_user(
            email="userc@example.com", username="userc", name="User C", password="Password@123"
        )
        self.inactive_user = User.objects.create_user(
            email="inactive@example.com", username="inactive", is_active=False, password="Password@123"
        )

        self.token_a = str(AccessToken.for_user(self.user_a))
        self.token_b = str(AccessToken.for_user(self.user_b))
        self.token_c = str(AccessToken.for_user(self.user_c))

    def tearDown(self):
        cache.clear()

    async def get_communicator(self, token: str = None, route: str = "/ws/chat/"):
        subprotocols = ["access_token", token] if token is not None else None
        return WebsocketCommunicator(application, route, subprotocols=subprotocols)

    async def test_unauthenticated_connection_rejected(self):
        communicator = await self.get_communicator(token=None)
        connected, close_code = await communicator.connect()
        self.assertFalse(connected)
        self.assertEqual(close_code, 4001)

    async def test_self_call_rejection(self):
        comm_a = await self.get_communicator(self.token_a)
        await comm_a.connect()
        await comm_a.receive_json_from()  # connection ack

        await comm_a.send_json_to({
            "type": "call_offer",
            "receiver_id": self.user_a.id,
            "sdp": {"type": "offer", "sdp": "fake_sdp"},
        })
        resp = await comm_a.receive_json_from()
        self.assertEqual(resp.get("type"), "error")
        self.assertEqual(resp.get("code"), "INVALID_CALL")
        await comm_a.disconnect()

    async def test_invalid_receiver_rejection(self):
        comm_a = await self.get_communicator(self.token_a)
        await comm_a.connect()
        await comm_a.receive_json_from()

        await comm_a.send_json_to({
            "type": "call_offer",
            "receiver_id": 999999,
            "sdp": {"type": "offer", "sdp": "fake_sdp"},
        })
        resp = await comm_a.receive_json_from()
        self.assertEqual(resp.get("type"), "error")
        self.assertEqual(resp.get("code"), "RECEIVER_NOT_FOUND")
        await comm_a.disconnect()

    async def test_inactive_receiver_rejection(self):
        comm_a = await self.get_communicator(self.token_a)
        await comm_a.connect()
        await comm_a.receive_json_from()

        await comm_a.send_json_to({
            "type": "call_offer",
            "receiver_id": self.inactive_user.id,
            "sdp": {"type": "offer", "sdp": "fake_sdp"},
        })
        resp = await comm_a.receive_json_from()
        self.assertEqual(resp.get("type"), "error")
        self.assertEqual(resp.get("code"), "RECEIVER_NOT_FOUND")
        await comm_a.disconnect()

    async def test_call_lifecycle_offer_answer_ice_end(self):
        comm_a = await self.get_communicator(self.token_a)
        comm_b = await self.get_communicator(self.token_b)

        await comm_a.connect()
        await comm_a.receive_json_from()  # a connection ack
        await comm_b.connect()
        await comm_b.receive_json_from()  # b connection ack

        call_id = str(uuid.uuid4())

        # 1. User A initiates call_offer
        await comm_a.send_json_to({
            "type": "call_offer",
            "call_id": call_id,
            "receiver_id": self.user_b.id,
            "sdp": {"type": "offer", "sdp": "v=0\r\no=alice..."},
        })

        # A receives initiation confirmation
        resp_a = await comm_a.receive_json_from()
        self.assertEqual(resp_a.get("type"), "call_initiated")
        self.assertEqual(resp_a.get("call_id"), call_id)

        # B receives call_offer
        resp_b = await comm_b.receive_json_from()
        self.assertEqual(resp_b.get("type"), "call_offer")
        self.assertEqual(resp_b.get("call_id"), call_id)
        self.assertEqual(resp_b.get("caller_id"), self.user_a.id)

        # 2. User B sends call_answer
        await comm_b.send_json_to({
            "type": "call_answer",
            "call_id": call_id,
            "sdp": {"type": "answer", "sdp": "v=0\r\no=bob..."},
        })

        # B receives call_connected
        resp_b_conn = await comm_b.receive_json_from()
        self.assertEqual(resp_b_conn.get("type"), "call_connected")

        # A receives call_answer
        resp_a_ans = await comm_a.receive_json_from()
        self.assertEqual(resp_a_ans.get("type"), "call_answer")
        self.assertEqual(resp_a_ans.get("call_id"), call_id)

        # 3. Exchange ICE candidate
        candidate_payload = {"candidate": "candidate:1 1 UDP 2130706431 192.168.1.1 5000 typ host", "sdpMid": "0"}
        await comm_a.send_json_to({
            "type": "ice_candidate",
            "call_id": call_id,
            "candidate": candidate_payload,
        })

        # B receives ICE candidate
        resp_b_ice = await comm_b.receive_json_from()
        self.assertEqual(resp_b_ice.get("type"), "ice_candidate")
        self.assertEqual(resp_b_ice.get("call_id"), call_id)
        self.assertEqual(resp_b_ice.get("sender_id"), self.user_a.id)

        # 4. User A ends call
        await comm_a.send_json_to({
            "type": "call_end",
            "call_id": call_id,
        })

        resp_a_end = await comm_a.receive_json_from()
        self.assertEqual(resp_a_end.get("type"), "call_ended")

        resp_b_end = await comm_b.receive_json_from()
        self.assertEqual(resp_b_end.get("type"), "call_end")
        self.assertEqual(resp_b_end.get("call_id"), call_id)

        await comm_a.disconnect()
        await comm_b.disconnect()

    async def test_call_reject_flow(self):
        comm_a = await self.get_communicator(self.token_a)
        comm_b = await self.get_communicator(self.token_b)

        await comm_a.connect()
        await comm_a.receive_json_from()
        await comm_b.connect()
        await comm_b.receive_json_from()

        call_id = str(uuid.uuid4())
        await comm_a.send_json_to({
            "type": "call_offer",
            "call_id": call_id,
            "receiver_id": self.user_b.id,
            "sdp": {"type": "offer", "sdp": "offer_sdp"},
        })
        await comm_a.receive_json_from()  # call_initiated
        await comm_b.receive_json_from()  # call_offer

        # User B rejects call
        await comm_b.send_json_to({
            "type": "call_reject",
            "call_id": call_id,
        })

        resp_b = await comm_b.receive_json_from()
        self.assertEqual(resp_b.get("type"), "call_rejected")

        resp_a = await comm_a.receive_json_from()
        self.assertEqual(resp_a.get("type"), "call_reject")
        self.assertEqual(resp_a.get("call_id"), call_id)

        await comm_a.disconnect()
        await comm_b.disconnect()

    async def test_call_cancel_flow(self):
        comm_a = await self.get_communicator(self.token_a)
        comm_b = await self.get_communicator(self.token_b)

        await comm_a.connect()
        await comm_a.receive_json_from()
        await comm_b.connect()
        await comm_b.receive_json_from()

        call_id = str(uuid.uuid4())
        await comm_a.send_json_to({
            "type": "call_offer",
            "call_id": call_id,
            "receiver_id": self.user_b.id,
            "sdp": {"type": "offer", "sdp": "offer_sdp"},
        })
        await comm_a.receive_json_from()  # call_initiated
        await comm_b.receive_json_from()  # call_offer

        # User A cancels call before answer
        await comm_a.send_json_to({
            "type": "call_cancel",
            "call_id": call_id,
        })

        resp_a = await comm_a.receive_json_from()
        self.assertEqual(resp_a.get("type"), "call_cancelled")

        resp_b = await comm_b.receive_json_from()
        self.assertEqual(resp_b.get("type"), "call_cancel")
        self.assertEqual(resp_b.get("call_id"), call_id)

        await comm_a.disconnect()
        await comm_b.disconnect()

    async def test_busy_receiver_returns_call_busy(self):
        comm_a = await self.get_communicator(self.token_a)
        comm_b = await self.get_communicator(self.token_b)
        comm_c = await self.get_communicator(self.token_c)

        await comm_a.connect()
        await comm_a.receive_json_from()
        await comm_b.connect()
        await comm_b.receive_json_from()
        await comm_c.connect()
        await comm_c.receive_json_from()

        # User A calls User B
        call_id_1 = "call-a-b"
        await comm_a.send_json_to({
            "type": "call_offer",
            "call_id": call_id_1,
            "receiver_id": self.user_b.id,
            "sdp": {"type": "offer", "sdp": "offer_sdp"},
        })
        await comm_a.receive_json_from()  # call_initiated
        await comm_b.receive_json_from()  # call_offer

        # Now User C tries to call User B while User B is already in active call
        call_id_2 = "call-c-b"
        await comm_c.send_json_to({
            "type": "call_offer",
            "call_id": call_id_2,
            "receiver_id": self.user_b.id,
            "sdp": {"type": "offer", "sdp": "offer_sdp_2"},
        })

        resp_c = await comm_c.receive_json_from()
        self.assertEqual(resp_c.get("type"), "call_busy")
        self.assertEqual(resp_c.get("call_id"), call_id_2)

        await comm_a.disconnect()
        await comm_b.disconnect()
        await comm_c.disconnect()

    async def test_unauthorized_user_cannot_answer_or_inject(self):
        comm_a = await self.get_communicator(self.token_a)
        comm_b = await self.get_communicator(self.token_b)
        comm_c = await self.get_communicator(self.token_c)

        await comm_a.connect()
        await comm_a.receive_json_from()
        await comm_b.connect()
        await comm_b.receive_json_from()
        await comm_c.connect()
        await comm_c.receive_json_from()

        call_id = "call-auth-test"
        await comm_a.send_json_to({
            "type": "call_offer",
            "call_id": call_id,
            "receiver_id": self.user_b.id,
            "sdp": {"type": "offer", "sdp": "offer_sdp"},
        })
        await comm_a.receive_json_from()  # call_initiated
        await comm_b.receive_json_from()  # call_offer

        # User C tries to answer A's call to B
        await comm_c.send_json_to({
            "type": "call_answer",
            "call_id": call_id,
            "sdp": {"type": "answer", "sdp": "hacked_sdp"},
        })
        resp_c = await comm_c.receive_json_from()
        self.assertEqual(resp_c.get("type"), "error")
        self.assertEqual(resp_c.get("code"), "UNAUTHORIZED_ACTION")

        # User C tries to inject ICE candidate into A-B call
        await comm_c.send_json_to({
            "type": "ice_candidate",
            "call_id": call_id,
            "candidate": {"cand": "inject"},
        })
        resp_c2 = await comm_c.receive_json_from()
        self.assertEqual(resp_c2.get("type"), "error")
        self.assertEqual(resp_c2.get("code"), "UNAUTHORIZED_ACTION")

        await comm_a.disconnect()
        await comm_b.disconnect()
        await comm_c.disconnect()
