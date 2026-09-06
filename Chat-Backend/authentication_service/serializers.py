from rest_framework import serializers
from authentication_service.models import User


class UserRegisterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255, required=True)
    username = serializers.CharField(max_length=150, required=True)
    email = serializers.EmailField(required=True)
    phone_number = serializers.CharField(max_length=20, required=False, allow_blank=True, default="")
    password = serializers.CharField(write_only=True, required=True, min_length=6)

    def validate_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Name cannot be empty.")
        return value.strip()

    def validate_username(self, value):
        if not value.strip():
            raise serializers.ValidationError("Username cannot be empty.")
        return value.strip()

    def validate_email(self, value):
        if not value.strip():
            raise serializers.ValidationError("Email cannot be empty.")
        return value.strip().lower()


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate_email(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Email cannot be empty.")
        return value.strip().lower()


class UserResponseSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()
    profile_image_url = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "name",
            "username",
            "email",
            "phone_number",
            "role",
            "profile_image",
            "profile_image_url",
            "avatar",
            "is_active",
            "is_email_verified",
            "status",
            "last_seen",
            "created_at",
        ]
        read_only_fields = fields

    def get_avatar(self, obj):
        return obj.profile_image or ""

    def get_profile_image_url(self, obj):
        return obj.profile_image or None

    def get_status(self, obj):
        from chatting_service.services.presence_service import PresenceService
        return "online" if PresenceService().is_user_online(obj.id) else "offline"


class UserSearchResponseSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()
    profile_image_url = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "name",
            "username",
            "profile_image",
            "profile_image_url",
            "avatar",
            "status",
        ]
        read_only_fields = fields

    def get_avatar(self, obj):
        return obj.profile_image or ""

    def get_profile_image_url(self, obj):
        return obj.profile_image or None

    def get_status(self, obj):
        from chatting_service.services.presence_service import PresenceService
        return "online" if PresenceService().is_user_online(obj.id) else "offline"


class VerifyEmailSerializer(serializers.Serializer):
    token = serializers.CharField(required=True, allow_blank=False)

    def validate_token(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Verification token is required.")
        return value.strip()


class ResendVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Email cannot be empty.")
        return value.strip().lower()


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Email cannot be empty.")
        return value.strip().lower()


class VerifyResetTokenSerializer(serializers.Serializer):
    token = serializers.CharField(required=True, allow_blank=False)

    def validate_token(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Reset token is required.")
        return value.strip()


class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.CharField(required=True, allow_blank=False)
    new_password = serializers.CharField(required=True, write_only=True, min_length=6)
    confirm_password = serializers.CharField(required=False, write_only=True, allow_blank=True)

    def validate_token(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Reset token is required.")
        return value.strip()

    def validate(self, data):
        if "confirm_password" in data and data["confirm_password"]:
            if data["new_password"] != data["confirm_password"]:
                raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return data


