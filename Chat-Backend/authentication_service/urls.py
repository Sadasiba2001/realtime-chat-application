from django.urls import path
from authentication_service.controller import (
    register,
    login,
    logout,
    token_refresh,
    token_verify,
    get_users,
    get_user_by_id,
    search_users,
    manage_profile_image,
    verify_email,
    resend_verification,
    forgot_password,
    verify_reset_token,
    reset_password,
)

urlpatterns = [
    # Core Auth
    path("register/", register, name="register"),
    path("login/", login, name="login"),
    path("logout/", logout, name="logout"),
    path("token/refresh/", token_refresh, name="token_refresh"),
    path("token/verify/", token_verify, name="token_verify"),

    # Email Verification
    path("verify-email/", verify_email, name="verify_email"),
    path("verify-email/<str:token>/", verify_email, name="verify_email_with_param"),
    path("resend-verification/", resend_verification, name="resend_verification"),

    # Password Reset
    path("password/forgot/", forgot_password, name="forgot_password"),
    path("forgot-password/", forgot_password, name="forgot_password_alias"),
    path("password/verify-token/", verify_reset_token, name="verify_reset_token"),
    path("verify-reset-token/", verify_reset_token, name="verify_reset_token_alias"),
    path("password/reset/", reset_password, name="reset_password"),
    path("reset-password/", reset_password, name="reset_password_alias"),

    # User Management & Search
    path("users/search/", search_users, name="search_users"),
    path("users/profile-image/", manage_profile_image, name="manage_profile_image"),
    path("users/", get_users, name="get_users"),
    path("users/<int:user_id>/", get_user_by_id, name="get_user_by_id"),
]
