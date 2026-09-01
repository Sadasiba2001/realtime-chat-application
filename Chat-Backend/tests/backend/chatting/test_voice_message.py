from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase
from rest_framework import status
from chatting_service.services import MessageService
from chatting_service.models import Message, MessageAttachment

User = get_user_model()


class VoiceMessageUnitTests(APITestCase):
    def setUp(self):
        self.service = MessageService()
        self.user1 = User.objects.create_user(email="voice1@example.com", username="voice1", password="Password123!")
        self.user2 = User.objects.create_user(email="voice2@example.com", username="voice2", password="Password123!")
        self.user3 = User.objects.create_user(email="voice3@example.com", username="voice3", password="Password123!")

    def test_voice_message_upload_success(self):
        self.client.force_authenticate(user=self.user1)
        webm_audio = SimpleUploadedFile("voice_note_1001.webm", b"\x1a\x45\xdf\xa3 audio stream data", content_type="audio/webm")

        response = self.client.post(
            "/api/v1/chat/upload/",
            {"file": webm_audio},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["status"])
        self.assertEqual(response.data["data"]["type"], "audio")
        self.assertEqual(response.data["data"]["name"], "voice_note_1001.webm")

        attachment_id = response.data["data"]["attachment_id"]
        attachment = MessageAttachment.objects.get(id=attachment_id)
        self.assertEqual(attachment.uploader, self.user1)
        self.assertEqual(attachment.file_type, "audio")

    def test_voice_message_download_authorization(self):
        self.client.force_authenticate(user=self.user1)
        audio_file = SimpleUploadedFile("voice_note_1002.webm", b"audio stream", content_type="audio/webm")
        upload_res = self.client.post("/api/v1/chat/upload/", {"file": audio_file}, format="multipart")
        att_id = upload_res.data["data"]["attachment_id"]

        # Sender (user1) can download voice note
        download_res = self.client.get(f"/api/v1/chat/attachments/{att_id}/download/")
        self.assertEqual(download_res.status_code, status.HTTP_200_OK)

        # Unauthorized third party (user3) is blocked -> 403 Forbidden
        self.client.force_authenticate(user=self.user3)
        unauth_res = self.client.get(f"/api/v1/chat/attachments/{att_id}/download/")
        self.assertEqual(unauth_res.status_code, status.HTTP_403_FORBIDDEN)

    def test_voice_message_appears_in_shared_media(self):
        self.client.force_authenticate(user=self.user1)

        msg = Message.objects.create(sender=self.user1, receiver=self.user2, content="🎤 Voice Message")
        att = MessageAttachment.objects.create(
            message=msg,
            uploader=self.user1,
            file_type="audio",
            file_name="voice_note_1003.webm",
            file_path=SimpleUploadedFile("voice_note_1003.webm", b"audio bytes", content_type="audio/webm"),
            file_size=512,
            mime_type="audio/webm",
        )

        response = self.client.get(f"/api/v1/chat/conversations/{self.user2.id}/shared-media/?category=media")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        items = response.data["data"]["items"]
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["type"], "audio")
        self.assertEqual(items[0]["name"], "voice_note_1003.webm")
