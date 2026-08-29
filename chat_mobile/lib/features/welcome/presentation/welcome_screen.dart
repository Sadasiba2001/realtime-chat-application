import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_radius.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_theme_extension.dart';
import '../../../app/theme/app_typography.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_scaffold.dart';

/// Polished welcome screen serving as initial onboarding launchpad.
class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;

    return AppScaffold(
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s24),
        child: Column(
          children: [
            const Spacer(flex: 2),

            // Brand Logo container
            Container(
              width: 96,
              height: 96,
              decoration: BoxDecoration(
                borderRadius: AppRadius.large,
                boxShadow: [
                  BoxShadow(
                    color: AppColors.brandPrimary.withValues(alpha: 0.25),
                    blurRadius: 28,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: AppRadius.large,
                child: Image.asset(
                  AppConstants.logoPath,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) => Container(
                    color: colors.brandPrimary,
                    alignment: Alignment.center,
                    child: const Icon(
                      Icons.chat_bubble_rounded,
                      size: 48,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.s40),

            // Short headline
            Text(
              AppConstants.appTagline,
              style: AppTypography.display.copyWith(
                color: colors.textPrimary,
                fontSize: 28,
                fontWeight: FontWeight.w700,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppSpacing.s16),

            // Supporting description
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s12),
              child: Text(
                'Experience high-fidelity, real-time messaging with crystal clear voice calls and private encrypted channels.',
                style: AppTypography.bodyLarge.copyWith(
                  color: colors.textSecondary,
                  height: 1.5,
                ),
                textAlign: TextAlign.center,
              ),
            ),

            const Spacer(flex: 3),

            // Primary CTA -> Signup
            AppButton.primary(
              text: 'Get Started',
              isFullWidth: true,
              size: AppButtonSize.large,
              onPressed: () => context.push('/signup'),
            ),
            const SizedBox(height: AppSpacing.s12),

            // Secondary CTA -> Login
            AppButton.secondary(
              text: 'I already have an account',
              isFullWidth: true,
              size: AppButtonSize.large,
              onPressed: () => context.push('/login'),
            ),

            const SizedBox(height: AppSpacing.s24),

            Text(
              'End-to-end encrypted • Zero telemetry logging',
              style: AppTypography.caption.copyWith(
                color: colors.textTertiary,
              ),
            ),
            const SizedBox(height: AppSpacing.s16),
          ],
        ),
      ),
    );
  }
}
