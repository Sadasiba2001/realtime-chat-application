import 'package:flutter/material.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_theme_extension.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/sb_icons.dart';
import '../../../core/widgets/app_icon_button.dart';
import '../../../core/widgets/app_scaffold.dart';
import 'widgets/calls_body.dart';

/// Screen displaying recent call history and quick call actions.
class CallsScreen extends StatelessWidget {
  const CallsScreen({super.key});

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
                'Calls',
                style: AppTypography.headlineLarge.copyWith(
                  color: colors.textPrimary,
                  fontWeight: FontWeight.w700,
                  fontSize: 25,
                ),
              ),
            ),
            AppIconButton(
              icon: SBIcons.newCall,
              iconSize: 20,
              tooltip: 'New Call',
              color: colors.brandPrimary,
              onPressed: () {},
            ),
          ],
        ),
      ),
      body: const CallsBody(),
    );
  }
}
