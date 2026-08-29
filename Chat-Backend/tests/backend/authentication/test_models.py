from django.test import TestCase
from django.contrib.auth import get_user_model
from django.db.utils import IntegrityError

User = get_user_model()


class AuthenticationModelTests(TestCase):
    def test_create_user_success(self):
        user = User.objects.create_user(
            email="testuser@example.com",
            username="testuser",
            password="SecurePassword123!",
            name="Test User"
        )
        self.assertEqual(user.email, "testuser@example.com")
        self.assertEqual(user.username, "testuser")
        self.assertEqual(user.name, "Test User")
        self.assertTrue(user.check_password("SecurePassword123!"))
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_create_superuser_success(self):
        admin_user = User.objects.create_superuser(
            email="admin@example.com",
            username="adminuser",
            password="AdminPassword123!"
        )
        self.assertTrue(admin_user.is_staff)
        self.assertTrue(admin_user.is_superuser)
        self.assertTrue(admin_user.check_password("AdminPassword123!"))

    def test_duplicate_username_raises_error(self):
        User.objects.create_user(email="user1@example.com", username="duplicate_user", password="Password123!")
        with self.assertRaises(IntegrityError):
            User.objects.create_user(email="user2@example.com", username="duplicate_user", password="Password123!")

    def test_duplicate_email_raises_error(self):
        User.objects.create_user(email="same_email@example.com", username="user_one", password="Password123!")
        with self.assertRaises(IntegrityError):
            User.objects.create_user(email="same_email@example.com", username="user_two", password="Password123!")
