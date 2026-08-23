from datetime import timedelta
from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.utils import timezone
from channels.testing import WebsocketCommunicator
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken

from config.asgi import application
from chatting_service.models import Message
from chatting_service.repository import MessageRepository
from chatting_service.services import MessageService

User = get_user_model()


@override_settings(
    PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"],
    CHANNEL_LAYERS={"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}},
)
class ChatServiceUnitTests(TestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(
            email="user1@example.com",
            username="user1",
            name="User One",
            password="Password@123",
        )
        self.user2 = User.objects.create_user(
            email="user2@example.com",
            username="user2",
            name="User Two",
            password="Password@123",
        )
        self.user3 = User.objects.create_user(
            email="user3@example.com",
            username="user3",
            name="User Three",
            password="Password@123",
        )
        self.user_no_chats = User.objects.create_user(
            email="no_chats@example.com",
            username="no_chats",
            name="No Chats User",
            password="Password@123",
        )
        self.inactive_user = User.objects.create_user(
            email="inactive@example.com",
            username="inactive",
            name="Inactive User",
            password="Password@123",
            is_active=False,
        )
        self.service = MessageService()
        self.repository = MessageRepository()
        self.client = APIClient()

    def test_create_and_get_messages_repository(self):
        msg1 = self.repository.create_message(self.user1, self.user2, "Hello from User 1")
        msg2 = self.repository.create_message(self.user2, self.user1, "Hello back from User 2")

        count = self.repository.get_messages_count_between_users(self.user1.id, self.user2.id)
        self.assertEqual(count, 2)

        messages = list(self.repository.get_messages_between_users(self.user1.id, self.user2.id, offset=0, limit=10))
        self.assertEqual(len(messages), 2)
        self.assertEqual(messages[0].id, msg1.id)
        self.assertEqual(messages[1].id, msg2.id)

    def test_send_message_service(self):
        result = self.service.send_message(self.user1, self.user2.id, "Test content")
        self.assertEqual(result["sender_id"], self.user1.id)
        self.assertEqual(result["receiver_id"], self.user2.id)
        self.assertEqual(result["content"], "Test content")
        self.assertTrue(Message.objects.filter(id=result["id"]).exists())

    def test_send_message_empty_content(self):
        with self.assertRaises(ValueError) as ctx:
            self.service.send_message(self.user1, self.user2.id, "   ")
        self.assertIn("Message content cannot be empty.", str(ctx.exception))

    def test_send_message_to_self(self):
        with self.assertRaises(ValueError) as ctx:
            self.service.send_message(self.user1, self.user1.id, "Self message")
        self.assertIn("You cannot start a conversation with yourself.", str(ctx.exception))

    def test_send_message_to_inactive_user(self):
        with self.assertRaises(ValueError) as ctx:
            self.service.send_message(self.user1, self.inactive_user.id, "Hello inactive")
        self.assertIn("Target user is inactive.", str(ctx.exception))

    def test_send_message_to_nonexistent_user(self):
        with self.assertRaises(ValueError) as ctx:
            self.service.send_message(self.user1, 99999, "Hello ghost")
        self.assertIn("Target user does not exist.", str(ctx.exception))

    def test_history_pagination_service(self):
        for i in range(15):
            self.repository.create_message(self.user1, self.user2, f"Msg {i}")

        history_page1 = self.service.get_conversation_messages(self.user1.id, self.user2.id, page=1, page_size=10)
        self.assertEqual(history_page1["count"], 15)
        self.assertEqual(len(history_page1["results"]), 10)
        self.assertEqual(history_page1["page"], 1)
        self.assertEqual(history_page1["page_size"], 10)

        history_page2 = self.service.get_conversation_messages(self.user1.id, self.user2.id, page=2, page_size=10)
        self.assertEqual(len(history_page2["results"]), 5)
        self.assertEqual(history_page2["page"], 2)

    def test_get_user_conversations_repository_and_service(self):
        # 1. user1 sends message to user2
        self.repository.create_message(self.user1, self.user2, "Hey user2")
        # 2. user3 sends message to user1 later
        self.repository.create_message(self.user3, self.user1, "Hey user1 from user3")

        # user1 should have conversations with user3 and user2, sorted by latest message
        convs = self.service.get_user_conversations(self.user1.id)
        self.assertEqual(len(convs), 2)
        # user3 was latest
        self.assertEqual(convs[0]["user"]["id"], self.user3.id)
        self.assertEqual(convs[0]["last_message"]["content"], "Hey user1 from user3")
        self.assertEqual(convs[1]["user"]["id"], self.user2.id)
        self.assertEqual(convs[1]["last_message"]["content"], "Hey user2")

        # user_no_chats should have 0 conversations
        no_convs = self.service.get_user_conversations(self.user_no_chats.id)
        self.assertEqual(len(no_convs), 0)

    def test_get_conversations_api_authenticated(self):
        self.repository.create_message(self.user1, self.user2, "Direct message to user 2")

        token = str(AccessToken.for_user(self.user1))
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        response = self.client.get("/api/chat/conversations/")

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["status"])
        self.assertEqual(len(data["data"]), 1)
        self.assertEqual(data["data"][0]["user"]["id"], self.user2.id)
        self.assertEqual(data["data"][0]["last_message"]["content"], "Direct message to user 2")

    def test_get_conversations_api_unauthenticated(self):
        response = self.client.get("/api/chat/conversations/")
        self.assertEqual(response.status_code, 401)



@override_settings(
    PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"],
    CHANNEL_LAYERS={"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}},
)
class ChatWebSocketTests(TestCase):
    def setUp(self):
        self.user_a = User.objects.create_user(
            email="usera@example.com",
            username="usera",
            name="User A",
            password="Password@123",
        )
        self.user_b = User.objects.create_user(
            email="userb@example.com",
            username="userb",
            name="User B",
            password="Password@123",
        )
        self.user_c = User.objects.create_user(
            email="userc@example.com",
            username="userc",
            name="User C",
            password="Password@123",
        )
        self.inactive_user = User.objects.create_user(
            email="inactive_user@example.com",
            username="inactive_user",
            name="Inactive User",
            password="Password@123",
        )
        self.token_inactive = str(AccessToken.for_user(self.inactive_user))
        self.inactive_user.is_active = False
        self.inactive_user.save()

        self.token_a = str(AccessToken.for_user(self.user_a))
        self.token_b = str(AccessToken.for_user(self.user_b))
        self.token_c = str(AccessToken.for_user(self.user_c))


    async def get_communicator(self, target_id: int, token: str = None):
        if token is not None:
            path = f"/ws/chat/{target_id}/?token={token}"
        else:
            path = f"/ws/chat/{target_id}/"
        return WebsocketCommunicator(application, path)

    # 1. WebSocket Authentication Tests
    async def test_auth_valid_jwt(self):
        communicator = await self.get_communicator(self.user_b.id, self.token_a)
        connected, _ = await communicator.connect()
        self.assertTrue(connected)
        response = await communicator.receive_json_from()
        self.assertEqual(response, {"type": "connection", "message": "Connected successfully."})
        await communicator.disconnect()

    async def test_auth_missing_jwt(self):
        communicator = await self.get_communicator(self.user_b.id)
        connected, close_code = await communicator.connect()
        self.assertFalse(connected)
        self.assertEqual(close_code, 4001)

    async def test_auth_invalid_jwt(self):
        communicator = await self.get_communicator(self.user_b.id, "invalid.token.here")
        connected, close_code = await communicator.connect()
        self.assertFalse(connected)
        self.assertEqual(close_code, 4001)

    async def test_auth_expired_jwt(self):
        token = AccessToken.for_user(self.user_a)
        token.set_exp(lifetime=-timedelta(days=1))
        expired_token_str = str(token)

        communicator = await self.get_communicator(self.user_b.id, expired_token_str)
        connected, close_code = await communicator.connect()
        self.assertFalse(connected)
        self.assertEqual(close_code, 4001)

    async def test_auth_inactive_user(self):
        communicator = await self.get_communicator(self.user_b.id, self.token_inactive)
        connected, close_code = await communicator.connect()
        self.assertFalse(connected)
        self.assertEqual(close_code, 4001)

    async def test_auth_nonexistent_user_token(self):
        token = AccessToken()
        token["user_id"] = 999999
        communicator = await self.get_communicator(self.user_b.id, str(token))
        connected, close_code = await communicator.connect()
        self.assertFalse(connected)
        self.assertEqual(close_code, 4001)

    # 2. Connection Tests
    async def test_connect_to_self_rejected(self):
        communicator = await self.get_communicator(self.user_a.id, self.token_a)
        connected, close_code = await communicator.connect()
        self.assertFalse(connected)
        self.assertEqual(close_code, 4004)

    async def test_connect_to_nonexistent_target_rejected(self):
        communicator = await self.get_communicator(99999, self.token_a)
        connected, close_code = await communicator.connect()
        self.assertFalse(connected)
        self.assertEqual(close_code, 4004)

    async def test_connect_to_inactive_target_rejected(self):
        communicator = await self.get_communicator(self.inactive_user.id, self.token_a)
        connected, close_code = await communicator.connect()
        self.assertFalse(connected)
        self.assertEqual(close_code, 4004)

    # 3. Messaging Tests
    async def test_send_valid_text_message(self):
        comm_a = await self.get_communicator(self.user_b.id, self.token_a)
        connected_a, _ = await comm_a.connect()
        self.assertTrue(connected_a)
        await comm_a.receive_json_from()  # connection event

        comm_b = await self.get_communicator(self.user_a.id, self.token_b)
        connected_b, _ = await comm_b.connect()
        self.assertTrue(connected_b)
        await comm_b.receive_json_from()  # connection event

        # User A sends a message to User B
        payload = {
            "type": "message",
            "content": "Hello Rahul!",
            # Attempt to spoof sender/receiver - must be ignored!
            "sender_id": 999,
            "receiver_id": 888,
        }
        await comm_a.send_json_to(payload)

        # Both User A and User B receive the broadcast message
        event_a = await comm_a.receive_json_from()
        event_b = await comm_b.receive_json_from()

        self.assertEqual(event_a["type"], "message")
        self.assertEqual(event_a["data"]["sender_id"], self.user_a.id)
        self.assertEqual(event_a["data"]["receiver_id"], self.user_b.id)
        self.assertEqual(event_a["data"]["content"], "Hello Rahul!")
        self.assertIn("created_at", event_a["data"])

        self.assertEqual(event_b["type"], "message")
        self.assertEqual(event_b["data"]["sender_id"], self.user_a.id)
        self.assertEqual(event_b["data"]["receiver_id"], self.user_b.id)
        self.assertEqual(event_b["data"]["content"], "Hello Rahul!")

        # Verify message is persisted in SQLite
        saved_msg = await Message.objects.filter(id=event_a["data"]["id"]).afirst()
        self.assertIsNotNone(saved_msg)
        self.assertEqual(saved_msg.content, "Hello Rahul!")
        self.assertEqual(saved_msg.sender_id, self.user_a.id)
        self.assertEqual(saved_msg.receiver_id, self.user_b.id)

        await comm_a.disconnect()
        await comm_b.disconnect()

    async def test_send_empty_and_whitespace_message(self):
        comm = await self.get_communicator(self.user_b.id, self.token_a)
        await comm.connect()
        await comm.receive_json_from()  # connection event

        # Empty content
        await comm.send_json_to({"type": "message", "content": ""})
        err1 = await comm.receive_json_from()
        self.assertEqual(err1["type"], "error")
        self.assertEqual(err1["code"], "INVALID_MESSAGE")

        # Whitespace-only content
        await comm.send_json_to({"type": "message", "content": "    \n\t  "})
        err2 = await comm.receive_json_from()
        self.assertEqual(err2["type"], "error")
        self.assertEqual(err2["code"], "INVALID_MESSAGE")

        # Missing content key
        await comm.send_json_to({"type": "message"})
        err3 = await comm.receive_json_from()
        self.assertEqual(err3["type"], "error")
        self.assertEqual(err3["code"], "INVALID_MESSAGE")

        await comm.disconnect()

    async def test_unsupported_message_type(self):
        comm = await self.get_communicator(self.user_b.id, self.token_a)
        await comm.connect()
        await comm.receive_json_from()  # connection event

        await comm.send_json_to({"type": "image", "url": "https://example.com/pic.png"})
        err = await comm.receive_json_from()
        self.assertEqual(err["type"], "error")
        self.assertEqual(err["code"], "UNSUPPORTED_MESSAGE_TYPE")

        await comm.disconnect()

    # 4. Conversation Isolation Tests
    async def test_conversation_isolation(self):
        # A <-> B connection
        comm_ab = await self.get_communicator(self.user_b.id, self.token_a)
        await comm_ab.connect()
        await comm_ab.receive_json_from()

        # B <-> A connection
        comm_ba = await self.get_communicator(self.user_a.id, self.token_b)
        await comm_ba.connect()
        await comm_ba.receive_json_from()

        # C <-> A connection (separate conversation)
        comm_ca = await self.get_communicator(self.user_a.id, self.token_c)
        await comm_ca.connect()
        await comm_ca.receive_json_from()

        # User A sends message to User B
        await comm_ab.send_json_to({"type": "message", "content": "Secret between A and B"})

        # A and B receive it
        msg_a = await comm_ab.receive_json_from()
        msg_b = await comm_ba.receive_json_from()
        self.assertEqual(msg_a["data"]["content"], "Secret between A and B")
        self.assertEqual(msg_b["data"]["content"], "Secret between A and B")

        # C must NOT receive anything
        self.assertTrue(await comm_ca.receive_nothing())

        await comm_ab.disconnect()
        await comm_ba.disconnect()
        await comm_ca.disconnect()

    # 5. History Retrieval Tests
    async def test_history_retrieval(self):
        # Seed 5 messages between A and B
        for i in range(5):
            await Message.objects.acreate(
                sender=self.user_a,
                receiver=self.user_b,
                content=f"Message {i}",
            )

        comm = await self.get_communicator(self.user_b.id, self.token_a)
        await comm.connect()
        await comm.receive_json_from()  # connection event


        # Request history page 1, page_size 3
        await comm.send_json_to({"type": "history", "page": 1, "page_size": 3})
        resp = await comm.receive_json_from()
        self.assertEqual(resp["type"], "history")
        self.assertEqual(resp["data"]["count"], 5)
        self.assertEqual(resp["data"]["page"], 1)
        self.assertEqual(resp["data"]["page_size"], 3)
        self.assertEqual(len(resp["data"]["results"]), 3)
        self.assertEqual(resp["data"]["results"][0]["content"], "Message 0")
        self.assertEqual(resp["data"]["results"][2]["content"], "Message 2")

        # Request history page 2, page_size 3
        await comm.send_json_to({"type": "history", "page": 2, "page_size": 3})
        resp2 = await comm.receive_json_from()
        self.assertEqual(len(resp2["data"]["results"]), 2)
        self.assertEqual(resp2["data"]["results"][0]["content"], "Message 3")
        self.assertEqual(resp2["data"]["results"][1]["content"], "Message 4")

        await comm.disconnect()

    # 6. User-Level Persistent WebSocket Tests
    async def test_user_level_socket_connect_and_messaging(self):
        # Connect User A to user-level socket
        comm_a = WebsocketCommunicator(application, f"/ws/chat/?token={self.token_a}")
        connected_a, _ = await comm_a.connect()
        self.assertTrue(connected_a)
        await comm_a.receive_json_from()  # connection event

        # Connect User B to user-level socket (not tied to any specific chat)
        comm_b = WebsocketCommunicator(application, f"/ws/chat/?token={self.token_b}")
        connected_b, _ = await comm_b.connect()
        self.assertTrue(connected_b)
        await comm_b.receive_json_from()  # connection event

        # Connect User C to user-level socket
        comm_c = WebsocketCommunicator(application, f"/ws/chat/?token={self.token_c}")
        connected_c, _ = await comm_c.connect()
        self.assertTrue(connected_c)
        await comm_c.receive_json_from()  # connection event

        # User A sends message targeting User B
        await comm_a.send_json_to({
            "type": "message",
            "receiver_id": self.user_b.id,
            "content": "Hello User B from user-level socket!",
        })

        # User A and User B receive it
        event_a = await comm_a.receive_json_from()
        event_b = await comm_b.receive_json_from()

        self.assertEqual(event_a["type"], "message")
        self.assertEqual(event_a["data"]["sender_id"], self.user_a.id)
        self.assertEqual(event_a["data"]["receiver_id"], self.user_b.id)
        self.assertEqual(event_a["data"]["content"], "Hello User B from user-level socket!")

        self.assertEqual(event_b["type"], "message")
        self.assertEqual(event_b["data"]["sender_id"], self.user_a.id)
        self.assertEqual(event_b["data"]["receiver_id"], self.user_b.id)
        self.assertEqual(event_b["data"]["content"], "Hello User B from user-level socket!")

        # User C receives nothing
        self.assertTrue(await comm_c.receive_nothing())

        await comm_a.disconnect()
        await comm_b.disconnect()
        await comm_c.disconnect()

    async def test_user_level_history_retrieval(self):
        await Message.objects.acreate(
            sender=self.user_a,
            receiver=self.user_b,
            content="Persistent History Test",
        )

        comm = WebsocketCommunicator(application, f"/ws/chat/?token={self.token_a}")
        connected, _ = await comm.connect()
        self.assertTrue(connected)
        await comm.receive_json_from()

        await comm.send_json_to({
            "type": "history",
            "target_user_id": self.user_b.id,
            "page": 1,
            "page_size": 10,
        })

        resp = await comm.receive_json_from()
        self.assertEqual(resp["type"], "history")
        self.assertEqual(resp["target_user_id"], self.user_b.id)
        self.assertEqual(len(resp["data"]["results"]), 1)
        self.assertEqual(resp["data"]["results"][0]["content"], "Persistent History Test")

        await comm.disconnect()

