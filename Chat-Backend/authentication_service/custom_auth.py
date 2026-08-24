from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed

class SafeJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        auth_result = super().authenticate(request)
        if auth_result is None:
            return None

        user, validated_token = auth_result

        # Check password invalidation claim
        token_pwd_hash = validated_token.get("pwd_hash")
        if token_pwd_hash:
            current_hash_suffix = user.password[-12:] if user.password else ""
            if token_pwd_hash != current_hash_suffix:
                raise AuthenticationFailed("Password has changed. Please log in again.", code="password_changed")

        return user, validated_token
