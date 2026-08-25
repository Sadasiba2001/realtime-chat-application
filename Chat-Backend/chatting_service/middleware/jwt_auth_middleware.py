from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import AccessToken

User = get_user_model()


def get_token_from_scope(scope):
    """
    Extract JWT access token exclusively from WebSocket subprotocols.
    Query-string token authentication (?token=<JWT>) is strictly disallowed (B-11).
    """
    # 1. Try from scope["subprotocols"]
    subprotocols = scope.get("subprotocols", [])
    if len(subprotocols) >= 2 and subprotocols[0] == "access_token":
        return subprotocols[1]

    # 2. Try from headers (Sec-WebSocket-Protocol: access_token, <token>)
    headers = dict(scope.get("headers", []))
    sec_protocol = headers.get(b"sec-websocket-protocol", b"").decode("utf-8")
    if sec_protocol:
        parts = [p.strip() for p in sec_protocol.split(",")]
        if len(parts) >= 2 and parts[0] == "access_token":
            return parts[1]

    return None


@database_sync_to_async
def get_user_from_token(token_string: str):
    if not token_string:
        return AnonymousUser()
    try:
        access_token = AccessToken(token_string)
        user_id = access_token.get("user_id")
        if not user_id:
            return AnonymousUser()

        user = User.objects.get(id=user_id)
        if not user.is_active:
            return AnonymousUser()

        # Invalidate if password changed (B-14)
        token_pwd_hash = access_token.get("pwd_hash")
        if token_pwd_hash:
            current_suffix = user.password[-12:] if user.password else ""
            if token_pwd_hash != current_suffix:
                return AnonymousUser()

        return user
    except (InvalidToken, TokenError, User.DoesNotExist, Exception):
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    """
    Custom Channels middleware to authenticate WebSocket connections
    using JWT access token passed via query string or Sec-WebSocket-Protocol.
    """

    async def __call__(self, scope, receive, send):
        token = get_token_from_scope(scope)
        if token:
            scope["user"] = await get_user_from_token(token)
        else:
            scope["user"] = AnonymousUser()

        return await super().__call__(scope, receive, send)


def JWTAuthMiddlewareStack(inner):
    return JWTAuthMiddleware(inner)
