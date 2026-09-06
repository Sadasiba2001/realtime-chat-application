import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_endpoints.dart';
import '../models/auth_response_model.dart';
import '../models/auth_user_model.dart';
import '../models/login_request_model.dart';
import '../models/register_request_model.dart';

abstract class AuthRemoteDataSource {
  Future<AuthResponseModel> login(LoginRequestModel request);
  Future<AuthResponseModel> register(RegisterRequestModel request);
  Future<void> logout({String? refreshToken});
  Future<String> refreshToken(String refreshToken);
  Future<AuthUserModel?> getProfile();
}

class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  final ApiClient apiClient;

  AuthRemoteDataSourceImpl({required this.apiClient});

  @override
  Future<AuthResponseModel> login(LoginRequestModel request) async {
    final response = await apiClient.post(
      ApiEndpoints.login,
      data: request.toJson(),
    );
    return AuthResponseModel.fromJson(response as Map<String, dynamic>);
  }

  @override
  Future<AuthResponseModel> register(RegisterRequestModel request) async {
    final response = await apiClient.post(
      ApiEndpoints.register,
      data: request.toJson(),
    );
    return AuthResponseModel.fromJson(response as Map<String, dynamic>);
  }

  @override
  Future<void> logout({String? refreshToken}) async {
    final data = <String, dynamic>{};
    if (refreshToken != null && refreshToken.isNotEmpty) {
      data['refresh'] = refreshToken;
    }
    await apiClient.post(
      ApiEndpoints.logout,
      data: data,
    );
  }

  @override
  Future<String> refreshToken(String refreshToken) async {
    final response = await apiClient.post(
      ApiEndpoints.tokenRefresh,
      data: {'refresh': refreshToken},
    );
    final json = response as Map<String, dynamic>;
    final data = json['data'] is Map<String, dynamic> ? json['data'] : json;
    return (data['access'] ?? '') as String;
  }

  @override
  Future<AuthUserModel?> getProfile() async {
    // Attempt fetching user profile
    final response = await apiClient.get(ApiEndpoints.users);
    if (response is Map<String, dynamic> && response['data'] is Map<String, dynamic>) {
      final results = response['data']['results'];
      if (results is List && results.isNotEmpty) {
        return AuthUserModel.fromJson(results.first as Map<String, dynamic>);
      }
    }
    return null;
  }
}
