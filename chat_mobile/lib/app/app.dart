import 'package:flutter/material.dart';
import '../features/auth/presentation/controllers/auth_scope.dart';
import 'router/app_router.dart';
import 'theme/app_theme.dart';

/// Root Application Widget configuring theme, auth scope, and navigation.
class ChatApp extends StatefulWidget {
  const ChatApp({super.key});

  /// Global notifier allowing theme mode toggle from settings
  static final ValueNotifier<ThemeMode> themeModeNotifier = ValueNotifier<ThemeMode>(ThemeMode.system);

  static void setThemeMode(ThemeMode mode) {
    themeModeNotifier.value = mode;
  }

  @override
  State<ChatApp> createState() => _ChatAppState();
}

class _ChatAppState extends State<ChatApp> {
  @override
  void initState() {
    super.initState();
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
