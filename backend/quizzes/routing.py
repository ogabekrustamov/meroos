"""
WebSocket URL routing for Channels
"""

from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/kahoot/(?P<room_code>\w+)/$', consumers.KahootConsumer.as_asgi()),
]