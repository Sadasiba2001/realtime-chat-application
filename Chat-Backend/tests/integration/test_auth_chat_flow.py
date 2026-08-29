from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from chatting_service.services import MessageService

User = get_user_model()


class AuthAndChatIntegrationTests(APITestCase):
    def setUp(self):
        self.message_service = MessageService()
        self.user1 = User.objects.create_user(email="int1@example.com", username="int1", password="Password123!")
        self.user2 = User.objects.create_user(email="int2@example.com", username="int2", password="Password123!")

    def test_full_auth_and_chat_lifecycle(self):
        # 1. Login user 1
        login_res = self.client.post(reverse("login"), {"email": "int1@example.com", "password": "Password123!"}, format="json")
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)

        # 2. User 1 sends message to User 2 via MessageService
        msg_data = self.message_service.send_message(sender=self.user1, receiver_id=self.user2.id, content="Integration message")
        self.assertEqual(msg_data["content"], "Integration message")

        # 3. Retrieve conversation history between user 1 and user 2
        history = self.message_service.get_conversation_messages(user1_id=self.user1.id, user2_id=self.user2.id)
        self.assertEqual(history["count"], 1)

        # 4. User 1 soft-deletes message for everyone
        del_info = self.message_service.delete_message_for_everyone(message_id=msg_data["id"], user_id=self.user1.id)
        self.assertIsNotNone(del_info)

        # 5. Verify updated content in history
        updated_history = self.message_service.get_conversation_messages(user1_id=self.user1.id, user2_id=self.user2.id)
        self.assertEqual(updated_history["results"][0]["content"], "This message was deleted")
