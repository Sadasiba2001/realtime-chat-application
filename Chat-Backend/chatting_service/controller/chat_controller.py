from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from chatting_service.services import MessageService
from authentication_service.throttles import HistoryRateThrottle


class ConversationPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 50

    def get_paginated_response(self, data):
        return Response(
            {
                "status": True,
                "message": "Conversations retrieved successfully.",
                "data": {
                    "count": self.page.paginator.count,
                    "results": data,
                },
            },
            status=status.HTTP_200_OK,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
@throttle_classes([HistoryRateThrottle])
def get_conversations(request):
    message_service = MessageService()
    conversations = message_service.get_user_conversations(user_id=request.user.id)

    if "page" in request.query_params or "page_size" in request.query_params:
        paginator = ConversationPagination()
        page = paginator.paginate_queryset(conversations, request)
        return paginator.get_paginated_response(page)

    flat_conversations = conversations[:50]
    return Response(
        {
            "status": True,
            "message": "Conversations retrieved successfully.",
            "data": flat_conversations,
        },
        status=status.HTTP_200_OK,
    )
