import 'package:dio/dio.dart';

import '../config/api_config.dart';
import '../storage/secure_storage_service.dart';
import 'api_endpoints.dart';
import 'api_exception.dart';

/// Centralized HTTP client managing authentication headers, timeouts, and automatic token refresh.
class ApiClient {
  final Dio dio;
  final SecureStorageService secureStorage;

  ApiClient({Dio? customDio, SecureStorageService? storage})
    : dio =
          customDio ??
          Dio(
            BaseOptions(
              baseUrl: ApiConfig.defaultBaseUrl,
              connectTimeout: ApiConfig.connectTimeout,
              receiveTimeout: ApiConfig.receiveTimeout,
              sendTimeout: ApiConfig.sendTimeout,
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
            ),
          ),
      secureStorage = storage ?? SecureStorageService() {
    _setupInterceptors();
  }

  void _setupInterceptors() {
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // Add Bearer token to request headers if available
          final token = await secureStorage.getAccessToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException error, handler) async {
          // Check if 401 Unauthorized and not an auth endpoint (login/register/refresh/logout)
          final requestPath = error.requestOptions.path;
          final isAuthEndpoint =
              requestPath.contains(ApiEndpoints.login) ||
              requestPath.contains(ApiEndpoints.register) ||
              requestPath.contains(ApiEndpoints.tokenRefresh) ||
              requestPath.contains(ApiEndpoints.logout);

          if (error.response?.statusCode == 401 && !isAuthEndpoint) {
            final refreshToken = await secureStorage.getRefreshToken();
            if (refreshToken != null && refreshToken.isNotEmpty) {
              try {
                // Attempt token refresh
                final refreshResponse = await dio.post(
                  ApiEndpoints.tokenRefresh,
                  data: {'refresh': refreshToken},
                  options: Options(headers: {'Authorization': null}),
                );

                final data = refreshResponse.data;
                final dataObj = data is Map<String, dynamic>
                    ? data['data'] ?? data
                    : null;
                final newAccess = dataObj is Map<String, dynamic>
                    ? dataObj['access'] as String?
                    : null;

                if (newAccess != null && newAccess.isNotEmpty) {
                  await secureStorage.saveTokens(
                    accessToken: newAccess,
                    refreshToken: refreshToken,
                  );

                  // Retry the original failed request with the new token
                  final retryOptions = error.requestOptions;
                  retryOptions.headers['Authorization'] = 'Bearer $newAccess';

                  final retryResponse = await dio.fetch(retryOptions);
                  return handler.resolve(retryResponse);
                }
              } catch (_) {
                // If refresh fails, clear credentials
                await secureStorage.clearTokens();
              }
            }
          }

          return handler.next(error);
        },
      ),
    );
  }

  /// Perform a GET request.
  Future<dynamic> get(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await dio.get(
        path,
        queryParameters: queryParameters,
        options: options,
      );
      return response.data;
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    } catch (e) {
      throw ApiException(message: e.toString());
    }
  }

  /// Perform a POST request.
  Future<dynamic> post(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await dio.post(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
      return response.data;
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    } catch (e) {
      throw ApiException(message: e.toString());
    }
  }

  /// Perform a PUT request.
  Future<dynamic> put(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await dio.put(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
      return response.data;
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    } catch (e) {
      throw ApiException(message: e.toString());
    }
  }

  /// Perform a DELETE request.
  Future<dynamic> delete(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await dio.delete(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
      return response.data;
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    } catch (e) {
      throw ApiException(message: e.toString());
    }
  }
}
