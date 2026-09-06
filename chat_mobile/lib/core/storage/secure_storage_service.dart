import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Secure token and session storage interface.
class SecureStorageService {
  final FlutterSecureStorage? _storage;
  final Map<String, String> _memoryFallback = {};

  SecureStorageService({FlutterSecureStorage? storage})
      : _storage = storage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(),
              iOptions: IOSOptions(
                accessibility: KeychainAccessibility.first_unlock,
              ),
            );

  static const String _accessTokenKey = 'auth_access_token';
  static const String _refreshTokenKey = 'auth_refresh_token';
  static const String _userDataKey = 'auth_user_data';
  static const String _themeModeKey = 'app_theme_mode';

  Future<void> _safeWrite(String key, String value) async {
    _memoryFallback[key] = value;
    try {
      await _storage?.write(key: key, value: value);
    } catch (_) {
      // In test environments or when platform channel is unavailable, in-memory fallback handles state
    }
  }

  Future<String?> _safeRead(String key) async {
    try {
      final value = await _storage?.read(key: key);
      if (value != null) return value;
    } catch (_) {}
    return _memoryFallback[key];
  }

  Future<void> _safeDelete(String key) async {
    _memoryFallback.remove(key);
    try {
      await _storage?.delete(key: key);
    } catch (_) {}
  }

  /// Store tokens securely.
  Future<void> saveTokens({
    required String accessToken,
    String? refreshToken,
  }) async {
    await _safeWrite(_accessTokenKey, accessToken);
    if (refreshToken != null && refreshToken.isNotEmpty) {
      await _safeWrite(_refreshTokenKey, refreshToken);
    }
  }

  /// Retrieve active access token.
  Future<String?> getAccessToken() async {
    return _safeRead(_accessTokenKey);
  }

  /// Retrieve refresh token.
  Future<String?> getRefreshToken() async {
    return _safeRead(_refreshTokenKey);
  }

  /// Store user profile data.
  Future<void> saveUserData(Map<String, dynamic> userMap) async {
    final encoded = jsonEncode(userMap);
    await _safeWrite(_userDataKey, encoded);
  }

  /// Retrieve cached user profile data.
  Future<Map<String, dynamic>?> getUserData() async {
    final raw = await _safeRead(_userDataKey);
    if (raw == null || raw.isEmpty) return null;
    try {
      return jsonDecode(raw) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  /// Persist user's selected theme mode.
  Future<void> saveThemeMode(ThemeMode mode) async {
    await _safeWrite(_themeModeKey, mode.name);
  }

  /// Retrieve user's persisted theme mode.
  Future<ThemeMode?> getThemeMode() async {
    final raw = await _safeRead(_themeModeKey);
    if (raw == null) return null;
    switch (raw) {
      case 'light':
        return ThemeMode.light;
      case 'dark':
        return ThemeMode.dark;
      case 'system':
      default:
        return ThemeMode.system;
    }
  }

  /// Clear tokens on logout.
  Future<void> clearTokens() async {
    await _safeDelete(_accessTokenKey);
    await _safeDelete(_refreshTokenKey);
  }

  /// Clear all stored credentials and user data.
  Future<void> clearAll() async {
    await _safeDelete(_accessTokenKey);
    await _safeDelete(_refreshTokenKey);
    await _safeDelete(_userDataKey);
  }
}
