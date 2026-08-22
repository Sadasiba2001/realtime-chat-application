from django.contrib.auth import get_user_model
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


@override_settings(PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"])
class AuthenticationAPITests(APITestCase):
    def setUp(self):
        self.register_url = "/api/v1/auth/register/"
        self.login_url = "/api/v1/auth/login/"
        self.logout_url = "/api/v1/auth/logout/"
        self.token_refresh_url = "/api/v1/auth/token/refresh/"
        self.token_verify_url = "/api/v1/auth/token/verify/"
        self.users_url = "/api/v1/auth/users/"

    def test_registration_success_with_jwt_tokens(self):
        """Registration API must return status, message, and JWT access/refresh tokens."""
        payload = {
            "name": "Vikram Reddy",
            "username": "vikramreddy",
            "email": "vikram.reddy@example.com",
            "phone_number": "+919845612370",
            "password": "Vikram@12345",
        }
        response = self.client.post(self.register_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["status"])
        self.assertEqual(response.data["message"], "User registered successfully.")
        self.assertIn("data", response.data)
        self.assertIn("access", response.data["data"])
        self.assertIn("refresh", response.data["data"])

        # Verify user in database
        user = User.objects.get(email="vikram.reddy@example.com")
        self.assertEqual(user.role, "NORMAL_USER")
        self.assertTrue(user.check_password("Vikram@12345"))
        self.assertNotEqual(user.password, "Vikram@12345")

        # Explicitly verify sensitive fields are NOT in response
        forbidden_fields = ["password", "password_hash", "is_superuser", "is_staff"]
        for field in forbidden_fields:
            self.assertNotIn(field, response.data)
            self.assertNotIn(field, response.data["data"])

    def test_login_success_with_jwt_tokens(self):
        User.objects.create_user(
            email="login.user@example.com",
            username="loginuser",
            name="Login User",
            password="Login@12345",
        )
        payload = {
            "email": "login.user@example.com",
            "password": "Login@12345",
        }
        response = self.client.post(self.login_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["status"])
        self.assertEqual(response.data["message"], "Login successful.")
        self.assertIn("data", response.data)
        self.assertIn("access", response.data["data"])
        self.assertIn("refresh", response.data["data"])
        self.assertNotIn("password", response.data)

    def test_login_invalid_password(self):
        User.objects.create_user(
            email="wrong.pass@example.com",
            username="wrongpass",
            name="Wrong Pass User",
            password="Correct@12345",
        )
        payload = {
            "email": "wrong.pass@example.com",
            "password": "WrongPassword@123",
        }
        response = self.client.post(self.login_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data,
            {
                "status": False,
                "message": "Invalid email or password.",
            },
        )

    def test_login_nonexistent_email(self):
        payload = {
            "email": "nonexistent@example.com",
            "password": "Password@123",
        }
        response = self.client.post(self.login_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data,
            {
                "status": False,
                "message": "Invalid email or password.",
            },
        )

    def test_login_inactive_user(self):
        User.objects.create_user(
            email="inactive@example.com",
            username="inactiveuser",
            name="Inactive User",
            password="Password@123",
            is_active=False,
        )
        payload = {
            "email": "inactive@example.com",
            "password": "Password@123",
        }
        response = self.client.post(self.login_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["status"])
        self.assertEqual(response.data["message"], "User account is inactive.")

    def test_token_refresh(self):
        user = User.objects.create_user(
            email="refresh.test@example.com",
            username="refreshtest",
            name="Refresh Test",
            password="Password@123",
        )
        refresh = str(RefreshToken.for_user(user))
        response = self.client.post(
            self.token_refresh_url,
            {"refresh": refresh},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["status"])
        self.assertIn("access", response.data["data"])

    def test_token_verify(self):
        user = User.objects.create_user(
            email="verify.test@example.com",
            username="verifytest",
            name="Verify Test",
            password="Password@123",
        )
        access_token = str(RefreshToken.for_user(user).access_token)
        response = self.client.post(
            self.token_verify_url,
            {"token": access_token},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["status"])
        self.assertEqual(response.data["message"], "Token is valid.")

    def test_token_verify_invalid(self):
        response = self.client.post(
            self.token_verify_url,
            {"token": "invalid.jwt.token"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(response.data["status"])

    def test_logout_and_blacklisting(self):
        user = User.objects.create_user(
            email="logout.test@example.com",
            username="logouttest",
            name="Logout Test",
            password="Password@123",
        )
        refresh = str(RefreshToken.for_user(user))
        response = self.client.post(
            self.logout_url,
            {"refresh": refresh},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["status"])
        self.assertEqual(response.data["message"], "Logout successful.")

        # Attempting to refresh using blacklisted token must fail
        refresh_response = self.client.post(
            self.token_refresh_url,
            {"refresh": refresh},
            format="json",
        )
        self.assertEqual(refresh_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(refresh_response.data["status"])

    def test_logout_missing_refresh_token(self):
        response = self.client.post(self.logout_url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["status"])
        self.assertEqual(response.data["message"], "Refresh token is required.")

    def test_protected_users_list_without_token_fails(self):
        response = self.client.get(self.users_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_protected_users_list_with_valid_token(self):
        user = User.objects.create_user(
            email="auth.user@example.com",
            username="authuser",
            name="Auth User",
            password="Password@123",
        )
        access_token = str(RefreshToken.for_user(user).access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

        response = self.client.get(self.users_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["status"])
        self.assertEqual(response.data["message"], "Users retrieved successfully.")
        self.assertEqual(response.data["data"]["count"], 1)

    def test_protected_users_list_pagination_default_limit_10(self):
        for i in range(15):
            User.objects.create_user(
                email=f"pguser{i}@example.com",
                username=f"pguser{i}",
                name=f"PG User {i}",
                password="Password@123",
            )
        auth_user = User.objects.first()
        access_token = str(RefreshToken.for_user(auth_user).access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

        # Test default limit = 10
        response = self.client.get(self.users_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data["data"]
        self.assertEqual(data["count"], 15)
        self.assertEqual(len(data["results"]), 10)
        self.assertIsNotNone(data["next"])
        self.assertIsNone(data["previous"])

        # Test limit query param (e.g. limit=5)
        res_limit = self.client.get(f"{self.users_url}?limit=5")
        self.assertEqual(res_limit.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_limit.data["data"]["results"]), 5)

        # Test page_size query param (e.g. page_size=7)
        res_page_size = self.client.get(f"{self.users_url}?page_size=7")
        self.assertEqual(res_page_size.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_page_size.data["data"]["results"]), 7)

    def test_protected_user_detail_without_token_fails(self):
        user = User.objects.create_user(
            email="detail.target@example.com",
            username="detailtarget",
            name="Detail Target",
            password="Password@123",
        )
        response = self.client.get(f"{self.users_url}{user.id}/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_protected_user_detail_with_valid_token(self):
        user = User.objects.create_user(
            email="detail.auth@example.com",
            username="detailauth",
            name="Detail Auth",
            password="Password@123",
        )
        access_token = str(RefreshToken.for_user(user).access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

        response = self.client.get(f"{self.users_url}{user.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["status"])
        self.assertEqual(response.data["data"]["email"], "detail.auth@example.com")
        self.assertNotIn("password", response.data["data"])
