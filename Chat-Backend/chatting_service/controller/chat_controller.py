from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from django.contrib.auth import get_user_model
from chatting_service.services import MessageService
from chatting_service.models import Message
from authentication_service.throttles import HistoryRateThrottle, SearchRateThrottle

User = get_user_model()


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


@api_view(["DELETE", "POST"])
@permission_classes([IsAuthenticated])
def delete_message_view(request, message_id):
    delete_type = request.data.get("delete_type") or request.query_params.get("delete_type") or "everyone"
    message_service = MessageService()

    try:
        if delete_type == "me":
            res = message_service.delete_message_for_me(message_id=message_id, user_id=request.user.id)
            event_data = {
                "type": "message_deleted",
                "message_id": message_id,
                "delete_type": "me",
                "sender_id": request.user.id,
            }
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            channel_layer = get_channel_layer()
            if channel_layer:
                try:
                    async_to_sync(channel_layer.group_send)(
                        f"user_{request.user.id}",
                        {
                            "type": "message.delete.event",
                            "data": event_data,
                        },
                    )
                except Exception:
                    pass
            return Response(
                {"status": True, "message": "Message deleted for me successfully.", "data": res},
                status=status.HTTP_200_OK,
            )
        else:
            res = message_service.delete_message_for_everyone(message_id=message_id, user_id=request.user.id)
            partner_id = res.get("partner_id")
            event_data = {
                "type": "message_deleted",
                "message_id": message_id,
                "delete_type": "everyone",
                "sender_id": request.user.id,
            }
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            channel_layer = get_channel_layer()
            if channel_layer:
                try:
                    async_to_sync(channel_layer.group_send)(
                        f"user_{request.user.id}",
                        {
                            "type": "message.delete.event",
                            "data": event_data,
                        },
                    )
                    if partner_id and partner_id != request.user.id:
                        async_to_sync(channel_layer.group_send)(
                            f"user_{partner_id}",
                            {
                                "type": "message.delete.event",
                                "data": event_data,
                            },
                        )
                except Exception:
                    pass
            return Response(
                {"status": True, "message": "Message deleted for everyone successfully.", "data": res},
                status=status.HTTP_200_OK,
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


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_reaction_view(request, message_id):
    emoji = request.data.get("emoji")
    if not emoji:
        return Response(
            {"status": False, "message": "Emoji reaction is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    message_service = MessageService()
    try:
        res = message_service.toggle_reaction(message_id=message_id, user_id=request.user.id, emoji=str(emoji))
        partner_id = res.get("partner_id")
        event_data = {
            "type": "message_reaction_updated",
            "data": res,
        }
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        channel_layer = get_channel_layer()
        if channel_layer:
            try:
                async_to_sync(channel_layer.group_send)(
                    f"user_{request.user.id}",
                    {
                        "type": "message.reaction.event",
                        "data": event_data,
                    },
                )
                if partner_id and partner_id != request.user.id:
                    async_to_sync(channel_layer.group_send)(
                        f"user_{partner_id}",
                        {
                            "type": "message.reaction.event",
                            "data": event_data,
                        },
                    )
            except Exception:
                pass

        return Response(
            {"status": True, "message": "Reaction updated successfully.", "data": res},
            status=status.HTTP_200_OK,
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


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def forward_message_view(request, message_id):
    target_user_ids = request.data.get("target_user_ids") or request.data.get("target_user_id") or request.data.get("receiver_id")
    if target_user_ids is None:
        return Response(
            {"status": False, "message": "target_user_ids parameter is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    targets = []
    if isinstance(target_user_ids, list):
        for tid in target_user_ids:
            try:
                targets.append(int(tid))
            except (TypeError, ValueError):
                pass
    else:
        try:
            targets.append(int(target_user_ids))
        except (TypeError, ValueError):
            pass

    if not targets:
        return Response(
            {"status": False, "message": "Valid target user ID(s) required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    service = MessageService()
    try:
        messages = service.forward_message(user=request.user, message_id=message_id, target_user_ids=targets)

        channel_layer = get_channel_layer()
        if channel_layer:
            for msg_data in messages:
                receiver_id = msg_data.get("receiver_id")
                try:
                    async_to_sync(channel_layer.group_send)(
                        f"user_{request.user.id}",
                        {
                            "type": "chat.message.event",
                            "data": msg_data,
                        },
                    )
                    if receiver_id and receiver_id != request.user.id:
                        async_to_sync(channel_layer.group_send)(
                            f"user_{receiver_id}",
                            {
                                "type": "chat.message.event",
                                "data": msg_data,
                            },
                        )
                except Exception:
                    pass

        return Response(
            {"status": True, "message": "Message forwarded successfully.", "data": messages},
            status=status.HTTP_200_OK,
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


@api_view(["GET"])
@permission_classes([IsAuthenticated])
@throttle_classes([SearchRateThrottle])
def search_messages_view(request):
    query = request.query_params.get("q", "").strip()
    if not query:
        return Response(
            {"status": False, "message": "Search query is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        page = int(request.query_params.get("page", 1))
        page_size = int(request.query_params.get("page_size", 20))
    except (ValueError, TypeError):
        page = 1
        page_size = 20

    message_service = MessageService()
    result = message_service.search_messages(user=request.user, query=query, page=page, page_size=page_size)
    return Response({"status": True, "message": "Search successful.", "data": result}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def pin_chat_view(request, target_user_id):
    try:
        service = MessageService()
        is_pinned = service.toggle_pin_chat(user=request.user, target_user_id=target_user_id)
        msg = "Chat pinned successfully." if is_pinned else "Chat unpinned successfully."
        return Response({"status": True, "message": msg, "data": {"is_pinned": is_pinned}}, status=status.HTTP_200_OK)
    except ValueError as exc:
        return Response({"status": False, "message": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def unpin_chat_view(request, target_user_id):
    try:
        service = MessageService()
        service.unpin_chat(user=request.user, target_user_id=target_user_id)
        return Response({"status": True, "message": "Chat unpinned successfully.", "data": {"is_pinned": False}}, status=status.HTTP_200_OK)
    except ValueError as exc:
        return Response({"status": False, "message": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def archive_chat_view(request, target_user_id):
    try:
        service = MessageService()
        is_archived = service.toggle_archive_chat(user=request.user, target_user_id=target_user_id)
        msg = "Chat archived successfully." if is_archived else "Chat unarchived successfully."
        return Response({"status": True, "message": msg, "data": {"is_archived": is_archived}}, status=status.HTTP_200_OK)
    except ValueError as exc:
        return Response({"status": False, "message": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def unarchive_chat_view(request, target_user_id):
    try:
        service = MessageService()
        service.unarchive_chat(user=request.user, target_user_id=target_user_id)
        return Response({"status": True, "message": "Chat unarchived successfully.", "data": {"is_archived": False}}, status=status.HTTP_200_OK)
    except ValueError as exc:
        return Response({"status": False, "message": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mute_chat_view(request, target_user_id):
    try:
        duration = request.data.get("duration", "always")
        service = MessageService()
        service.mute_chat(user=request.user, target_user_id=target_user_id, duration=duration)
        return Response({"status": True, "message": "Chat muted successfully.", "data": {"is_muted": True, "duration": duration}}, status=status.HTTP_200_OK)
    except ValueError as exc:
        return Response({"status": False, "message": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def unmute_chat_view(request, target_user_id):
    try:
        service = MessageService()
        service.unmute_chat(user=request.user, target_user_id=target_user_id)
        return Response({"status": True, "message": "Chat unmuted successfully.", "data": {"is_muted": False}}, status=status.HTTP_200_OK)
    except ValueError as exc:
        return Response({"status": False, "message": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def block_user_view(request, target_user_id):
    try:
        service = MessageService()
        service.block_user(blocker=request.user, target_user_id=target_user_id)
        return Response({"status": True, "message": "User blocked successfully.", "data": {"is_blocked": True}}, status=status.HTTP_200_OK)
    except ValueError as exc:
        return Response({"status": False, "message": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def unblock_user_view(request, target_user_id):
    try:
        service = MessageService()
        service.unblock_user(blocker=request.user, target_user_id=target_user_id)
        return Response({"status": True, "message": "User unblocked successfully.", "data": {"is_blocked": False}}, status=status.HTTP_200_OK)
    except ValueError as exc:
        return Response({"status": False, "message": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def report_user_view(request, target_user_id):
    try:
        reason = request.data.get("reason", "")
        description = request.data.get("description", "")
        service = MessageService()
        report_data = service.report_user(
            reporter=request.user,
            target_user_id=target_user_id,
            reason=reason,
            description=description,
        )
        return Response(
            {"status": True, "message": "User reported successfully.", "data": report_data},
            status=status.HTTP_201_CREATED,
        )
    except User.DoesNotExist as exc:
        return Response({"status": False, "message": str(exc)}, status=status.HTTP_404_NOT_FOUND)
    except ValueError as exc:
        return Response({"status": False, "message": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def report_message_view(request, message_id):
    try:
        reason = request.data.get("reason", "")
        description = request.data.get("description", "")
        service = MessageService()
        report_data = service.report_message(
            reporter=request.user,
            message_id=message_id,
            reason=reason,
            description=description,
        )
        return Response(
            {"status": True, "message": "Message reported successfully.", "data": report_data},
            status=status.HTTP_201_CREATED,
        )
    except Message.DoesNotExist as exc:
        return Response({"status": False, "message": str(exc)}, status=status.HTTP_404_NOT_FOUND)
    except PermissionError as exc:
        return Response({"status": False, "message": str(exc)}, status=status.HTTP_403_FORBIDDEN)
    except ValueError as exc:
        return Response({"status": False, "message": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
