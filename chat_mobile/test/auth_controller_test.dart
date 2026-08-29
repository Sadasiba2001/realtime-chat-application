import 'package:flutter_test/flutter_test.dart';
import 'package:chat_mobile/core/network/api_exception.dart';
import 'package:chat_mobile/features/auth/data/models/auth_user_model.dart';
import 'package:chat_mobile/features/auth/data/models/login_request_model.dart';
import 'package:chat_mobile/features/auth/data/models/register_request_model.dart';
import 'package:chat_mobile/features/auth/data/repositories/auth_repository.dart';
import 'package:chat_mobile/features/auth/presentation/controllers/auth_controller.dart';
import 'package:chat_mobile/features/auth/presentation/controllers/auth_state.dart';

class FakeAuthRepository implements AuthRepository {
  bool shouldFailLogin = false;
  bool shouldFailRegister = false;
  bool shouldReturnSession = false;
  ApiException? errorToThrow;

  @override
  Future<AuthUserModel> login(LoginRequestModel request) async {
    if (shouldFailLogin) {
      throw errorToThrow ?? const ApiException(message: 'Invalid email or password.', statusCode: 400);
    }
    return const AuthUserModel(
      id: 1,
      name: 'Logged User',
      username: 'loggeduser',
      email: 'user@example.com',
    );
  }

  @override
  Future<AuthUserModel> register(RegisterRequestModel request) async {
    if (shouldFailRegister) {
      throw errorToThrow ??
          const ApiException(
            message: 'Please review the errors below.',
            statusCode: 400,
            fieldErrors: {'email': 'A user with this email already exists.'},
          );
    }
    return AuthUserModel(
      id: 2,
      name: request.name,
      username: request.username,
      email: request.email,
    );
  }

  @override
  Future<void> logout() async {}

  @override
  Future<AuthUserModel?> restoreSession() async {
    if (shouldReturnSession) {
      return const AuthUserModel(
        id: 1,
        name: 'Restored User',
        username: 'restoreduser',
        email: 'restored@example.com',
      );
    }
    return null;
  }

  @override
  Future<bool> isAuthenticated() async => shouldReturnSession;
}

void main() {
  late FakeAuthRepository fakeRepository;
  late AuthController controller;

  setUp(() {
    fakeRepository = FakeAuthRepository();
    controller = AuthController(repository: fakeRepository);
  });

  group('AuthController State Machine Tests', () {
    test('Initial state is AuthInitial', () {
      expect(controller.state, isA<AuthInitial>());
      expect(controller.isAuthenticated, isFalse);
    });

    test('Successful login transitions from AuthLoading to Authenticated', () async {
      final future = controller.login(email: 'user@example.com', password: 'password123');
      expect(controller.isLoading, isTrue);

      final success = await future;
      expect(success, isTrue);
      expect(controller.state, isA<Authenticated>());
      expect(controller.currentUser?.email, 'user@example.com');
      expect(controller.isAuthenticated, isTrue);
    });

    test('Failed login transitions to AuthFailure with user-safe message', () async {
      fakeRepository.shouldFailLogin = true;
      fakeRepository.errorToThrow = const ApiException(
        message: 'Invalid email or password.',
        statusCode: 400,
      );

      final success = await controller.login(email: 'wrong@example.com', password: 'wrong');
      expect(success, isFalse);
      expect(controller.state, isA<AuthFailure>());
      final failure = controller.state as AuthFailure;
      expect(failure.message, 'Invalid email or password.');
      expect(controller.isAuthenticated, isFalse);
    });

    test('Failed registration captures fieldErrors accurately', () async {
      fakeRepository.shouldFailRegister = true;
      fakeRepository.errorToThrow = const ApiException(
        message: 'Please review the errors below.',
        statusCode: 400,
        fieldErrors: {'email': 'A user with this email already exists.'},
      );

      final success = await controller.register(
        name: 'Dup User',
        username: 'dup',
        email: 'dup@example.com',
        password: 'password123',
      );

      expect(success, isFalse);
      expect(controller.state, isA<AuthFailure>());
      final failure = controller.state as AuthFailure;
      expect(failure.fieldErrors?['email'], 'A user with this email already exists.');
    });

    test('checkAuthStatus restores valid session if token exists', () async {
      fakeRepository.shouldReturnSession = true;

      await controller.checkAuthStatus();
      expect(controller.state, isA<Authenticated>());
      expect(controller.currentUser?.name, 'Restored User');
      expect(controller.isAuthenticated, isTrue);
    });

    test('checkAuthStatus transitions to Unauthenticated if no session exists', () async {
      fakeRepository.shouldReturnSession = false;

      await controller.checkAuthStatus();
      expect(controller.state, isA<Unauthenticated>());
      expect(controller.isAuthenticated, isFalse);
    });

    test('Logout transitions state to Unauthenticated', () async {
      // First login
      await controller.login(email: 'user@example.com', password: 'password123');
      expect(controller.isAuthenticated, isTrue);

      // Logout
      await controller.logout();
      expect(controller.state, isA<Unauthenticated>());
      expect(controller.isAuthenticated, isFalse);
      expect(controller.currentUser, isNull);
    });
  });
}
