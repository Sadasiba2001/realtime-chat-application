import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/network/api_client.dart';
import '../../core/storage/secure_storage_service.dart';
import '../../features/auth/data/datasources/auth_remote_datasource.dart';
import '../../features/auth/data/repositories/auth_repository.dart';
import '../../features/auth/presentation/controllers/auth_controller.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/auth/presentation/screens/signup_screen.dart';
import '../../features/calls/presentation/calls_screen.dart';
import '../../features/chat/presentation/chat_list_screen.dart';
import '../../features/chat/presentation/chat_room_screen.dart';
import '../../features/contacts/presentation/contacts_screen.dart';
import '../../features/main/presentation/main_shell_screen.dart';
import '../../features/settings/presentation/settings_screen.dart';
import '../../features/welcome/presentation/welcome_screen.dart';

final GlobalKey<NavigatorState> _rootNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'root');
final GlobalKey<NavigatorState> _chatsNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'chats');
final GlobalKey<NavigatorState> _contactsNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'contacts');
final GlobalKey<NavigatorState> _callsNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'calls');
final GlobalKey<NavigatorState> _settingsNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'settings');

/// Central GoRouter configuration managing top-level routes, auth boundary, and bottom navigation shell.
abstract final class AppRouter {
  static AuthController authController = AuthController(
    repository: AuthRepositoryImpl(
      remoteDataSource: AuthRemoteDataSourceImpl(apiClient: ApiClient()),
      secureStorage: SecureStorageService(),
    ),
  );

  static void setAuthController(AuthController controller) {
    authController = controller;
    _router = null;
  }

  static GoRouter? _router;

  static GoRouter get router {
    _router ??= _createRouter();
    return _router!;
  }

  static GoRouter _createRouter() {
    return GoRouter(
      navigatorKey: _rootNavigatorKey,
      initialLocation: '/welcome',
      debugLogDiagnostics: false,
      refreshListenable: authController,
      redirect: (context, state) {
        final isAuthenticated = authController.isAuthenticated;
        final location = state.matchedLocation;

        final isAuthRoute = location == '/welcome' || location == '/login' || location == '/signup';

        // Unauthenticated access trying to reach protected screens -> redirect to login
        if (!isAuthenticated && !isAuthRoute) {
          return '/login';
        }

        // Authenticated user on login/signup/welcome -> redirect to main chats
        if (isAuthenticated && isAuthRoute) {
          return '/main/chats';
        }

        return null;
      },
      routes: [
        GoRoute(
          path: '/welcome',
          builder: (context, state) => const WelcomeScreen(),
        ),
        GoRoute(
          path: '/login',
          builder: (context, state) => LoginScreen(authController: authController),
        ),
        GoRoute(
          path: '/signup',
          builder: (context, state) => SignupScreen(authController: authController),
        ),
        GoRoute(
          path: '/chat/:id',
          parentNavigatorKey: _rootNavigatorKey,
          builder: (context, state) {
            final id = state.pathParameters['id'] ?? '1';
            return ChatRoomScreen(conversationId: id);
          },
        ),
        StatefulShellRoute.indexedStack(
          builder: (context, state, navigationShell) {
            return MainShellScreen(navigationShell: navigationShell);
          },
          branches: [
            StatefulShellBranch(
              navigatorKey: _chatsNavigatorKey,
              routes: [
                GoRoute(
                  path: '/main',
                  redirect: (context, state) {
                    if (state.matchedLocation == '/main') {
                      return '/main/chats';
                    }
                    return null;
                  },
                  routes: [
                    GoRoute(
                      path: 'chats',
                      builder: (context, state) => const ChatListScreen(),
                    ),
                  ],
                ),
              ],
            ),
            StatefulShellBranch(
              navigatorKey: _contactsNavigatorKey,
              routes: [
                GoRoute(
                  path: '/main/contacts',
                  builder: (context, state) => const ContactsScreen(),
                ),
              ],
            ),
            StatefulShellBranch(
              navigatorKey: _callsNavigatorKey,
              routes: [
                GoRoute(
                  path: '/main/calls',
                  builder: (context, state) => const CallsScreen(),
                ),
              ],
            ),
            StatefulShellBranch(
              navigatorKey: _settingsNavigatorKey,
              routes: [
                GoRoute(
                  path: '/main/settings',
                  builder: (context, state) => const SettingsScreen(),
                ),
              ],
            ),
          ],
        ),
      ],
    );
  }
}

