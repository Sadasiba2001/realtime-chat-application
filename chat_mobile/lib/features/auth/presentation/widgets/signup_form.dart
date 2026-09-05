import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_radius.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_theme_extension.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/app_text.dart';
import '../../../../core/widgets/app_text_field.dart';
import '../controllers/auth_controller.dart';
import '../controllers/auth_state.dart';

/// Form widget handling user registration, multi-field validation, and submission.
class SignupForm extends StatefulWidget {
  final AuthController authController;
  final VoidCallback onNavigateToLogin;

  const SignupForm({
    super.key,
    required this.authController,
    required this.onNavigateToLogin,
  });

  @override
  State<SignupForm> createState() => _SignupFormState();
}

class _SignupFormState extends State<SignupForm> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _usernameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;

  String? _clientNameError;
  String? _clientUsernameError;
  String? _clientEmailError;
  String? _clientPasswordError;
  String? _clientConfirmPasswordError;

  @override
  void dispose() {
    _nameController.dispose();
    _usernameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _validateAndSubmit() {
    setState(() {
      _clientNameError = null;
      _clientUsernameError = null;
      _clientEmailError = null;
      _clientPasswordError = null;
      _clientConfirmPasswordError = null;
    });

    final name = _nameController.text.trim();
    final username = _usernameController.text.trim();
    final email = _emailController.text.trim();
    final phone = _phoneController.text.trim();
    final password = _passwordController.text;
    final confirmPassword = _confirmPasswordController.text;

    bool hasError = false;

    if (name.isEmpty) {
      _clientNameError = 'Full name is required.';
      hasError = true;
    }

    if (username.isEmpty) {
      _clientUsernameError = 'Username is required.';
      hasError = true;
    }

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
    } else if (password.length < 6) {
      _clientPasswordError = 'Password must be at least 6 characters.';
      hasError = true;
    }

    if (confirmPassword.isEmpty) {
      _clientConfirmPasswordError = 'Please confirm your password.';
      hasError = true;
    } else if (confirmPassword != password) {
      _clientConfirmPasswordError = 'Passwords do not match.';
      hasError = true;
    }

    if (hasError) {
      setState(() {});
      return;
    }

    widget.authController.register(
      name: name,
      username: username,
      email: email,
      phoneNumber: phone,
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

        final nameError = _clientNameError ?? fieldErrors?['name'];
        final usernameError = _clientUsernameError ?? fieldErrors?['username'];
        final emailError = _clientEmailError ?? fieldErrors?['email'];
        final passwordError = _clientPasswordError ?? fieldErrors?['password'];
        final confirmPasswordError = _clientConfirmPasswordError;

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
                    color: AppColors.errorSoft,
                    borderRadius: AppRadius.medium,
                    border: Border.all(color: AppColors.error.withValues(alpha: 0.4)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline_rounded, color: AppColors.error, size: 20),
                      const SizedBox(width: AppSpacing.s12),
                      Expanded(
                        child: Text(
                          serverError,
                          style: AppTypography.bodySmall.copyWith(
                            color: AppColors.error,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: AppSpacing.s16),
              ],

              // Full Name
              AppTextField(
                controller: _nameController,
                label: 'Full Name',
                hintText: 'John Doe',
                textInputAction: TextInputAction.next,
                errorText: nameError,
                prefix: Icon(Icons.person_outline_rounded, color: colors.textTertiary, size: 20),
                enabled: !isLoading,
                onChanged: (_) {
                  if (_clientNameError != null) setState(() => _clientNameError = null);
                },
              ),
              const SizedBox(height: AppSpacing.s16),

              // Username
              AppTextField(
                controller: _usernameController,
                label: 'Username',
                hintText: 'johndoe',
                textInputAction: TextInputAction.next,
                errorText: usernameError,
                prefix: Icon(Icons.alternate_email_rounded, color: colors.textTertiary, size: 20),
                enabled: !isLoading,
                onChanged: (_) {
                  if (_clientUsernameError != null) setState(() => _clientUsernameError = null);
                },
              ),
              const SizedBox(height: AppSpacing.s16),

              // Email
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

              // Phone Number (Optional)
              AppTextField(
                controller: _phoneController,
                label: 'Phone Number (Optional)',
                hintText: '+1 234 567 8900',
                keyboardType: TextInputType.phone,
                textInputAction: TextInputAction.next,
                prefix: Icon(Icons.phone_outlined, color: colors.textTertiary, size: 20),
                enabled: !isLoading,
              ),
              const SizedBox(height: AppSpacing.s16),

              // Password
              AppTextField(
                controller: _passwordController,
                label: 'Password',
                hintText: 'Minimum 6 characters',
                obscureText: _obscurePassword,
                textInputAction: TextInputAction.next,
                errorText: passwordError,
                prefix: Icon(Icons.lock_outline_rounded, color: colors.textTertiary, size: 20),
                suffix: IconButton(
                  icon: Icon(
                    _obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                    color: colors.textTertiary,
                    size: 20,
                  ),
                  onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                ),
                enabled: !isLoading,
                onChanged: (_) {
                  if (_clientPasswordError != null) setState(() => _clientPasswordError = null);
                },
              ),
              const SizedBox(height: AppSpacing.s16),

              // Confirm Password
              AppTextField(
                controller: _confirmPasswordController,
                label: 'Confirm Password',
                hintText: 'Re-enter your password',
                obscureText: _obscureConfirmPassword,
                textInputAction: TextInputAction.done,
                errorText: confirmPasswordError,
                prefix: Icon(Icons.lock_reset_rounded, color: colors.textTertiary, size: 20),
                suffix: IconButton(
                  icon: Icon(
                    _obscureConfirmPassword ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                    color: colors.textTertiary,
                    size: 20,
                  ),
                  onPressed: () => setState(() => _obscureConfirmPassword = !_obscureConfirmPassword),
                ),
                enabled: !isLoading,
                onSubmitted: (_) => _validateAndSubmit(),
                onChanged: (_) {
                  if (_clientConfirmPasswordError != null) {
                    setState(() => _clientConfirmPasswordError = null);
                  }
                },
              ),
              const SizedBox(height: AppSpacing.s24),

              // Sign Up Button
              AppButton.primary(
                text: 'Create Account',
                size: AppButtonSize.large,
                isFullWidth: true,
                isLoading: isLoading,
                onPressed: isLoading ? null : _validateAndSubmit,
              ),
              const SizedBox(height: AppSpacing.s24),

              // Navigation to Login
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  AppText.body(
                    'Already have an account? ',
                    colorVariant: AppTextColorVariant.secondary,
                  ),
                  GestureDetector(
                    onTap: isLoading ? null : widget.onNavigateToLogin,
                    child: Text(
                      'Log In',
                      style: AppTypography.labelLarge.copyWith(
                        color: AppColors.brandFocus,
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
