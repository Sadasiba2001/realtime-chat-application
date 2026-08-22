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
        self.assertEqual(set(result.keys()), {"id", "name", "username"})
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

