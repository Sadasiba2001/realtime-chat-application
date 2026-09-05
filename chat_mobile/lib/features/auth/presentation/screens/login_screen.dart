import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/theme/app_radius.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_theme_extension.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../app/theme/sb_icons.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/widgets/app_scaffold.dart';
import '../controllers/auth_controller.dart';
import '../widgets/login_form.dart';

/// Full login screen matching the SB Chat authentication visual identity.
class LoginScreen extends StatelessWidget {
  final AuthController authController;

  const LoginScreen({
    super.key,
    required this.authController,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;

    return AppScaffold(
      safeAreaTop: true,
      safeAreaBottom: true,
      body: SingleChildScrollView(
        keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: AppSpacing.s48),

            // Logo & Ambient Glow Header
            Center(
              child: Stack(
                alignment: Alignment.center,
                children: [
                  Container(
                    width: 120,
                    height: 120,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: colors.glowGradient,
                    ),
                  ),
                  Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      borderRadius: AppRadius.large,
                      border: Border.all(
                        color: colors.borderDefault,
                        width: 1.2,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: colors.brandPrimary.withValues(alpha: 0.3),
                          blurRadius: 24,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: AppRadius.large,
                      child: Image.asset(
                        AppConstants.logoPath,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) => Container(
                          decoration: BoxDecoration(
                            gradient: colors.brandGradient,
                          ),
                          alignment: Alignment.center,
                          child: const Icon(
                            SBIcons.chatsFilled,
                            size: 36,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.s24),

            Text(
              'Welcome Back',
              style: AppTypography.display.copyWith(
                color: colors.textPrimary,
                fontSize: 26,
                fontWeight: FontWeight.w800,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppSpacing.s8),

            Text(
              'Sign in to continue to SB Chat',
              style: AppTypography.body.copyWith(
                color: colors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppSpacing.s32),

            // Login Form
            LoginForm(
              authController: authController,
              onNavigateToSignup: () {
                authController.clearError();
                context.push('/signup');
              },
            ),
            const SizedBox(height: AppSpacing.s32),
          ],
        ),
      ),
    );
  }
}
