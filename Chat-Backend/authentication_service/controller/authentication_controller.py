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
)
from authentication_service.services import AuthenticationService
from authentication_service.throttles import LoginRateThrottle, RegisterRateThrottle, RefreshRateThrottle, SearchRateThrottle


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
    print("\n>>> LOGIN ENDPOINT HIT IN BACKEND <<<", flush=True)
    print(f">>> Request Data: {request.data}", flush=True)

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

    print("======== LOGIN BACKEND CONSOLE ========", flush=True)
    print(f"User Email: {serializer.validated_data.get('email')}", flush=True)
    print(f"Generated Access Token: {access_token}", flush=True)
    print(f"Generated Refresh Token: {refresh_token}", flush=True)
    print(f"Response Data Keys: {list(response_data.keys())}", flush=True)
    print("=======================================\n", flush=True)

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
