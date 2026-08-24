from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is None:
        logger.error("Unhandled server exception: %s", exc, exc_info=True)
        if not settings.DEBUG:
            return Response(
                {
                    "status": False,
                    "message": "A server error occurred. Please try again later.",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        else:
            return None

    if not settings.DEBUG and response.status_code == 500:
        response.data = {
            "status": False,
            "message": "A server error occurred. Please try again later.",
        }

    return response
