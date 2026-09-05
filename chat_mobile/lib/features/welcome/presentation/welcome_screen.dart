import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme/app_radius.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_theme_extension.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/sb_icons.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_scaffold.dart';

/// Premium SB Chat welcome screen with ambient glow and animated hero entry.
class WelcomeScreen extends StatefulWidget {
  const WelcomeScreen({super.key});

  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _animController;
  late final Animation<double> _fadeAnim;
  late final Animation<double> _scaleAnim;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );
    _fadeAnim = CurvedAnimation(
      parent: _animController,
      curve: Curves.easeOutCubic,
    );
    _scaleAnim = Tween<double>(begin: 0.92, end: 1.0).animate(
      CurvedAnimation(
        parent: _animController,
        curve: Curves.easeOutCubic,
      ),
    );
    _animController.forward();
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;

    return AppScaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s24),
          child: FadeTransition(
            opacity: _fadeAnim,
            child: ScaleTransition(
              scale: _scaleAnim,
              child: Column(
                children: [
                  const Spacer(flex: 3),

                  // SB Chat Logo with ambient glow
                  Center(
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        // Ambient purple glow
                        Container(
                          width: 160,
                          height: 160,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: colors.glowGradient,
                          ),
                        ),
                        // Logo Card Container
                        Container(
                          width: 96,
                          height: 96,
                          decoration: BoxDecoration(
                            borderRadius: AppRadius.extraLarge,
                            border: Border.all(
                              color: colors.borderDefault,
                              width: 1.2,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: colors.brandPrimary.withValues(alpha: 0.35),
                                blurRadius: 32,
                                offset: const Offset(0, 12),
                              ),
                            ],
                          ),
                          child: ClipRRect(
                            borderRadius: AppRadius.extraLarge,
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
                                  size: 48,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: AppSpacing.s32),

                  // Brand name pill
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
                    decoration: BoxDecoration(
                      color: colors.brandPrimary.withValues(alpha: 0.12),
                      borderRadius: AppRadius.pill,
                      border: Border.all(
                        color: colors.brandPrimary.withValues(alpha: 0.3),
                        width: 1,
                      ),
                    ),
                    child: Text(
                      'SB CHAT',
                      style: AppTypography.caption.copyWith(
                        color: colors.brandPrimary,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.5,
                      ),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.s16),

                  // Headline tagline
                  Text(
                    AppConstants.appTagline,
                    style: AppTypography.display.copyWith(
                      color: colors.textPrimary,
                      fontWeight: FontWeight.w800,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: AppSpacing.s12),

                  // Supporting copy
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s8),
                    child: Text(
                      'Next-generation private messaging and crystal-clear voice communication designed for speed, security, and elegance.',
                      style: AppTypography.body.copyWith(
                        color: colors.textSecondary,
                        height: 1.5,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),

                  const Spacer(flex: 4),

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

                  // Security footnote
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        SBIcons.lock,
                        size: 14,
                        color: colors.textTertiary,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'End-to-end encrypted • Zero telemetry logging',
                        style: AppTypography.caption.copyWith(
                          color: colors.textTertiary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.s16),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
