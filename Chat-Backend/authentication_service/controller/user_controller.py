from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import NotFound
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from authentication_service.serializers import UserSearchResponseSerializer
from authentication_service.services import UserService


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
