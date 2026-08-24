from django.http import HttpResponseBadRequest
from django.conf import settings

class RequestSizeLimitMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        max_size = getattr(settings, "MAX_REQUEST_SIZE", 5242880)
        content_length = request.META.get('CONTENT_LENGTH')

        if content_length:
            try:
                if int(content_length) > max_size:
                    return HttpResponseBadRequest("Payload Too Large")
            except (ValueError, TypeError):
                pass

        return self.get_response(request)
