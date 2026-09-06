import '../../data/models/auth_user_model.dart';

/// Sealed hierarchy of authentication states.
sealed class AuthState {
  const AuthState();
}

/// Initial state prior to session check.
class AuthInitial extends AuthState {
  const AuthInitial();
}

/// State when an authentication request (login, signup, session restoration) is in flight.
class AuthLoading extends AuthState {
  const AuthLoading();
}

/// State when the user is successfully authenticated with a valid session and token.
class Authenticated extends AuthState {
  final AuthUserModel user;

  const Authenticated(this.user);
}

/// State when the user has no active session or has logged out.
class Unauthenticated extends AuthState {
  const Unauthenticated();
}

/// State when an authentication operation fails with an error.
class AuthFailure extends AuthState {
  final String message;
  final Map<String, String>? fieldErrors;

  const AuthFailure({
    required this.message,
    this.fieldErrors,
  });
}
