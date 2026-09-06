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


@override_settings(PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"])
class UserSearchAPITests(APITestCase):
    def setUp(self):
        self.search_url = "/api/v1/auth/users/search/"

        # Authenticated user
        self.current_user = User.objects.create_user(
            email="current.user@example.com",
            username="currentuser",
            name="Current User",
            phone_number="+919999999999",
            password="Password@123",
        )
        self.access_token = str(RefreshToken.for_user(self.current_user).access_token)

        # Other test users
        self.user_rahul_sharma = User.objects.create_user(
            email="rahul.sharma@example.com",
            username="rahulsharma",
            name="Rahul Sharma",
            phone_number="+919876543210",
            password="Password@123",
        )
        self.user_rahul_reddy = User.objects.create_user(
            email="rahul.reddy@example.com",
            username="rahulreddy",
            name="Rahul Reddy",
            phone_number="+919845612370",
            password="Password@123",
        )
        self.user_ananya = User.objects.create_user(
            email="ananya.iyer@example.com",
            username="ananyaiyer",
            name="Ananya Iyer",
            phone_number="+919812345678",
            password="Password@123",
        )
        self.inactive_user = User.objects.create_user(
            email="inactive.rahul@example.com",
            username="inactiverahul",
            name="Inactive Rahul",
            phone_number="+919876000000",
            password="Password@123",
            is_active=False,
        )

    # 1. Authentication Tests
    def test_search_unauthenticated_fails(self):
        response = self.client.get(f"{self.search_url}?q=rahul")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_search_invalid_jwt_fails(self):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer invalid.token.here")
        response = self.client.get(f"{self.search_url}?q=rahul")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_search_valid_jwt_success(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        response = self.client.get(f"{self.search_url}?q=rahul")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["status"])
        self.assertEqual(response.data["message"], "Users retrieved successfully.")

    # 2. Query Validation Tests
    def test_search_missing_query_param_fails(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        response = self.client.get(self.search_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data,
            {
                "status": False,
                "message": "Search query is required.",
            },
        )

    def test_search_empty_query_param_fails(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        response = self.client.get(f"{self.search_url}?q=")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data,
            {
                "status": False,
                "message": "Search query is required.",
            },
        )

    def test_search_whitespace_query_param_fails(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        response = self.client.get(f"{self.search_url}?q=   ")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data,
            {
                "status": False,
                "message": "Search query is required.",
            },
        )

    # 3. Search Matching Tests
    def test_search_by_username_partial(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        response = self.client.get(f"{self.search_url}?q=rahul")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["data"]["results"]
        self.assertEqual(response.data["data"]["count"], 2)
        self.assertEqual(len(results), 2)
        # Deterministic ordering: rahulreddy before rahulsharma
        self.assertEqual(results[0]["username"], "rahulreddy")
        self.assertEqual(results[1]["username"], "rahulsharma")

    def test_search_by_email_partial(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        response = self.client.get(f"{self.search_url}?q=ananya.iyer")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["data"]["results"]
        self.assertEqual(response.data["data"]["count"], 1)
        self.assertEqual(results[0]["username"], "ananyaiyer")
        self.assertEqual(results[0]["name"], "Ananya Iyer")

    def test_search_by_phone_number_partial(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        response = self.client.get(f"{self.search_url}?q=987654")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["data"]["results"]
        self.assertEqual(response.data["data"]["count"], 1)
        self.assertEqual(results[0]["username"], "rahulsharma")

    def test_search_case_insensitivity(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        response = self.client.get(f"{self.search_url}?q=RAHUL")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["data"]["results"]
        self.assertEqual(response.data["data"]["count"], 2)
        usernames = [u["username"] for u in results]
        self.assertIn("rahulreddy", usernames)
        self.assertIn("rahulsharma", usernames)

    # 4. Exclusion Tests
    def test_search_excludes_current_authenticated_user(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        # Search for currentuser
        response = self.client.get(f"{self.search_url}?q=currentuser")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["count"], 0)
        self.assertEqual(response.data["data"]["results"], [])

    def test_search_excludes_inactive_users(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        response = self.client.get(f"{self.search_url}?q=inactive")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["count"], 0)
        self.assertEqual(response.data["data"]["results"], [])

    # 5. Empty Results
    def test_search_no_matches_returns_empty_list(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        response = self.client.get(f"{self.search_url}?q=nonexistent_query_xyz")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["status"])
        self.assertEqual(response.data["message"], "Users retrieved successfully.")
        self.assertEqual(response.data["data"]["count"], 0)
        self.assertEqual(response.data["data"]["results"], [])

    # 6. Response Fields Security
    def test_search_response_exposes_only_safe_fields(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        response = self.client.get(f"{self.search_url}?q=rahulsharma")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        result = response.data["data"]["results"][0]

        # Allowed fields
        self.assertEqual(
            set(result.keys()),
            {"id", "name", "username", "profile_image", "profile_image_url", "avatar"},
        )
        self.assertEqual(result["name"], "Rahul Sharma")
        self.assertEqual(result["username"], "rahulsharma")


        # Forbidden fields
        forbidden_fields = [
            "password",
            "password_hash",
            "email",
            "phone_number",
            "is_superuser",
            "is_staff",
            "role",
            "is_active",
        ]
        for field in forbidden_fields:
            self.assertNotIn(field, result)

    # 7. Pagination Tests
    def test_search_pagination(self):
        # Create 15 matching users
        for i in range(15):
            User.objects.create_user(
                email=f"searchtest{i:02d}@example.com",
                username=f"searchtest{i:02d}",
                name=f"Search Test {i:02d}",
                password="Password@123",
            )

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")

        # Page 1, page_size 10
        res_page1 = self.client.get(f"{self.search_url}?q=searchtest&page=1&page_size=10")
        self.assertEqual(res_page1.status_code, status.HTTP_200_OK)
        self.assertEqual(res_page1.data["data"]["count"], 15)
        self.assertEqual(len(res_page1.data["data"]["results"]), 10)
        self.assertEqual(res_page1.data["data"]["results"][0]["username"], "searchtest00")

        # Page 2, page_size 10
        res_page2 = self.client.get(f"{self.search_url}?q=searchtest&page=2&page_size=10")
        self.assertEqual(res_page2.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_page2.data["data"]["results"]), 5)
        self.assertEqual(res_page2.data["data"]["results"][0]["username"], "searchtest10")

        # Max page_size cap at 50
        res_max = self.client.get(f"{self.search_url}?q=searchtest&page_size=100")
        self.assertEqual(res_max.status_code, status.HTTP_200_OK)
        # Should return all 15 as max page_size is 50
        self.assertEqual(len(res_max.data["data"]["results"]), 15)

    # 8. Profile Image Upload and Management Tests
    def test_manage_profile_image_unauthenticated(self):
        url = "/api/v1/auth/users/profile-image/"
        res_post = self.client.post(url, {})
        self.assertEqual(res_post.status_code, status.HTTP_401_UNAUTHORIZED)

        res_delete = self.client.delete(url)
        self.assertEqual(res_delete.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_upload_profile_image_missing_file(self):
        url = "/api/v1/auth/users/profile-image/"
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        res = self.client.post(url, {})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(res.data["status"])
        self.assertEqual(res.data["message"], "Image file is required.")

    def test_upload_profile_image_invalid_format(self):
        url = "/api/v1/auth/users/profile-image/"
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        from django.core.files.uploadedfile import SimpleUploadedFile

        fake_file = SimpleUploadedFile("test.txt", b"not an image", content_type="text/plain")
        res = self.client.post(url, {"image": fake_file}, format="multipart")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(res.data["status"])
        self.assertIn("not a valid or supported image", res.data["message"].lower())

    def test_upload_profile_image_success_and_replacement(self):
        import io
        from PIL import Image
        from unittest.mock import patch
        from django.core.files.uploadedfile import SimpleUploadedFile

        url = "/api/v1/auth/users/profile-image/"
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")

        # Create valid 100x100 PNG
        img_bytes = io.BytesIO()
        Image.new("RGB", (100, 100), color="blue").save(img_bytes, format="PNG")
        img_bytes.seek(0)
        valid_file = SimpleUploadedFile("avatar.png", img_bytes.getvalue(), content_type="image/png")

        mock_secure_url = f"https://res.cloudinary.com/demo/image/upload/v12345/sb-chat/profiles/user_{self.current_user.id}.png"
        mock_public_id = f"sb-chat/profiles/user_{self.current_user.id}"

        with patch("cloudinary.uploader.upload") as mock_upload:
            mock_upload.return_value = {
                "secure_url": mock_secure_url,
                "public_id": mock_public_id,
            }

            res = self.client.post(url, {"image": valid_file}, format="multipart")
            self.assertEqual(res.status_code, status.HTTP_200_OK)
            self.assertTrue(res.data["status"])
            self.assertEqual(res.data["data"]["profile_image_url"], mock_secure_url)
            self.assertEqual(res.data["data"]["profile_image_public_id"], mock_public_id)

            self.current_user.refresh_from_db()
            self.assertEqual(self.current_user.profile_image, mock_secure_url)
            self.assertEqual(self.current_user.profile_image_public_id, mock_public_id)

            # Test replacement with second upload
            img_bytes2 = io.BytesIO()
            Image.new("RGB", (150, 150), color="green").save(img_bytes2, format="PNG")
            img_bytes2.seek(0)
            valid_file2 = SimpleUploadedFile("avatar2.png", img_bytes2.getvalue(), content_type="image/png")

            res2 = self.client.post(url, {"image": valid_file2}, format="multipart")
            self.assertEqual(res2.status_code, status.HTTP_200_OK)
            self.current_user.refresh_from_db()
            # Verified: public ID stays sb-chat/profiles/user_{id} (1 user = 1 active asset)
            self.assertEqual(self.current_user.profile_image_public_id, mock_public_id)

    def test_remove_profile_image(self):
        from unittest.mock import patch
        url = "/api/v1/auth/users/profile-image/"
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")

        self.current_user.profile_image = "https://res.cloudinary.com/test.png"
        self.current_user.profile_image_public_id = f"sb-chat/profiles/user_{self.current_user.id}"
        self.current_user.save()

        with patch("cloudinary.uploader.destroy") as mock_destroy:
            mock_destroy.return_value = {"result": "ok"}

            res = self.client.delete(url)
            self.assertEqual(res.status_code, status.HTTP_200_OK)
            self.assertTrue(res.data["status"])
            self.assertIsNone(res.data["data"]["profile_image_url"])

            self.current_user.refresh_from_db()
            self.assertIsNone(self.current_user.profile_image)
            self.assertIsNone(self.current_user.profile_image_public_id)
            mock_destroy.assert_called_once_with(f"sb-chat/profiles/user_{self.current_user.id}", invalidate=True)


from datetime import timedelta
import hashlib
import re
from django.utils import timezone
from django.core import mail
from authentication_service.models import AuthToken, TokenType


@override_settings(PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"])
class EmailVerificationAndPasswordResetTests(APITestCase):
    def setUp(self):
        mail.outbox.clear()
        self.register_url = "/api/v1/auth/register/"
        self.login_url = "/api/v1/auth/login/"
        self.verify_email_url = "/api/v1/auth/verify-email/"
        self.resend_verification_url = "/api/v1/auth/resend-verification/"
        self.forgot_password_url = "/api/v1/auth/password/forgot/"
        self.verify_reset_token_url = "/api/v1/auth/password/verify-token/"
        self.reset_password_url = "/api/v1/auth/password/reset/"

    def test_registration_creates_unverified_account_and_sends_email(self):
        """User registration creates account with is_email_verified=False and sends verification email."""
        payload = {
            "name": "Dev User",
            "username": "devuser",
            "email": "dev.user@example.com",
            "password": "DevUser@12345",
        }
        res = self.client.post(self.register_url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        user = User.objects.get(email="dev.user@example.com")
        self.assertFalse(user.is_email_verified)

        # Check mail outbox
        self.assertEqual(len(mail.outbox), 1)
        sent_mail = mail.outbox[0]
        self.assertEqual(sent_mail.to, ["dev.user@example.com"])
        self.assertEqual(sent_mail.subject, "Verify your SB Chat email address")
        self.assertIn("verify-email/", sent_mail.body)

        # Extract raw token from email link
        match = re.search(r"verify-email/([A-Za-z0-9_\-]+)", sent_mail.body)
        self.assertIsNotNone(match)
        raw_token = match.group(1)

        # Ensure raw token is NOT in database
        self.assertFalse(AuthToken.objects.filter(token_hash=raw_token).exists())

        # Ensure SHA-256 hash is in database
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        token_obj = AuthToken.objects.get(token_hash=token_hash)
        self.assertEqual(token_obj.user, user)
        self.assertEqual(token_obj.token_type, TokenType.EMAIL_VERIFICATION)
        self.assertTrue(token_obj.is_valid)

    def test_email_verification_success_and_invalidation(self):
        """Valid token successfully verifies account and marks token as used."""
        user = User.objects.create_user(
            email="verify.me@example.com",
            username="verifyme",
            name="Verify Me",
            password="Verify@12345",
        )
        self.assertFalse(user.is_email_verified)

        token_obj, raw_token = AuthToken.generate_token(user, TokenType.EMAIL_VERIFICATION, expiry_minutes=10)

        # Submit verification token
        res = self.client.post(self.verify_email_url, {"token": raw_token}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data["status"])
        self.assertEqual(res.data["message"], "Email verified successfully.")

        user.refresh_from_db()
        self.assertTrue(user.is_email_verified)

        token_obj.refresh_from_db()
        self.assertIsNotNone(token_obj.used_at)
        self.assertFalse(token_obj.is_valid)

        # Reusing token must fail
        reuse_res = self.client.post(self.verify_email_url, {"token": raw_token}, format="json")
        self.assertEqual(reuse_res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(reuse_res.data["status"])

    def test_email_verification_expired_and_invalid_token(self):
        """Expired or nonexistent tokens are rejected."""
        user = User.objects.create_user(
            email="expired.token@example.com",
            username="expiredtoken",
            name="Expired Token User",
            password="Expired@12345",
        )
        token_obj, raw_token = AuthToken.generate_token(user, TokenType.EMAIL_VERIFICATION, expiry_minutes=10)

        # Artificially expire token
        token_obj.expires_at = timezone.now() - timedelta(minutes=1)
        token_obj.save()

        res = self.client.post(self.verify_email_url, {"token": raw_token}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        # Test completely bogus token
        bogus_res = self.client.post(self.verify_email_url, {"token": "completely-invalid-token"}, format="json")
        self.assertEqual(bogus_res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_resend_verification_email(self):
        """Resend verification issues a new link and invalidates older unused tokens."""
        user = User.objects.create_user(
            email="resend.user@example.com",
            username="resenduser",
            name="Resend User",
            password="Resend@12345",
        )
        token_obj1, raw_token1 = AuthToken.generate_token(user, TokenType.EMAIL_VERIFICATION, expiry_minutes=10)

        mail.outbox.clear()
        res = self.client.post(self.resend_verification_url, {"email": "resend.user@example.com"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data["status"])
        self.assertEqual(len(mail.outbox), 1)

        # Old token is now invalidated
        token_obj1.refresh_from_db()
        self.assertIsNotNone(token_obj1.used_at)
        self.assertFalse(token_obj1.is_valid)

        # Nonexistent email returns identical generic message
        mail.outbox.clear()
        res_nonexistent = self.client.post(self.resend_verification_url, {"email": "nobody@example.com"}, format="json")
        self.assertEqual(res_nonexistent.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 0)

    def test_forgot_password_and_reset_flow(self):
        """Complete password reset flow from request to token validation and reset."""
        user = User.objects.create_user(
            email="forgot.pass@example.com",
            username="forgotpass",
            name="Forgot Pass",
            password="OldPassword@12345",
        )

        # 1. Request forgot password
        res = self.client.post(self.forgot_password_url, {"email": "forgot.pass@example.com"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data["status"])
        self.assertEqual(
            res.data["message"],
            "If an account exists for this email, a password reset link has been sent."
        )

        self.assertEqual(len(mail.outbox), 1)
        sent_mail = mail.outbox[0]
        self.assertEqual(sent_mail.to, ["forgot.pass@example.com"])
        self.assertEqual(sent_mail.subject, "Reset your SB Chat password")
        self.assertIn("reset-password/", sent_mail.body)

        # Extract raw token
        match = re.search(r"reset-password/([A-Za-z0-9_\-]+)", sent_mail.body)
        self.assertIsNotNone(match)
        raw_token = match.group(1)

        # 2. Verify token is active
        verify_res = self.client.post(self.verify_reset_token_url, {"token": raw_token}, format="json")
        self.assertEqual(verify_res.status_code, status.HTTP_200_OK)
        self.assertTrue(verify_res.data["status"])

        # 3. Submit new password
        reset_res = self.client.post(
            self.reset_password_url,
            {
                "token": raw_token,
                "new_password": "NewPassword@99999",
                "confirm_password": "NewPassword@99999",
            },
            format="json"
        )
        self.assertEqual(reset_res.status_code, status.HTTP_200_OK)
        self.assertTrue(reset_res.data["status"])
        self.assertEqual(reset_res.data["message"], "Password has been reset successfully.")

        # 4. Verify old password no longer works
        old_login = self.client.post(self.login_url, {"email": "forgot.pass@example.com", "password": "OldPassword@12345"}, format="json")
        self.assertEqual(old_login.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(old_login.data["status"])

        # 5. Verify new password works
        new_login = self.client.post(self.login_url, {"email": "forgot.pass@example.com", "password": "NewPassword@99999"}, format="json")
        self.assertEqual(new_login.status_code, status.HTTP_200_OK)
        self.assertTrue(new_login.data["status"])

        # 6. Verify token cannot be reused
        reuse_reset = self.client.post(
            self.reset_password_url,
            {"token": raw_token, "new_password": "AnotherPassword@111"},
            format="json"
        )
        self.assertEqual(reuse_reset.status_code, status.HTTP_400_BAD_REQUEST)

    def test_forgot_password_enumeration_protection(self):
        """Nonexistent email returns identical generic response without leaking existence."""
        res = self.client.post(self.forgot_password_url, {"email": "nonexistent.user@example.com"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data["status"])
        self.assertEqual(
            res.data["message"],
            "If an account exists for this email, a password reset link has been sent."
        )
        self.assertEqual(len(mail.outbox), 0)




