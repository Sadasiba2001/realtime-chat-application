from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from chatting_service.services import MessageService
from chatting_service.models import MessageReaction

User = get_user_model()


class MessageReactionUnitTests(TestCase):
    def setUp(self):
        self.service = MessageService()
        self.user1 = User.objects.create_user(email="react1@example.com", username="react1", password="Password123!")
        self.user2 = User.objects.create_user(email="react2@example.com", username="react2", password="Password123!")
        self.user3 = User.objects.create_user(email="react3@example.com", username="react3", password="Password123!")
        self.message = self.service.send_message(sender=self.user1, receiver_id=self.user2.id, content="React to this!")

    def test_add_and_toggle_reaction_success(self):
        # 1. User 2 adds ❤️
        res1 = self.service.toggle_reaction(message_id=self.message["id"], user_id=self.user2.id, emoji="❤️")
        self.assertEqual(res1["action"], "added")
        self.assertEqual(len(res1["reactions"]), 1)
        self.assertEqual(res1["reactions"][0]["emoji"], "❤️")

        # 2. User 2 reacts with ❤️ again -> removes reaction
        res2 = self.service.toggle_reaction(message_id=self.message["id"], user_id=self.user2.id, emoji="❤️")
        self.assertEqual(res2["action"], "removed")
        self.assertEqual(len(res2["reactions"]), 0)

    def test_switch_reaction_emoji_success(self):
        # 1. User 2 adds 👍
        self.service.toggle_reaction(message_id=self.message["id"], user_id=self.user2.id, emoji="👍")
        # 2. User 2 switches to 😂
        res = self.service.toggle_reaction(message_id=self.message["id"], user_id=self.user2.id, emoji="😂")
        self.assertEqual(res["action"], "updated")
        self.assertEqual(len(res["reactions"]), 1)
        self.assertEqual(res["reactions"][0]["emoji"], "😂")

    def test_unauthorized_reaction_raises_permission_error(self):
        with self.assertRaises(PermissionError):
            self.service.toggle_reaction(message_id=self.message["id"], user_id=self.user3.id, emoji="👍")

    def test_react_to_deleted_message_raises_value_error(self):
        self.service.delete_message_for_everyone(message_id=self.message["id"], user_id=self.user1.id)
        with self.assertRaises(ValueError):
            self.service.toggle_reaction(message_id=self.message["id"], user_id=self.user2.id, emoji="❤️")


class MessageReactionAPITests(APITestCase):
    def setUp(self):
        self.service = MessageService()
        self.user1 = User.objects.create_user(email="api_r1@example.com", username="api_r1", password="Password123!")
        self.user2 = User.objects.create_user(email="api_r2@example.com", username="api_r2", password="Password123!")
        self.user3 = User.objects.create_user(email="api_r3@example.com", username="api_r3", password="Password123!")
        self.message = self.service.send_message(sender=self.user1, receiver_id=self.user2.id, content="API react message")

    def test_api_toggle_reaction_success(self):
        self.client.force_authenticate(user=self.user2)
        url = f"/api/v1/chat/messages/{self.message['id']}/reactions/"
        response = self.client.post(url, {"emoji": "❤️"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["status"])
        self.assertEqual(response.data["data"]["reactions"][0]["emoji"], "❤️")

    def test_api_unauthorized_reaction_forbidden(self):
        self.client.force_authenticate(user=self.user3)
        url = f"/api/v1/chat/messages/{self.message['id']}/reactions/"
        response = self.client.post(url, {"emoji": "👍"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(response.data["status"])
