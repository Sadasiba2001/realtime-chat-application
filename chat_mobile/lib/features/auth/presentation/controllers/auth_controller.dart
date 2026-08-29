import 'package:flutter/foundation.dart';
import '../../../../core/network/api_exception.dart';
import '../../data/models/auth_user_model.dart';
import '../../data/models/login_request_model.dart';
import '../../data/models/register_request_model.dart';
import '../../data/repositories/auth_repository.dart';
import 'auth_state.dart';

/// Central Controller for authentication state across the application.
class AuthController extends ChangeNotifier {
  final AuthRepository repository;

  AuthState _state = const AuthInitial();

  AuthState get state => _state;
  bool get isAuthenticated => _state is Authenticated;
  bool get isLoading => _state is AuthLoading;
  AuthUserModel? get currentUser => _state is Authenticated ? (_state as Authenticated).user : null;

  AuthController({required this.repository});

  void _setState(AuthState newState) {
    _state = newState;
    notifyListeners();
  }

  /// Check for existing token and restore session on app launch.
  Future<void> checkAuthStatus() async {
    _setState(const AuthLoading());
    try {
      final user = await repository.restoreSession();
      if (user != null) {
        _setState(Authenticated(user));
      } else {
        _setState(const Unauthenticated());
      }
    } catch (_) {
      _setState(const Unauthenticated());
    }
  }

  /// Perform login against the Django backend.
  Future<bool> login({
    required String email,
    required String password,
  }) async {
    _setState(const AuthLoading());
    try {
      final user = await repository.login(
        LoginRequestModel(email: email, password: password),
      );
      _setState(Authenticated(user));
      return true;
    } on ApiException catch (e) {
      _setState(AuthFailure(message: e.message, fieldErrors: e.fieldErrors));
      return false;
    } catch (e) {
      _setState(AuthFailure(message: e.toString()));
      return false;
    }
  }

  /// Perform registration against the Django backend.
  Future<bool> register({
    required String name,
    required String username,
    required String email,
    String phoneNumber = '',
    required String password,
  }) async {
    _setState(const AuthLoading());
    try {
      final user = await repository.register(
        RegisterRequestModel(
          name: name,
          username: username,
          email: email,
          phoneNumber: phoneNumber,
          password: password,
        ),
      );
      _setState(Authenticated(user));
      return true;
    } on ApiException catch (e) {
      _setState(AuthFailure(message: e.message, fieldErrors: e.fieldErrors));
      return false;
    } catch (e) {
      _setState(AuthFailure(message: e.toString()));
      return false;
    }
  }

  /// Logout and clear credentials.
  Future<void> logout() async {
    _setState(const AuthLoading());
    await repository.logout();
    _setState(const Unauthenticated());
  }

  /// Reset error state back to unauthenticated if needed.
  void clearError() {
    if (_state is AuthFailure) {
      _setState(const Unauthenticated());
    }
  }
}
