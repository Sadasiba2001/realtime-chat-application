import 'package:flutter_test/flutter_test.dart';
import 'package:chat_mobile/core/network/api_exception.dart';
import 'package:chat_mobile/core/storage/secure_storage_service.dart';
import 'package:chat_mobile/features/auth/data/datasources/auth_remote_datasource.dart';
import 'package:chat_mobile/features/auth/data/models/auth_response_model.dart';
import 'package:chat_mobile/features/auth/data/models/auth_user_model.dart';
import 'package:chat_mobile/features/auth/data/models/login_request_model.dart';
import 'package:chat_mobile/features/auth/data/models/register_request_model.dart';
import 'package:chat_mobile/features/auth/data/repositories/auth_repository.dart';

class MockSecureStorage extends SecureStorageService {
  final Map<String, String> _inMemory = {};

  @override
  Future<void> saveTokens({required String accessToken, String? refreshToken}) async {
    _inMemory['auth_access_token'] = accessToken;
    if (refreshToken != null) _inMemory['auth_refresh_token'] = refreshToken;
  }

  @override
  Future<String?> getAccessToken() async => _inMemory['auth_access_token'];

  @override
  Future<String?> getRefreshToken() async => _inMemory['auth_refresh_token'];

  @override
  Future<void> saveUserData(Map<String, dynamic> userMap) async {
    _inMemory['auth_user_data'] = userMap.toString();
  }

  @override
  Future<Map<String, dynamic>?> getUserData() async {
    if (!_inMemory.containsKey('auth_user_data')) return null;
    return {
      'id': 1,
      'name': 'Test User',
      'username': 'testuser',
      'email': 'test@example.com',
      'role': 'NORMAL_USER',
    };
  }

  @override
  Future<void> clearTokens() async {
    _inMemory.remove('auth_access_token');
    _inMemory.remove('auth_refresh_token');
  }

  @override
  Future<void> clearAll() async {
    _inMemory.clear();
  }
}

class MockAuthRemoteDataSource implements AuthRemoteDataSource {
  bool shouldThrowInvalidCredentials = false;
  bool shouldThrowNetworkError = false;
  bool shouldThrowDuplicateUser = false;

  @override
  Future<AuthResponseModel> login(LoginRequestModel request) async {
    if (shouldThrowNetworkError) {
      throw const ApiException(message: 'Unable to reach the server. Please check your internet connection.');
    }
    if (shouldThrowInvalidCredentials) {
      throw const ApiException(message: 'Invalid email or password.', statusCode: 400);
    }
    return const AuthResponseModel(
      accessToken: 'mock_jwt_access_token_123',
      refreshToken: 'mock_jwt_refresh_token_456',
      user: AuthUserModel(
        id: 1,
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
      ),
    );
  }

  @override
  Future<AuthResponseModel> register(RegisterRequestModel request) async {
    if (shouldThrowNetworkError) {
      throw const ApiException(message: 'Unable to reach the server. Please check your internet connection.');
    }
    if (shouldThrowDuplicateUser) {
      throw const ApiException(
        message: 'A user with this email already exists.',
        statusCode: 400,
      );
    }
    return AuthResponseModel(
      accessToken: 'mock_jwt_access_token_123',
      refreshToken: 'mock_jwt_refresh_token_456',
      user: AuthUserModel(
        id: 2,
        name: request.name,
        username: request.username,
        email: request.email,
        phoneNumber: request.phoneNumber,
      ),
    );
  }

  @override
  Future<void> logout({String? refreshToken}) async {}

  @override
  Future<String> refreshToken(String refreshToken) async => 'mock_jwt_new_access_token';

  @override
  Future<AuthUserModel?> getProfile() async => null;
}

void main() {
  late MockAuthRemoteDataSource mockRemoteDataSource;
  late MockSecureStorage mockSecureStorage;
  late AuthRepository repository;

  setUp(() {
    mockRemoteDataSource = MockAuthRemoteDataSource();
    mockSecureStorage = MockSecureStorage();
    repository = AuthRepositoryImpl(
      remoteDataSource: mockRemoteDataSource,
      secureStorage: mockSecureStorage,
    );
  });

  group('AuthRepository Unit Tests', () {
    test('Login stores tokens and returns authenticated AuthUserModel on success', () async {
      final user = await repository.login(
        const LoginRequestModel(email: 'test@example.com', password: 'password123'),
      );

      expect(user.id, 1);
      expect(user.email, 'test@example.com');
      expect(await mockSecureStorage.getAccessToken(), 'mock_jwt_access_token_123');
      expect(await mockSecureStorage.getRefreshToken(), 'mock_jwt_refresh_token_456');
      expect(await repository.isAuthenticated(), isTrue);
    });

    test('Login throws ApiException when backend reports invalid credentials', () async {
      mockRemoteDataSource.shouldThrowInvalidCredentials = true;

      expect(
        () => repository.login(
          const LoginRequestModel(email: 'wrong@example.com', password: 'wrongpassword'),
        ),
        throwsA(isA<ApiException>().having((e) => e.message, 'message', 'Invalid email or password.')),
      );

      expect(await mockSecureStorage.getAccessToken(), isNull);
      expect(await repository.isAuthenticated(), isFalse);
    });

    test('Register stores tokens and returns new user on success', () async {
      final user = await repository.register(
        const RegisterRequestModel(
          name: 'Jane Doe',
          username: 'janedoe',
          email: 'jane@example.com',
          password: 'password123',
        ),
      );

      expect(user.name, 'Jane Doe');
      expect(user.username, 'janedoe');
      expect(await mockSecureStorage.getAccessToken(), 'mock_jwt_access_token_123');
      expect(await repository.isAuthenticated(), isTrue);
    });

    test('Register throws ApiException on duplicate registration', () async {
      mockRemoteDataSource.shouldThrowDuplicateUser = true;

      expect(
        () => repository.register(
          const RegisterRequestModel(
            name: 'Jane Doe',
            username: 'janedoe',
            email: 'duplicate@example.com',
            password: 'password123',
          ),
        ),
        throwsA(isA<ApiException>().having((e) => e.message, 'message', 'A user with this email already exists.')),
      );
    });

    test('Logout clears tokens and session data from secure storage', () async {
      // First log in
      await repository.login(
        const LoginRequestModel(email: 'test@example.com', password: 'password123'),
      );
      expect(await repository.isAuthenticated(), isTrue);

      // Now log out
      await repository.logout();

      expect(await mockSecureStorage.getAccessToken(), isNull);
      expect(await mockSecureStorage.getRefreshToken(), isNull);
      expect(await repository.isAuthenticated(), isFalse);
    });
  });
}
