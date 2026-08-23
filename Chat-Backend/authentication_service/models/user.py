from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class UserRole(models.TextChoices):
    SUPERADMIN = "SUPERADMIN", "SUPERADMIN"
    NORMAL_USER = "NORMAL_USER", "NORMAL_USER"


class UserManager(BaseUserManager):
    def create_user(self, email, username, name="", password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        if not username:
            raise ValueError("The Username field must be set")

        email = self.normalize_email(email)
        extra_fields.setdefault("role", UserRole.NORMAL_USER)
        extra_fields.setdefault("is_active", True)

        user = self.model(
            email=email,
            username=username,
            name=name,
            **extra_fields
        )

        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()

        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, name="Admin", password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", UserRole.SUPERADMIN)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(
            email=email,
            username=username,
            name=name,
            password=password,
            **extra_fields
        )


class User(AbstractBaseUser, PermissionsMixin):
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=255)
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True, default="")
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.NORMAL_USER
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    last_seen = models.DateTimeField(null=True, blank=True, default=None)
    date_joined = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username", "name"]

    class Meta:
        db_table = "users"
        verbose_name = "User"
        verbose_name_plural = "Users"

    def __str__(self):
        return f"{self.email} ({self.role})"
