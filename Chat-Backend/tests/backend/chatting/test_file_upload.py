from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase
from rest_framework import status
from chatting_service.services import MessageService
from chatting_service.models import MessageAttachment

User = get_user_model()


class FileUploadUnitTests(APITestCase):
    def setUp(self):
        self.service = MessageService()
        self.user1 = User.objects.create_user(email="uploader1@example.com", username="uploader1", password="Password123!")
        self.user2 = User.objects.create_user(email="uploader2@example.com", username="uploader2", password="Password123!")

    def test_upload_file_authenticated_success(self):
        self.client.force_authenticate(user=self.user1)
        pdf_file = SimpleUploadedFile("project_summary.pdf", b"%PDF-1.5 test pdf content stream", content_type="application/pdf")

        response = self.client.post(
            "/api/v1/chat/upload/",
            {"file": pdf_file},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["status"])
        self.assertEqual(response.data["data"]["name"], "project_summary.pdf")
        self.assertEqual(response.data["data"]["type"], "document")
        self.assertTrue(MessageAttachment.objects.filter(uploader=self.user1, file_name="project_summary.pdf").exists())

    def test_unauthenticated_upload_rejected(self):
        pdf_file = SimpleUploadedFile("test.pdf", b"test content", content_type="application/pdf")
        response = self.client.post(
            "/api/v1/chat/upload/",
            {"file": pdf_file},
            format="multipart",
        )
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_oversized_file_rejected(self):
        self.client.force_authenticate(user=self.user1)
        large_bytes = b"x" * (10 * 1024 * 1024 + 1)
        large_file = SimpleUploadedFile("huge_data.bin", large_bytes, content_type="application/octet-stream")

        response = self.client.post(
            "/api/v1/chat/upload/",
            {"file": large_file},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_prohibited_extension_rejected(self):
        self.client.force_authenticate(user=self.user1)
        script_file = SimpleUploadedFile("malicious_script.exe", b"binary script data", content_type="application/x-msdownload")

        response = self.client.post(
            "/api/v1/chat/upload/",
            {"file": script_file},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_filename_path_traversal_sanitization(self):
        self.client.force_authenticate(user=self.user1)
        traversal_file = SimpleUploadedFile("../../../etc/passwd", b"root:x:0:0...", content_type="text/plain")

        response = self.client.post(
            "/api/v1/chat/upload/",
            {"file": traversal_file},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["data"]["name"], "passwd")

    def test_download_attachment_authorized_success(self):
        self.client.force_authenticate(user=self.user1)
        sample_file = SimpleUploadedFile("doc_v1.docx", b"word doc content", content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        upload_res = self.client.post(
            "/api/v1/chat/upload/",
            {"file": sample_file},
            format="multipart",
        )
        attachment_id = upload_res.data["data"]["attachment_id"]

        # User 1 (uploader) downloads attachment
        download_res = self.client.get(f"/api/v1/chat/attachments/{attachment_id}/download/")
        self.assertEqual(download_res.status_code, status.HTTP_200_OK)
        self.assertIn("doc_v1.docx", download_res["Content-Disposition"])

    def test_download_attachment_idor_rejected(self):
        self.client.force_authenticate(user=self.user1)
        sample_file = SimpleUploadedFile("private.zip", b"zip content data", content_type="application/zip")
        upload_res = self.client.post(
            "/api/v1/chat/upload/",
            {"file": sample_file},
            format="multipart",
        )
        attachment_id = upload_res.data["data"]["attachment_id"]

        # User 2 attempts to download User 1's private attachment -> 403 Forbidden
        self.client.force_authenticate(user=self.user2)
        download_res = self.client.get(f"/api/v1/chat/attachments/{attachment_id}/download/")
        self.assertEqual(download_res.status_code, status.HTTP_403_FORBIDDEN)

    def test_file_categories_detection(self):
        self.client.force_authenticate(user=self.user1)

        categories = [
            ("sample.mp3", b"ID3 audio data", "audio/mpeg", "audio"),
            ("clip.mp4", b"ftypmp42 video data", "video/mp4", "video"),
            ("archive.zip", b"PK archive data", "application/zip", "archive"),
        ]

        for fname, content, ctype, expected_type in categories:
            f = SimpleUploadedFile(fname, content, content_type=ctype)
            res = self.client.post("/api/v1/chat/upload/", {"file": f}, format="multipart")
            self.assertEqual(res.status_code, status.HTTP_201_CREATED)
            self.assertEqual(res.data["data"]["type"], expected_type)
