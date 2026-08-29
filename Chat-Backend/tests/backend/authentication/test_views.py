from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model

User = get_user_model()


class AuthenticationViewsTests(APITestCase):
    def setUp(self):
        self.register_url = reverse("register")
        self.login_url = reverse("login")
        self.user_data = {
            "name": "Auth Tester",
            "username": "authtester",
            "email": "authtester@example.com",
            "password": "StrongPassword123!",
            "phone_number": "1234567890",
        }

    def test_register_user_success(self):
        response = self.client.post(self.register_url, self.user_data, format="json")
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])
        self.assertTrue(User.objects.filter(username="authtester").exists())

    def test_register_user_missing_fields(self):
        invalid_data = {"email": "invalid@example.com"}
        response = self.client.post(self.register_url, invalid_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_user_success(self):
        User.objects.create_user(
            email=self.user_data["email"],
            username=self.user_data["username"],
            password=self.user_data["password"],
        )
        login_payload = {
            "email": self.user_data["email"],
            "password": self.user_data["password"],
        }
        response = self.client.post(self.login_url, login_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_login_user_invalid_password(self):
        User.objects.create_user(
            email=self.user_data["email"],
            username=self.user_data["username"],
            password=self.user_data["password"],
        )
        login_payload = {
            "email": self.user_data["email"],
            "password": "WrongPassword!",
        }
        response = self.client.post(self.login_url, login_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_nonexistent_user(self):
        login_payload = {
            "email": "nonexistent@example.com",
            "password": "Password123!",
        }
        response = self.client.post(self.login_url, login_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
