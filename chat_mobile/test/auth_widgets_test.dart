import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:chat_mobile/core/network/api_exception.dart';
import 'package:chat_mobile/features/auth/data/models/auth_user_model.dart';
import 'package:chat_mobile/features/auth/data/models/login_request_model.dart';
import 'package:chat_mobile/features/auth/data/models/register_request_model.dart';
import 'package:chat_mobile/features/auth/data/repositories/auth_repository.dart';
import 'package:chat_mobile/features/auth/presentation/controllers/auth_controller.dart';
import 'package:chat_mobile/features/auth/presentation/screens/login_screen.dart';
import 'package:chat_mobile/features/auth/presentation/screens/signup_screen.dart';

class MockTestAuthRepo implements AuthRepository {
  bool failNextLogin = false;
  bool failNextRegister = false;
  ApiException? errorToReturn;

  @override
  Future<AuthUserModel> login(LoginRequestModel request) async {
    if (failNextLogin) {
      throw errorToReturn ?? const ApiException(message: 'Invalid email or password.', statusCode: 400);
    }
    return const AuthUserModel(
      id: 1,
      name: 'Test Account',
      username: 'testaccount',
      email: 'test@example.com',
    );
  }

  @override
  Future<AuthUserModel> register(RegisterRequestModel request) async {
    if (failNextRegister) {
      throw errorToReturn ??
          const ApiException(
            message: 'Registration failed.',
            statusCode: 400,
            fieldErrors: {'email': 'A user with this email already exists.'},
          );
    }
    return AuthUserModel(
      id: 2,
      name: request.name,
      username: request.username,
      email: request.email,
    );
  }

  @override
  Future<void> logout() async {}

  @override
  Future<AuthUserModel?> restoreSession() async => null;

  @override
  Future<bool> isAuthenticated() async => false;
}

void main() {
  late MockTestAuthRepo mockRepo;
  late AuthController authController;

  setUp(() {
    mockRepo = MockTestAuthRepo();
    authController = AuthController(repository: mockRepo);
  });

  Widget buildTestApp(Widget child) {
    return MaterialApp(
      home: child,
    );
  }

  group('LoginScreen & LoginForm UI Tests', () {
    testWidgets('Renders all login fields and submit button', (WidgetTester tester) async {
      await tester.pumpWidget(buildTestApp(LoginScreen(authController: authController)));

      expect(find.text('Welcome Back'), findsOneWidget);
      expect(find.text('Email'), findsOneWidget);
      expect(find.text('Password'), findsOneWidget);
      expect(find.text('Log In'), findsWidgets);
      expect(find.text('Sign Up'), findsOneWidget);
    });

    testWidgets('Client validation shows error when submitting empty fields', (WidgetTester tester) async {
      await tester.pumpWidget(buildTestApp(LoginScreen(authController: authController)));

      // Tap Log In without filling anything
      final loginBtn = find.text('Log In').first;
      await tester.ensureVisible(loginBtn);
      await tester.tap(loginBtn);
      await tester.pump();

      expect(find.text('Email is required.'), findsOneWidget);
    });

    testWidgets('Client validation shows error for invalid email format', (WidgetTester tester) async {
      await tester.pumpWidget(buildTestApp(LoginScreen(authController: authController)));

      // Enter invalid email
      await tester.enterText(find.byType(TextField).first, 'invalid-email');
      await tester.enterText(find.byType(TextField).last, 'password123');

      // Submit
      final loginBtn = find.text('Log In').first;
      await tester.ensureVisible(loginBtn);
      await tester.tap(loginBtn);
      await tester.pump();

      expect(find.text('Please enter a valid email address.'), findsOneWidget);
    });

    testWidgets('Displays backend error message on invalid credentials', (WidgetTester tester) async {
      mockRepo.failNextLogin = true;
      mockRepo.errorToReturn = const ApiException(
        message: 'Invalid email or password.',
        statusCode: 400,
      );

      await tester.pumpWidget(buildTestApp(LoginScreen(authController: authController)));

      await tester.enterText(find.byType(TextField).first, 'valid@example.com');
      await tester.enterText(find.byType(TextField).last, 'wrongpass');

      // Submit
      final loginBtn = find.text('Log In').first;
      await tester.ensureVisible(loginBtn);
      await tester.tap(loginBtn);
      await tester.pumpAndSettle();

      expect(find.text('Invalid email or password.'), findsOneWidget);
    });
  });

  group('SignupScreen & SignupForm UI Tests', () {
    testWidgets('Renders all registration fields', (WidgetTester tester) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(buildTestApp(SignupScreen(authController: authController)));

      expect(find.text('Create Account'), findsNWidgets(2)); // Title & Button
      expect(find.text('Full Name'), findsOneWidget);
      expect(find.text('Username'), findsOneWidget);
      expect(find.text('Email'), findsOneWidget);
      expect(find.text('Phone Number (Optional)'), findsOneWidget);
      expect(find.text('Password'), findsOneWidget);
      expect(find.text('Confirm Password'), findsOneWidget);
    });

    testWidgets('Client validation verifies password match', (WidgetTester tester) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(buildTestApp(SignupScreen(authController: authController)));

      final textFields = find.byType(TextField);
      await tester.enterText(textFields.at(0), 'John Doe'); // Name
      await tester.enterText(textFields.at(1), 'johndoe'); // Username
      await tester.enterText(textFields.at(2), 'john@example.com'); // Email
      await tester.enterText(textFields.at(3), '1234567890'); // Phone
      await tester.enterText(textFields.at(4), 'password123'); // Password
      await tester.enterText(textFields.at(5), 'mismatch456'); // Confirm Password

      final createAccountBtn = find.text('Create Account').last;
      await tester.ensureVisible(createAccountBtn);
      await tester.tap(createAccountBtn);
      await tester.pump();

      expect(find.text('Passwords do not match.'), findsOneWidget);
    });

    testWidgets('Client validation requires min 6 character password', (WidgetTester tester) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      await tester.pumpWidget(buildTestApp(SignupScreen(authController: authController)));

      final textFields = find.byType(TextField);
      await tester.enterText(textFields.at(0), 'John Doe');
      await tester.enterText(textFields.at(1), 'johndoe');
      await tester.enterText(textFields.at(2), 'john@example.com');
      await tester.enterText(textFields.at(4), '123');
      await tester.enterText(textFields.at(5), '123');

      final createAccountBtn = find.text('Create Account').last;
      await tester.ensureVisible(createAccountBtn);
      await tester.tap(createAccountBtn);
      await tester.pump();

      expect(find.text('Password must be at least 6 characters.'), findsOneWidget);
    });

    testWidgets('Displays server field error returned by Django', (WidgetTester tester) async {
      tester.view.physicalSize = const Size(800, 1600);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      mockRepo.failNextRegister = true;
      mockRepo.errorToReturn = const ApiException(
        message: 'Please review the errors below.',
        statusCode: 400,
        fieldErrors: {'email': 'A user with this email already exists.'},
      );

      await tester.pumpWidget(buildTestApp(SignupScreen(authController: authController)));

      final textFields = find.byType(TextField);
      await tester.enterText(textFields.at(0), 'John Doe');
      await tester.enterText(textFields.at(1), 'johndoe');
      await tester.enterText(textFields.at(2), 'existing@example.com');
      await tester.enterText(textFields.at(4), 'password123');
      await tester.enterText(textFields.at(5), 'password123');

      final createAccountBtn = find.text('Create Account').last;
      await tester.ensureVisible(createAccountBtn);
      await tester.tap(createAccountBtn);
      await tester.pumpAndSettle();

      expect(find.text('A user with this email already exists.'), findsOneWidget);
    });
  });
}
