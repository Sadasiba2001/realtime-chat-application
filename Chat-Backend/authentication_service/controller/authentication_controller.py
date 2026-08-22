from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
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

    return Response(
        {
            "status": True,
            "message": "User registered successfully.",
            "data": tokens,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
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
        return Response(
            {
                "status": False,
                "message": str(exc),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response(
        {
            "status": True,
            "message": "Login successful.",
            "data": tokens,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def logout(request):
    refresh_token = request.data.get("refresh")
    if not refresh_token:
        return Response(
            {
                "status": False,
                "message": "Refresh token is required.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    auth_service = AuthenticationService()
    try:
        auth_service.logout_user(refresh_token)
    except (TokenError, InvalidToken, ValueError):
        return Response(
            {
                "status": False,
                "message": "Invalid or expired refresh token.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response(
        {
            "status": True,
            "message": "Logout successful.",
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def token_refresh(request):
    serializer = TokenRefreshSerializer(data=request.data)
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

    return Response(
        {
            "status": True,
            "message": "Token refreshed successfully.",
            "data": serializer.validated_data,
        },
        status=status.HTTP_200_OK,
    )


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
