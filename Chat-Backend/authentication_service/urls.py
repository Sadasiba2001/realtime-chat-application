from django.urls import path
from authentication_service.controller import (
    register,
    login,
    logout,
    token_refresh,
    token_verify,
    get_users,
    get_user_by_id,
)

urlpatterns = [
    path("register/", register, name="register"),
    path("login/", login, name="login"),
    path("logout/", logout, name="logout"),
    path("token/refresh/", token_refresh, name="token_refresh"),
    path("token/verify/", token_verify, name="token_verify"),
    path("users/", get_users, name="get_users"),
    path("users/<int:user_id>/", get_user_by_id, name="get_user_by_id"),
]
