import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:chat_mobile/app/app.dart';
import 'package:chat_mobile/app/router/app_router.dart';
import 'package:chat_mobile/features/auth/data/models/auth_user_model.dart';
import 'package:chat_mobile/features/auth/data/models/login_request_model.dart';
import 'package:chat_mobile/features/auth/data/models/register_request_model.dart';
import 'package:chat_mobile/features/auth/data/repositories/auth_repository.dart';
import 'package:chat_mobile/features/auth/presentation/controllers/auth_controller.dart';

class MockAppAuthRepo implements AuthRepository {
  bool isAuthenticatedState = false;

  @override
  Future<AuthUserModel> login(LoginRequestModel request) async {
    isAuthenticatedState = true;
    return const AuthUserModel(
      id: 1,
      name: 'Alexander Wright',
      username: 'alexwright',
      email: 'alex@example.com',
    );
  }

  @override
  Future<AuthUserModel> register(RegisterRequestModel request) async {
    isAuthenticatedState = true;
    return AuthUserModel(
      id: 2,
      name: request.name,
      username: request.username,
      email: request.email,
    );
  }

  @override
  Future<void> logout() async {
    isAuthenticatedState = false;
  }

  @override
  Future<AuthUserModel?> restoreSession() async {
    if (isAuthenticatedState) {
      return const AuthUserModel(
        id: 1,
        name: 'Alexander Wright',
        username: 'alexwright',
        email: 'alex@example.com',
      );
    }
    return null;
  }

  @override
  Future<bool> isAuthenticated() async => isAuthenticatedState;
}

void main() {
  late MockAppAuthRepo mockAuthRepo;
  late AuthController mockAuthController;

  setUp(() {
    mockAuthRepo = MockAppAuthRepo();
    mockAuthController = AuthController(repository: mockAuthRepo);
    AppRouter.setAuthController(mockAuthController);
    ChatApp.setThemeMode(ThemeMode.system);
  });

  testWidgets('App launches and displays Welcome screen with CTAs', (WidgetTester tester) async {
    AppRouter.router.go('/welcome');
    await tester.pumpWidget(const ChatApp());
    await tester.pumpAndSettle();

    expect(find.text('Connect. Chat. Stay close.'), findsOneWidget);
    expect(find.text('Get Started'), findsOneWidget);
    expect(find.text('I already have an account'), findsOneWidget);
  });

  testWidgets('Tapping Get Started navigates to Signup and I already have an account navigates to Login', (WidgetTester tester) async {
    AppRouter.router.go('/welcome');
    await tester.pumpWidget(const ChatApp());
    await tester.pumpAndSettle();

    // Tap I already have an account -> Login
    await tester.tap(find.text('I already have an account'));
    await tester.pumpAndSettle();

    expect(find.text('Welcome Back'), findsOneWidget);
    expect(find.text('Email'), findsOneWidget);
    expect(find.text('Password'), findsOneWidget);

    // Tap Sign Up link -> Signup
    await tester.tap(find.text('Sign Up'));
    await tester.pumpAndSettle();

    expect(find.text('Create Account'), findsWidgets);
    expect(find.text('Full Name'), findsOneWidget);
  });

  testWidgets('Logging in navigates to main shell and renders Chat list', (WidgetTester tester) async {
    AppRouter.router.go('/welcome');
    await tester.pumpWidget(const ChatApp());
    await tester.pumpAndSettle();

    // Go to login
    await tester.tap(find.text('I already have an account'));
    await tester.pumpAndSettle();

    // Enter credentials
    await tester.enterText(find.byType(TextField).at(0), 'alex@example.com');
    await tester.enterText(find.byType(TextField).at(1), 'password123');

    // Submit
    await tester.tap(find.text('Log In').first, warnIfMissed: false);
    await tester.pumpAndSettle();

    // Verify Chats header & conversations render
    expect(find.text('SB Chats'), findsOneWidget);
    expect(find.text('Elena Rostova'), findsOneWidget);
    expect(find.text('Marcus Chen'), findsOneWidget);
  });

  testWidgets('Bottom navigation switches tabs cleanly when authenticated', (WidgetTester tester) async {
    mockAuthRepo.isAuthenticatedState = true;
    await mockAuthController.checkAuthStatus();
    AppRouter.router.go('/main/chats');

    await tester.pumpWidget(const ChatApp());
    await tester.pumpAndSettle();

    // Switch to Calls tab
    await tester.tap(find.text('Calls'));
    await tester.pumpAndSettle();
    expect(find.text('Calls'), findsWidgets);

    // Switch to Contacts tab
    await tester.tap(find.text('Contacts'));
    await tester.pumpAndSettle();
    expect(find.text('Contacts'), findsWidgets);

    // Switch to Settings tab
    await tester.tap(find.text('Settings'));
    await tester.pumpAndSettle();
    expect(find.text('Settings'), findsWidgets);
    expect(find.text('Alexander Wright'), findsOneWidget);
  });

  testWidgets('Theme mode switcher allows independent selection across all three modes', (WidgetTester tester) async {
    mockAuthRepo.isAuthenticatedState = true;
    await mockAuthController.checkAuthStatus();
    AppRouter.router.go('/main/chats');

    await tester.pumpWidget(const ChatApp());
    await tester.pumpAndSettle();

    // Tap Settings in bottom navbar
    await tester.tap(find.text('Settings'));
    await tester.pumpAndSettle();

    // 1. Initial is System
    expect(ChatApp.themeModeNotifier.value, ThemeMode.system);

    // 2. Directly select Dark Theme from System Default
    await tester.tap(find.text('Dark Theme (#252330)'));
    await tester.pumpAndSettle();
    expect(ChatApp.themeModeNotifier.value, ThemeMode.dark);

    // 3. Select Light Theme from Dark Theme
    await tester.tap(find.text('Light Theme'));
    await tester.pumpAndSettle();
    expect(ChatApp.themeModeNotifier.value, ThemeMode.light);

    // 4. Select Dark Theme from Light Theme
    await tester.tap(find.text('Dark Theme (#252330)'));
    await tester.pumpAndSettle();
    expect(ChatApp.themeModeNotifier.value, ThemeMode.dark);

    // 5. Select System Default from Dark Theme
    await tester.tap(find.text('System Default'));
    await tester.pumpAndSettle();
    expect(ChatApp.themeModeNotifier.value, ThemeMode.system);
  });
}
