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
    subprotocols = scope.get("subprotocols", [])
    headers = dict(scope.get("headers", []))
    sec_protocol = headers.get(b"sec-websocket-protocol", b"").decode("utf-8")

    print(f"[WS AUTH] subprotocols = {subprotocols}")
    print(f"[WS AUTH] sec-websocket-protocol present = {bool(sec_protocol)}")

    token = None
    # 1. Try from scope["subprotocols"]
    if len(subprotocols) >= 2 and subprotocols[0] == "access_token":
        token = subprotocols[1]
    # 2. Try from headers (Sec-WebSocket-Protocol: access_token, <token>)
    elif sec_protocol:
        parts = [p.strip() for p in sec_protocol.split(",")]
        if len(parts) >= 2 and parts[0] == "access_token":
            token = parts[1]

    print(f"[WS AUTH] token found = {bool(token)}")
    if token:
        print(f"[WS AUTH] token length = {len(token)}")

    return token


@database_sync_to_async
def get_user_from_token(token_string: str):
    print("[WS AUTH] get_user_from_token called")
    print(f"[WS AUTH] token received = {bool(token_string)}")
    if token_string:
        print(f"[WS AUTH] token length = {len(token_string)}")
    else:
        print("[WS AUTH] AUTHENTICATION FAILED: empty token string")
        return AnonymousUser()

    try:
        access_token = AccessToken(token_string)
        print("[WS AUTH] AccessToken created successfully")
        user_id = access_token.get("user_id")
        print(f"[WS AUTH] token user_id = {user_id}")
        if not user_id:
            print("[WS AUTH] AUTHENTICATION FAILED: no user_id in token")
            return AnonymousUser()

        print(f"[WS AUTH] Looking up User id = {user_id}")
        user = User.objects.get(id=user_id)
        print(f"[WS AUTH] User found")
        print(f"[WS AUTH] user.id = {user.id}")
        print(f"[WS AUTH] user.is_active = {user.is_active}")
        if not user.is_active:
            print("[WS AUTH] AUTHENTICATION FAILED: user is inactive")
            return AnonymousUser()

        # Invalidate if password changed (B-14)
        token_pwd_hash = access_token.get("pwd_hash")
        print(f"[WS AUTH] token has pwd_hash = {bool(token_pwd_hash)}")
        if token_pwd_hash:
            current_suffix = user.password[-12:] if user.password else ""
            if token_pwd_hash != current_suffix:
                print("[WS AUTH] password hash validation result = FAIL")
                print("[WS AUTH] AUTHENTICATION FAILED: password hash mismatch")
                return AnonymousUser()
            else:
                print("[WS AUTH] password hash validation result = PASS")

        print(f"[WS AUTH] AUTHENTICATION SUCCESS user_id={user.id}")
        return user
    except Exception as exc:
        print("[WS AUTH] AUTHENTICATION FAILED")
        print(f"[WS AUTH] exception type = {type(exc)}")
        print(f"[WS AUTH] exception = {repr(exc)}")
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    """
    Custom Channels middleware to authenticate WebSocket connections
    using JWT access token passed via query string or Sec-WebSocket-Protocol.
    """

    async def __call__(self, scope, receive, send):
        print("[WS MIDDLEWARE] WebSocket middleware called")
        print(f"[WS MIDDLEWARE] path = {scope.get('path')}")
        print(f"[WS MIDDLEWARE] subprotocols = {scope.get('subprotocols')}")

        token = get_token_from_scope(scope)
        if token:
            user = await get_user_from_token(token)
            scope["user"] = user
            print(f"[WS MIDDLEWARE] authenticated user type = {type(user)}")
            print(f"[WS MIDDLEWARE] authenticated user id = {getattr(user, 'id', None)}")
            print(f"[WS MIDDLEWARE] is_authenticated = {getattr(user, 'is_authenticated', False)}")
            print(f"[WS MIDDLEWARE] is_anonymous = {getattr(user, 'is_anonymous', True)}")
        else:
            print("[WS MIDDLEWARE] NO TOKEN FOUND")
            scope["user"] = AnonymousUser()

        return await super().__call__(scope, receive, send)


def JWTAuthMiddlewareStack(inner):
    return JWTAuthMiddleware(inner)
