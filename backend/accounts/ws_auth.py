"""
WebSocket JWT authentication middleware for Channels.

The SPA authenticates with JWT (not session cookies), so the default
AuthMiddlewareStack always yields AnonymousUser on the socket. This
middleware reads the access token from the `token` query-string parameter
(e.g. ws://host/ws/kahoot/ABC123/?token=<access>) and resolves it to the
matching user, populating scope['user'].
"""

from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken


@database_sync_to_async
def _get_user(user_id):
    from accounts.models import User
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return AnonymousUser()
    return user if user.is_active else AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    """Populate scope['user'] from a JWT access token in the query string."""

    async def __call__(self, scope, receive, send):
        query_string = scope.get('query_string', b'').decode()
        token = parse_qs(query_string).get('token', [None])[0]

        scope['user'] = AnonymousUser()
        if token:
            try:
                validated = AccessToken(token)
                scope['user'] = await _get_user(validated['user_id'])
            except TokenError:
                pass

        return await super().__call__(scope, receive, send)
