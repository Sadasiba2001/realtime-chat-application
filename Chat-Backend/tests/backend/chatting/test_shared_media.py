from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase
from rest_framework import status
from chatting_service.services import MessageService
from chatting_service.models import Message, MessageAttachment, UserMessageDeletion

User = get_user_model()


class SharedMediaUnitTests(APITestCase):
    def setUp(self):
        self.service = MessageService()
        self.user1 = User.objects.create_user(email="shared1@example.com", username="shared1", password="Password123!")
        self.user2 = User.objects.create_user(email="shared2@example.com", username="shared2", password="Password123!")
        self.user3 = User.objects.create_user(email="shared3@example.com", username="shared3", password="Password123!")

        # Create messages and attachments between user1 and user2
        self.msg1 = Message.objects.create(sender=self.user1, receiver=self.user2, content="Check this link https://github.com and image")
        self.img_att = MessageAttachment.objects.create(
            message=self.msg1,
            uploader=self.user1,
            file_type="image",
            file_name="photo.jpg",
            file_path=SimpleUploadedFile("photo.jpg", b"img bytes", content_type="image/jpeg"),
            file_size=1024,
            mime_type="image/jpeg",
        )

        self.msg2 = Message.objects.create(sender=self.user2, receiver=self.user1, content="Here is document file")
        self.doc_att = MessageAttachment.objects.create(
            message=self.msg2,
            uploader=self.user2,
            file_type="document",
            file_name="report.pdf",
            file_path=SimpleUploadedFile("report.pdf", b"pdf bytes", content_type="application/pdf"),
            file_size=2048,
            mime_type="application/pdf",
        )

        self.msg3 = Message.objects.create(sender=self.user1, receiver=self.user2, content="Useful website: http://example.com/docs")

    def test_shared_media_category_media_success(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(f"/api/v1/chat/conversations/{self.user2.id}/shared-media/?category=media")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["status"])
        self.assertEqual(response.data["data"]["category"], "media")
        items = response.data["data"]["items"]
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["name"], "photo.jpg")

    def test_shared_media_category_files_success(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(f"/api/v1/chat/conversations/{self.user2.id}/shared-media/?category=files")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["status"])
        self.assertEqual(response.data["data"]["category"], "files")
        items = response.data["data"]["items"]
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["name"], "report.pdf")

    def test_shared_media_category_links_success(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(f"/api/v1/chat/conversations/{self.user2.id}/shared-media/?category=links")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["status"])
        self.assertEqual(response.data["data"]["category"], "links")
        items = response.data["data"]["items"]
        self.assertEqual(len(items), 2)
        urls = [item["url"] for item in items]
        self.assertIn("https://github.com", urls)
        self.assertIn("http://example.com/docs", urls)

    def test_shared_media_pagination(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(f"/api/v1/chat/conversations/{self.user2.id}/shared-media/?category=links&page=1&page_size=1")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["data"]["has_next"])
        self.assertEqual(len(response.data["data"]["items"]), 1)

    def test_shared_media_deleted_messages_excluded(self):
        self.client.force_authenticate(user=self.user1)

        # Soft delete msg1
        UserMessageDeletion.objects.create(user=self.user1, message=self.msg1)

        response = self.client.get(f"/api/v1/chat/conversations/{self.user2.id}/shared-media/?category=media")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["data"]["items"]), 0)

    def test_unauthenticated_access_rejected(self):
        response = self.client.get(f"/api/v1/chat/conversations/{self.user2.id}/shared-media/?category=media")
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])
