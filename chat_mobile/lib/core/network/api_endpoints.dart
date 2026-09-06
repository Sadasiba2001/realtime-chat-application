abstract final class ApiEndpoints {
  static const String register = '/api/v1/auth/register/';
  static const String login = '/api/v1/auth/login/';
  static const String logout = '/api/v1/auth/logout/';
  static const String tokenRefresh = '/api/v1/auth/token/refresh/';
  static const String tokenVerify = '/api/v1/auth/token/verify/';
  static const String users = '/api/v1/auth/users/';
  static const String usersSearch = '/api/v1/auth/users/search/';
  static const String profileImage = '/api/v1/auth/users/profile-image/';

  static String userById(int id) => '/api/v1/auth/users/$id/';
}
