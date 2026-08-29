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


@api_view(["PATCH", "PUT"])
@permission_classes([IsAuthenticated])
def edit_message_view(request, message_id):
    content = request.data.get("content")
    if not isinstance(content, str) or not content.strip():
        return Response(
            {"status": False, "message": "Message content cannot be empty."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    message_service = MessageService()
    try:
        message_data = message_service.edit_message(
            message_id=message_id,
            user_id=request.user.id,
            content=content,
        )
    except PermissionError as exc:
        return Response(
            {"status": False, "message": str(exc)},
            status=status.HTTP_403_FORBIDDEN,
        )
    except ValueError as exc:
        err_msg = str(exc)
        if "not found" in err_msg.lower():
            return Response(
                {"status": False, "message": err_msg},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(
            {"status": False, "message": err_msg},
            status=status.HTTP_400_BAD_REQUEST,
        )

    from channels.layers import get_channel_layer
    from asgiref.sync import async_to_sync

    channel_layer = get_channel_layer()
    if channel_layer:
        event_data = {
            "type": "message_edited",
            "data": message_data,
        }
        try:
            async_to_sync(channel_layer.group_send)(
                f"user_{request.user.id}",
                {
                    "type": "message.edited.event",
                    "data": event_data,
                },
            )
            receiver_id = message_data.get("receiver_id")
            if receiver_id and receiver_id != request.user.id:
                async_to_sync(channel_layer.group_send)(
                    f"user_{receiver_id}",
                    {
                        "type": "message.edited.event",
                        "data": event_data,
                    },
                )
        except Exception:
            pass

    return Response(
        {
            "status": True,
            "message": "Message edited successfully.",
            "data": message_data,
        },
        status=status.HTTP_200_OK,
    )
