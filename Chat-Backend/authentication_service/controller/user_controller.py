from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.exceptions import NotFound
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from authentication_service.serializers import UserSearchResponseSerializer
from authentication_service.services import UserService
from authentication_service.throttles import SearchRateThrottle


class UserSearchPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 50

    def get_paginated_response(self, data):
        return Response(
            {
                "status": True,
                "message": "Users retrieved successfully.",
                "data": {
                    "count": self.page.paginator.count,
                    "results": data,
                },
            },
            status=status.HTTP_200_OK,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
@throttle_classes([SearchRateThrottle])
def search_users(request):
    query = request.query_params.get("q")
    if not query or not query.strip():
        return Response(
            {
                "status": False,
                "message": "Search query is required.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    user_service = UserService()
    users = user_service.search_users(
        query=query,
        current_user_id=request.user.id,
    )

    paginator = UserSearchPagination()
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

    serializer = UserSearchResponseSerializer(page, many=True)
    return paginator.get_paginated_response(serializer.data)


@api_view(["POST", "DELETE"])
@permission_classes([IsAuthenticated])
def manage_profile_image(request):
    user_service = UserService()

    if request.method == "POST":
        image_file = (
            request.FILES.get("image")
            or request.FILES.get("profile_image")
            or request.FILES.get("avatar")
            or request.FILES.get("file")
        )
        if not image_file:
            return Response(
                {
                    "status": False,
                    "message": "Image file is required.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            result = user_service.upload_profile_image(user=request.user, file=image_file)
            return Response(
                {
                    "status": True,
                    "message": "Profile picture updated successfully.",
                    "data": result,
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
        except Exception as exc:
            return Response(
                {
                    "status": False,
                    "message": "Failed to upload profile picture. Please try again.",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    elif request.method == "DELETE":
        try:
            result = user_service.remove_profile_image(user=request.user)
            return Response(
                {
                    "status": True,
                    "message": "Profile picture removed successfully.",
                    "data": result,
                },
                status=status.HTTP_200_OK,
            )
        except Exception:
            return Response(
                {
                    "status": False,
                    "message": "Failed to remove profile picture.",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

