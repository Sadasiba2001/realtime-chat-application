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
            "last_seen",
            "created_at",
        ]
        read_only_fields = fields

    def get_avatar(self, obj):
        return obj.profile_image or ""

    def get_profile_image_url(self, obj):
        return obj.profile_image or None


class UserSearchResponseSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()
    profile_image_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "name",
            "username",
            "profile_image",
            "profile_image_url",
            "avatar",
        ]
        read_only_fields = fields

    def get_avatar(self, obj):
        return obj.profile_image or ""

    def get_profile_image_url(self, obj):
        return obj.profile_image or None

