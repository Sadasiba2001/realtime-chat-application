import 'package:flutter/material.dart';
import '../../../../app/theme/app_radius.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_theme_extension.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../app/theme/sb_icons.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/app_text.dart';
import '../../../../core/widgets/app_text_field.dart';
import '../controllers/auth_controller.dart';
import '../controllers/auth_state.dart';

/// Form widget handling login credentials input, client/server validation, and submission.
class LoginForm extends StatefulWidget {
  final AuthController authController;
  final VoidCallback onNavigateToSignup;

  const LoginForm({
    super.key,
    required this.authController,
    required this.onNavigateToSignup,
  });

  @override
  State<LoginForm> createState() => _LoginFormState();
}

class _LoginFormState extends State<LoginForm> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _obscurePassword = true;
  String? _clientEmailError;
  String? _clientPasswordError;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _validateAndSubmit() {
    setState(() {
      _clientEmailError = null;
      _clientPasswordError = null;
    });

    final email = _emailController.text.trim();
    final password = _passwordController.text;

    bool hasError = false;

    if (email.isEmpty) {
      _clientEmailError = 'Email is required.';
      hasError = true;
    } else if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(email)) {
      _clientEmailError = 'Please enter a valid email address.';
      hasError = true;
    }

    if (password.isEmpty) {
      _clientPasswordError = 'Password is required.';
      hasError = true;
    }

    if (hasError) {
      setState(() {});
      return;
    }

    widget.authController.login(
      email: email,
      password: password,
    );
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;

    return ListenableBuilder(
      listenable: widget.authController,
      builder: (context, _) {
        final state = widget.authController.state;
        final isLoading = state is AuthLoading;

        String? serverError;
        Map<String, String>? fieldErrors;
        if (state is AuthFailure) {
          serverError = state.message;
          fieldErrors = state.fieldErrors;
        }

        final emailError = _clientEmailError ?? fieldErrors?['email'];
        final passwordError = _clientPasswordError ?? fieldErrors?['password'];

        return Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Server Error Alert Banner
              if (serverError != null && serverError.isNotEmpty && fieldErrors == null) ...[
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.s16,
                    vertical: AppSpacing.s12,
                  ),
                  decoration: BoxDecoration(
                    color: colors.errorSoft,
                    borderRadius: AppRadius.medium,
                    border: Border.all(color: colors.error.withValues(alpha: 0.4)),
                  ),
                  child: Row(
                    children: [
                      Icon(SBIcons.error, color: colors.error, size: 20),
                      const SizedBox(width: AppSpacing.s12),
                      Expanded(
                        child: Text(
                          serverError,
                          style: AppTypography.bodySmall.copyWith(
                            color: colors.error,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: AppSpacing.s16),
              ],

              // Email Field
              AppTextField(
                controller: _emailController,
                label: 'Email',
                hintText: 'name@example.com',
                keyboardType: TextInputType.emailAddress,
                textInputAction: TextInputAction.next,
                errorText: emailError,
                prefix: Icon(Icons.mail_outline_rounded, color: colors.textTertiary, size: 20),
                enabled: !isLoading,
                onChanged: (_) {
                  if (_clientEmailError != null) setState(() => _clientEmailError = null);
                },
              ),
              const SizedBox(height: AppSpacing.s16),

              // Password Field
              AppTextField(
                controller: _passwordController,
                label: 'Password',
                hintText: 'Enter your password',
                obscureText: _obscurePassword,
                textInputAction: TextInputAction.done,
                errorText: passwordError,
                prefix: Icon(SBIcons.lock, color: colors.textTertiary, size: 20),
                suffix: IconButton(
                  icon: Icon(
                    _obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                    color: colors.textTertiary,
                    size: 20,
                  ),
                  onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                ),
                enabled: !isLoading,
                onSubmitted: (_) => _validateAndSubmit(),
                onChanged: (_) {
                  if (_clientPasswordError != null) setState(() => _clientPasswordError = null);
                },
              ),
              const SizedBox(height: AppSpacing.s24),

              // Login Button
              AppButton.primary(
                text: 'Log In',
                size: AppButtonSize.large,
                isFullWidth: true,
                isLoading: isLoading,
                onPressed: isLoading ? null : _validateAndSubmit,
              ),
              const SizedBox(height: AppSpacing.s24),

              // Navigation to Signup
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  AppText.body(
                    "Don't have an account? ",
                    colorVariant: AppTextColorVariant.secondary,
                  ),
                  GestureDetector(
                    onTap: isLoading ? null : widget.onNavigateToSignup,
                    child: Text(
                      'Sign Up',
                      style: AppTypography.labelLarge.copyWith(
                        color: colors.brandPrimary,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}
