import 'package:flutter/material.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_theme_extension.dart';
import '../../../app/theme/app_typography.dart';
import '../../../core/widgets/app_scaffold.dart';
import 'widgets/settings_body.dart';

/// Screen displaying user settings, profile, appearance options, and theme toggle.
class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;

    return AppScaffold(
      safeAreaTop: true,
      safeAreaBottom: false,
      backgroundColor: colors.backgroundPrimary,
      header: Container(
        color: colors.backgroundPrimary,
        padding: const EdgeInsets.fromLTRB(
          AppSpacing.s16,
          AppSpacing.s12,
          AppSpacing.s16,
          AppSpacing.s12,
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                'Settings',
                style: AppTypography.headlineLarge.copyWith(
                  color: colors.textPrimary,
                  fontWeight: FontWeight.w700,
                  fontSize: 25,
                ),
              ),
            ),
          ],
        ),
      ),
      body: const SettingsBody(),
    );
  }
}
