import '../../../../core/storage/secure_storage_service.dart';
import '../datasources/auth_remote_datasource.dart';
import '../models/auth_user_model.dart';
import '../models/login_request_model.dart';
import '../models/register_request_model.dart';

abstract class AuthRepository {
  Future<AuthUserModel> login(LoginRequestModel request);
  Future<AuthUserModel> register(RegisterRequestModel request);
  Future<void> logout();
  Future<AuthUserModel?> restoreSession();
  Future<bool> isAuthenticated();
}

class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource remoteDataSource;
  final SecureStorageService secureStorage;

  AuthRepositoryImpl({
    required this.remoteDataSource,
    required this.secureStorage,
  });

  @override
  Future<AuthUserModel> login(LoginRequestModel request) async {
    final response = await remoteDataSource.login(request);

    await secureStorage.saveTokens(
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    );

    AuthUserModel user = response.user ??
        AuthUserModel(
          id: 0,
          name: request.email.split('@').first,
          username: request.email.split('@').first,
          email: request.email,
        );

    await secureStorage.saveUserData(user.toJson());
    return user;
  }

  @override
  Future<AuthUserModel> register(RegisterRequestModel request) async {
    final response = await remoteDataSource.register(request);

    await secureStorage.saveTokens(
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    );

    AuthUserModel user = response.user ??
        AuthUserModel(
          id: 0,
          name: request.name,
          username: request.username,
          email: request.email,
          phoneNumber: request.phoneNumber,
        );

    await secureStorage.saveUserData(user.toJson());
    return user;
  }

  @override
  Future<void> logout() async {
    final refreshToken = await secureStorage.getRefreshToken();
    try {
      if (refreshToken != null && refreshToken.isNotEmpty) {
        await remoteDataSource.logout(refreshToken: refreshToken);
      }
    } catch (_) {
      // Even if network logout fails, clear local credentials
    } finally {
      await secureStorage.clearAll();
    }
  }

  @override
  Future<AuthUserModel?> restoreSession() async {
    final accessToken = await secureStorage.getAccessToken();
    if (accessToken == null || accessToken.isEmpty) {
      return null;
    }

    final userJson = await secureStorage.getUserData();
    if (userJson != null) {
      return AuthUserModel.fromJson(userJson);
    }
    return null;
  }

  @override
  Future<bool> isAuthenticated() async {
    final accessToken = await secureStorage.getAccessToken();
    return accessToken != null && accessToken.isNotEmpty;
  }
}
