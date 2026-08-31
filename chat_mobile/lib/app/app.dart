import 'package:flutter/material.dart';
import '../core/storage/secure_storage_service.dart';
import '../features/auth/presentation/controllers/auth_scope.dart';
import 'router/app_router.dart';
import 'theme/app_theme.dart';

/// Root Application Widget configuring theme, auth scope, and navigation.
class ChatApp extends StatefulWidget {
  const ChatApp({super.key});

  static final SecureStorageService _storage = SecureStorageService();

  /// Global notifier allowing theme mode toggle from settings
  static final ValueNotifier<ThemeMode> themeModeNotifier = ValueNotifier<ThemeMode>(ThemeMode.system);

  static void setThemeMode(ThemeMode mode) {
    themeModeNotifier.value = mode;
    _storage.saveThemeMode(mode);
  }

  static Future<void> loadSavedTheme() async {
    final savedMode = await _storage.getThemeMode();
    if (savedMode != null) {
      themeModeNotifier.value = savedMode;
    }
  }

  @override
  State<ChatApp> createState() => _ChatAppState();
}

class _ChatAppState extends State<ChatApp> {
  @override
  void initState() {
    super.initState();
    ChatApp.loadSavedTheme();
    AppRouter.authController.checkAuthStatus();
  }

  @override
  Widget build(BuildContext context) {
    return AuthScope(
      controller: AppRouter.authController,
      child: ValueListenableBuilder<ThemeMode>(
        valueListenable: ChatApp.themeModeNotifier,
        builder: (context, themeMode, _) {
          return MaterialApp.router(
            title: 'Chat Mobile',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.lightTheme,
            darkTheme: AppTheme.darkTheme,
            themeMode: themeMode,
            routerConfig: AppRouter.router,
          );
        },
      ),
    );
  }
}
