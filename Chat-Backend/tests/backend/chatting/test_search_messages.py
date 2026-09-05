from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from chatting_service.services import MessageService
from chatting_service.models import UserMessageDeletion

User = get_user_model()


class MessageSearchUnitTests(APITestCase):
    def setUp(self):
        self.service = MessageService()
        self.user1 = User.objects.create_user(email="srch1@example.com", username="srch1", password="Password123!")
        self.user2 = User.objects.create_user(email="srch2@example.com", username="srch2", password="Password123!")
        self.user3 = User.objects.create_user(email="srch3@example.com", username="srch3", password="Password123!")

        self.msg1 = self.service.send_message(sender=self.user1, receiver_id=self.user2.id, content="Let's schedule a meeting tomorrow.")
        self.msg2 = self.service.send_message(sender=self.user2, receiver_id=self.user1.id, content="Project update report is ready.")
        self.msg3 = self.service.send_message(sender=self.user3, receiver_id=self.user2.id, content="Private meeting with User 2.")

        self.search_url = "/api/v1/chat/messages/search/"

    def test_search_messages_keyword_match(self):
        res = self.service.search_messages(user=self.user1, query="meeting")
        self.assertEqual(res["count"], 1)
        self.assertEqual(res["results"][0]["id"], self.msg1["id"])

    def test_search_messages_authorization_isolation(self):
        # User 1 searches 'meeting' -> only finds msg1, not msg3 (private between user 3 & 2)
        res = self.service.search_messages(user=self.user1, query="meeting")
        found_ids = [m["id"] for m in res["results"]]
        self.assertIn(self.msg1["id"], found_ids)
        self.assertNotIn(self.msg3["id"], found_ids)

    def test_search_messages_deleted_for_me_excluded(self):
        # Delete msg1 for user1
        UserMessageDeletion.objects.create(user=self.user1, message_id=self.msg1["id"])
        res = self.service.search_messages(user=self.user1, query="meeting")
        self.assertEqual(res["count"], 0)

    def test_search_api_endpoint(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(f"{self.search_url}?q=project")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["status"])
        self.assertEqual(len(response.data["data"]["results"]), 1)
        self.assertEqual(response.data["data"]["results"][0]["content"], "Project update report is ready.")

    def test_search_api_empty_query_fails(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(f"{self.search_url}?q=")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
