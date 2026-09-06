import 'package:flutter/material.dart';
import '../../app/theme/app_spacing.dart';
import '../../app/theme/app_theme_extension.dart';
import '../../app/theme/app_typography.dart';

/// Clean, semantic loading indicator with optional label.
class AppLoading extends StatelessWidget {
  final double size;
  final double strokeWidth;
  final String? message;
  final Color? color;

  const AppLoading({
    super.key,
    this.size = 32.0,
    this.strokeWidth = 3.0,
    this.message,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;
    final effectiveColor = color ?? colors.brandPrimary;

    Widget indicator = SizedBox(
      width: size,
      height: size,
      child: CircularProgressIndicator(
        strokeWidth: strokeWidth,
        valueColor: AlwaysStoppedAnimation<Color>(effectiveColor),
      ),
    );

    if (message != null) {
      return Column(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          indicator,
          const SizedBox(height: AppSpacing.s16),
          Text(
            message!,
            style: AppTypography.bodySmall.copyWith(
              color: colors.textSecondary,
            ),
          ),
        ],
      );
    }

    return Center(child: indicator);
  }
}
