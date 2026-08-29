import 'package:dio/dio.dart';


class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final Map<String, String>? fieldErrors;

  const ApiException({
    required this.message,
    this.statusCode,
    this.fieldErrors,
  });

  /// Factory translating DioException to a safe ApiException.
  factory ApiException.fromDioError(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return const ApiException(
          message: 'Connection timed out. Please check your network and try again.',
        );

      case DioExceptionType.connectionError:
        return const ApiException(
          message: 'Unable to reach the server. Please check your internet connection.',
        );

      case DioExceptionType.badResponse:
        final response = error.response;
        final statusCode = response?.statusCode;
        final data = response?.data;

        String generalMessage = 'An unexpected error occurred. Please try again.';
        Map<String, String>? fieldErrors;

        if (data is Map<String, dynamic>) {
          // Handle standard backend JSON: {"status": false, "message": "..."}
          if (data['message'] is String && (data['message'] as String).isNotEmpty) {
            generalMessage = data['message'] as String;
          }

          // Handle DRF serializer field validation errors: {"email": ["..."], "password": ["..."]}
          final extractedFieldErrors = <String, String>{};
          data.forEach((key, value) {
            if (key != 'status' && key != 'message' && key != 'data') {
              if (value is List && value.isNotEmpty) {
                extractedFieldErrors[key] = value.first.toString();
              } else if (value is String) {
                extractedFieldErrors[key] = value;
              }
            }
          });

          if (extractedFieldErrors.isNotEmpty) {
            fieldErrors = extractedFieldErrors;
            if (generalMessage == 'An unexpected error occurred. Please try again.') {
              generalMessage = 'Please review the errors below.';
            }
          }
        }

        switch (statusCode) {
          case 400:
            return ApiException(
              message: generalMessage.isNotEmpty ? generalMessage : 'Invalid request data.',
              statusCode: 400,
              fieldErrors: fieldErrors,
            );
          case 401:
            return ApiException(
              message: generalMessage != 'An unexpected error occurred. Please try again.'
                  ? generalMessage
                  : 'Invalid credentials or session expired.',
              statusCode: 401,
              fieldErrors: fieldErrors,
            );
          case 403:
            return const ApiException(
              message: 'Access denied.',
              statusCode: 403,
            );
          case 404:
            return const ApiException(
              message: 'The requested resource was not found.',
              statusCode: 404,
            );
          case 409:
            return ApiException(
              message: generalMessage,
              statusCode: 409,
              fieldErrors: fieldErrors,
            );
          case 429:
            return const ApiException(
              message: 'Too many requests. Please slow down and try again shortly.',
              statusCode: 429,
            );
          case 500:
          case 502:
          case 503:
          case 504:
            return const ApiException(
              message: 'Server error. Please try again later.',
              statusCode: 500,
            );
          default:
            return ApiException(
              message: generalMessage,
              statusCode: statusCode,
              fieldErrors: fieldErrors,
            );
        }

      case DioExceptionType.cancel:
        return const ApiException(message: 'Request was cancelled.');

      default:
        return const ApiException(
          message: 'An unexpected network error occurred.',
        );
    }
  }

  @override
  String toString() => message;
}
