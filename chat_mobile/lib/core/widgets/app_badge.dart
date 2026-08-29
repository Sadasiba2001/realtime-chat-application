import 'package:flutter/material.dart';
import '../../app/theme/app_radius.dart';
import '../../app/theme/app_theme_extension.dart';
import '../../app/theme/app_typography.dart';

enum AppBadgeVariant { brand, neutral, success, error, warning }

/// Compact badge indicator for unread counters and status chips.
class AppBadge extends StatelessWidget {
  final String? label;
  final int? count;
  final AppBadgeVariant variant;
  final bool isDot;

  const AppBadge({
    super.key,
    this.label,
    this.count,
    this.variant = AppBadgeVariant.brand,
    this.isDot = false,
  });

  const AppBadge.count(
    this.count, {
    super.key,
    this.variant = AppBadgeVariant.brand,
  })  : label = null,
        isDot = false;

  const AppBadge.dot({
    super.key,
    this.variant = AppBadgeVariant.brand,
  })  : label = null,
        count = null,
        isDot = true;

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;

    Color bg;
    Color fg;

    switch (variant) {
      case AppBadgeVariant.brand:
        bg = colors.brandPrimary;
        fg = colors.textInverse;
        break;
      case AppBadgeVariant.neutral:
        bg = colors.surfaceSecondary;
        fg = colors.textSecondary;
        break;
      case AppBadgeVariant.success:
        bg = colors.success;
        fg = Colors.white;
        break;
      case AppBadgeVariant.error:
        bg = colors.error;
        fg = Colors.white;
        break;
      case AppBadgeVariant.warning:
        bg = colors.warning;
        fg = Colors.white;
        break;
    }

    if (isDot) {
      return Container(
        width: 8,
        height: 8,
        decoration: BoxDecoration(
          color: bg,
          shape: BoxShape.circle,
        ),
      );
    }

    final displayText = count != null
        ? (count! > 99 ? '99+' : count.toString())
        : (label ?? '');

    if (displayText.isEmpty) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: AppRadius.pill,
      ),
      alignment: Alignment.center,
      child: Text(
        displayText,
        style: AppTypography.caption.copyWith(
          color: fg,
          fontSize: 10,
          fontWeight: FontWeight.w700,
          height: 1.1,
        ),
      ),
    );
  }
}
