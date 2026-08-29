import 'auth_user_model.dart';

/// Representation of the authentication response returned by Django login/register endpoints.
class AuthResponseModel {
  final String accessToken;
  final String? refreshToken;
  final AuthUserModel? user;

  const AuthResponseModel({
    required this.accessToken,
    this.refreshToken,
    this.user,
  });

  factory AuthResponseModel.fromJson(Map<String, dynamic> json) {
    // Django response envelope: {"status": true, "message": "...", "data": {"access": "...", "user": {...}, "refresh": "..."}}
    final data = json['data'] is Map<String, dynamic>
        ? json['data'] as Map<String, dynamic>
        : json;

    final access = (data['access'] ?? data['token']) as String? ?? '';
    final refresh = data['refresh'] as String?;
    final userJson = data['user'] as Map<String, dynamic>?;

    return AuthResponseModel(
      accessToken: access,
      refreshToken: refresh,
      user: userJson != null ? AuthUserModel.fromJson(userJson) : null,
    );
  }
}
