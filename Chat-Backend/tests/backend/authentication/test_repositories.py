from django.test import TestCase
from django.contrib.auth import get_user_model
from authentication_service.repository import UserRepository

User = get_user_model()


class UserRepositoryTests(TestCase):
    def setUp(self):
        self.repo = UserRepository()
        self.user = User.objects.create_user(
            email="repo_user@example.com",
            username="repouser",
            password="Password123!",
            name="Repo User"
        )

    def test_get_by_id_exists(self):
        fetched = self.repo.get_by_id(self.user.id)
        self.assertIsNotNone(fetched)
        self.assertEqual(fetched.id, self.user.id)

    def test_get_by_id_not_found(self):
        fetched = self.repo.get_by_id(999999)
        self.assertIsNone(fetched)

    def test_get_by_email_exists(self):
        fetched = self.repo.get_by_email("repo_user@example.com")
        self.assertIsNotNone(fetched)
        self.assertEqual(fetched.email, "repo_user@example.com")

    def test_get_by_username_exists(self):
        fetched = self.repo.get_by_username("repouser")
        self.assertIsNotNone(fetched)
        self.assertEqual(fetched.username, "repouser")
