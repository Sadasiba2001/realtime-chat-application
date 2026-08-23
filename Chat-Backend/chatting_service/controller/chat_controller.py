from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from chatting_service.services import MessageService


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_conversations(request):
    message_service = MessageService()
    conversations = message_service.get_user_conversations(user_id=request.user.id)

    return Response(
        {
            "status": True,
            "message": "Conversations retrieved successfully.",
            "data": conversations,
        },
        status=status.HTTP_200_OK,
    )
