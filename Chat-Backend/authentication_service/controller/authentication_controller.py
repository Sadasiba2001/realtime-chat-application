from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.exceptions import NotFound
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer, TokenVerifySerializer

from authentication_service.serializers import (
    LoginSerializer,
    UserRegisterSerializer,
    UserResponseSerializer,
    VerifyEmailSerializer,
    ResendVerificationSerializer,
    ForgotPasswordSerializer,
    VerifyResetTokenSerializer,
    ResetPasswordSerializer,
)
from authentication_service.services import AuthenticationService
from authentication_service.throttles import (
    LoginRateThrottle,
    RegisterRateThrottle,
    RefreshRateThrottle,
    SearchRateThrottle,
    PasswordResetRateThrottle,
    VerificationRateThrottle,
)


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100

    def get_page_size(self, request):
        if "limit" in request.query_params:
            try:
                limit = int(request.query_params["limit"])
                if limit > 0:
                    return min(limit, self.max_page_size)
            except (ValueError, TypeError):
                pass
        return super().get_page_size(request)

    def get_paginated_response(self, data):
        return Response(
            {
                "status": True,
                "message": "Users retrieved successfully.",
                "data": {
                    "count": self.page.paginator.count,
                    "next": self.get_next_link(),
                    "previous": self.get_previous_link(),
                    "results": data,
                },
            },
            status=status.HTTP_200_OK,
        )


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([RegisterRateThrottle])
def register(request):
    serializer = UserRegisterSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    validated_data = serializer.validated_data

    auth_service = AuthenticationService()
    try:
        tokens = auth_service.register_user(
            name=validated_data["name"],
            username=validated_data["username"],
            email=validated_data["email"],
            phone_number=validated_data.get("phone_number", ""),
            password=validated_data["password"],
        )
    except ValueError as exc:
        return Response({"status": False, "message": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    access_token = tokens.get("access")
    refresh_token = tokens.get("refresh")
    user = auth_service.user_repository.get_by_email(validated_data["email"].strip().lower())
    user_data = UserResponseSerializer(user).data if user else None

    import sys
    is_testing = "test" in sys.argv

    response_data = {
        "access": access_token,
        "refresh": refresh_token,
        "user": user_data,
    }

    response = Response(
        {
            "status": True,
            "message": "User registered successfully.",
            "access": access_token,
            "refresh": refresh_token,
            "data": response_data,
        },
        status=status.HTTP_201_CREATED,
    )

    if refresh_token:
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=not settings.DEBUG,
            samesite="Lax",
            path="/",
        )

    return response


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([LoginRateThrottle])
def login(request):
    
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        print(f">>> Serializer Invalid: {serializer.errors}", flush=True)
        return Response(
            {
                "status": False,
                "message": "Invalid email or password.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    auth_service = AuthenticationService()
    try:
        tokens = auth_service.login_user(
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )
    except ValueError as exc:
        msg = str(exc)
        print(f">>> Auth Error: {msg}", flush=True)
        if msg == "User account is inactive.":
            return Response(
                {
                    "status": False,
                    "message": "User account is inactive.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            {
                "status": False,
                "message": "Invalid email or password.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    access_token = tokens.get("access")
    refresh_token = tokens.get("refresh")
    user = auth_service.user_repository.get_by_email(serializer.validated_data["email"].strip().lower())
    user_data = UserResponseSerializer(user).data if user else None

    response_data = {
        "access": access_token,
        "refresh": refresh_token,
        "user": user_data,
    }

    response = Response(
        {
            "status": True,
            "message": "Login successful.",
            "access": access_token,
            "refresh": refresh_token,
            "data": response_data,
        },
        status=status.HTTP_200_OK,
    )

    if refresh_token:
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=not settings.DEBUG,
            samesite="Lax",
            path="/",
        )

    return response


@api_view(["POST"])
@permission_classes([AllowAny])
def logout(request):
    refresh_token = request.COOKIES.get("refresh_token") or request.data.get("refresh")
    if not refresh_token:
        response = Response(
            {
                "status": False,
                "message": "Refresh token is required.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
        response.delete_cookie("refresh_token")
        return response

    auth_service = AuthenticationService()
    try:
        auth_service.logout_user(refresh_token)
    except (TokenError, InvalidToken, ValueError):
        response = Response(
            {
                "status": False,
                "message": "Invalid or expired refresh token.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
        response.delete_cookie("refresh_token")
        return response

    response = Response(
        {
            "status": True,
            "message": "Logout successful.",
        },
        status=status.HTTP_200_OK,
    )
    response.delete_cookie("refresh_token")
    return response


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([RefreshRateThrottle])
def token_refresh(request):
    refresh_token = request.COOKIES.get("refresh_token")
    data = request.data.copy() if hasattr(request.data, "copy") else dict(request.data)
    if refresh_token:
        data["refresh"] = refresh_token

    serializer = TokenRefreshSerializer(data=data)
    try:
        if not serializer.is_valid():
            return Response(
                {
                    "status": False,
                    "message": "Invalid or expired refresh token.",
                    "errors": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
    except (TokenError, InvalidToken):
        return Response(
            {
                "status": False,
                "message": "Invalid or expired refresh token.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    res_data = serializer.validated_data
    access_token = res_data.get("access")
    new_refresh = res_data.get("refresh")

    response = Response(
        {
            "status": True,
            "message": "Token refreshed successfully.",
            "data": {
                "access": access_token,
            },
        },
        status=status.HTTP_200_OK,
    )

    if new_refresh:
        response.set_cookie(
            key="refresh_token",
            value=new_refresh,
            httponly=True,
            secure=not settings.DEBUG,
            samesite="Lax",
            path="/",
        )

    return response


@api_view(["POST"])
@permission_classes([AllowAny])
def token_verify(request):
    serializer = TokenVerifySerializer(data=request.data)
    try:
        if not serializer.is_valid():
            return Response(
                {
                    "status": False,
                    "message": "Token is invalid or expired.",
                    "errors": serializer.errors,
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )
    except (TokenError, InvalidToken):
        return Response(
            {
                "status": False,
                "message": "Token is invalid or expired.",
            },
            status=status.HTTP_401_UNAUTHORIZED,
        )

    return Response(
        {
            "status": True,
            "message": "Token is valid.",
        },
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
@throttle_classes([SearchRateThrottle])
def get_users(request):
    auth_service = AuthenticationService()
    users = auth_service.get_users()

    paginator = StandardResultsSetPagination()
    try:
        page = paginator.paginate_queryset(users, request)
    except NotFound:
        return Response(
            {
                "status": False,
                "message": "Invalid page.",
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    serializer = UserResponseSerializer(page, many=True)
    return paginator.get_paginated_response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_user_by_id(request, user_id):
    auth_service = AuthenticationService()
    user = auth_service.get_user_by_id(user_id)

    if not user:
        return Response(
            {
                "status": False,
                "message": "User not found.",
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    serializer = UserResponseSerializer(user)
    return Response(
        {
            "status": True,
            "message": "User retrieved successfully.",
            "data": serializer.data,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST", "GET"])
@permission_classes([AllowAny])
@throttle_classes([VerificationRateThrottle])
def verify_email(request, token=None):
    """
    Verifies user's email address using a single-use 10-minute token.
    Token can be provided as a URL parameter, query parameter, or JSON body.
    """
    token_value = token or request.query_params.get("token") or (request.data.get("token") if hasattr(request, "data") else None)
    serializer = VerifyEmailSerializer(data={"token": token_value})

    if not serializer.is_valid():
        return Response(
            {
                "status": False,
                "message": "Verification token is required.",
                "errors": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    auth_service = AuthenticationService()
    try:
        user = auth_service.verify_email(serializer.validated_data["token"])
        return Response(
            {
                "status": True,
                "message": "Email verified successfully.",
                "data": {
                    "email": user.email,
                    "is_email_verified": user.is_email_verified,
                },
            },
            status=status.HTTP_200_OK,
        )
    except ValueError as exc:
        return Response(
            {
                "status": False,
                "message": str(exc),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([VerificationRateThrottle])
def resend_verification(request):
    """
    Resends verification email with a new 10-minute link.
    Protected against email enumeration.
    """
    serializer = ResendVerificationSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {
                "status": False,
                "message": "Invalid email address.",
                "errors": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    auth_service = AuthenticationService()
    auth_service.resend_verification_email(serializer.validated_data["email"])

    return Response(
        {
            "status": True,
            "message": "If an unverified account exists for this email, a verification link has been sent.",
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([PasswordResetRateThrottle])
def forgot_password(request):
    """
    Initiates password reset flow by sending a 10-minute reset link.
    Protected against email enumeration.
    """
    serializer = ForgotPasswordSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {
                "status": False,
                "message": "Invalid email address.",
                "errors": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    auth_service = AuthenticationService()
    auth_service.request_password_reset(serializer.validated_data["email"])

    return Response(
        {
            "status": True,
            "message": "If an account exists for this email, a password reset link has been sent.",
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST", "GET"])
@permission_classes([AllowAny])
@throttle_classes([PasswordResetRateThrottle])
def verify_reset_token(request, token=None):
    """
    Validates whether a password reset token is active and not expired.
    """
    token_value = token or request.query_params.get("token") or (request.data.get("token") if hasattr(request, "data") else None)
    serializer = VerifyResetTokenSerializer(data={"token": token_value})

    if not serializer.is_valid():
        return Response(
            {
                "status": False,
                "message": "Reset token is required.",
                "errors": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    auth_service = AuthenticationService()
    try:
        auth_service.verify_password_reset_token(serializer.validated_data["token"])
        return Response(
            {
                "status": True,
                "message": "Password reset token is valid.",
            },
            status=status.HTTP_200_OK,
        )
    except ValueError as exc:
        return Response(
            {
                "status": False,
                "message": str(exc),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([PasswordResetRateThrottle])
def reset_password(request):
    """
    Completes password reset with the validated single-use token.
    """
    serializer = ResetPasswordSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {
                "status": False,
                "message": "Invalid password reset submission.",
                "errors": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    auth_service = AuthenticationService()
    try:
        auth_service.reset_password(
            token=serializer.validated_data["token"],
            new_password=serializer.validated_data["new_password"]
        )
        return Response(
            {
                "status": True,
                "message": "Password has been reset successfully.",
            },
            status=status.HTTP_200_OK,
        )
    except ValueError as exc:
        return Response(
            {
                "status": False,
                "message": str(exc),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

