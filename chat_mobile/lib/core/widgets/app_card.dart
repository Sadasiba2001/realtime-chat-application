import 'package:flutter/material.dart';
import '../../app/theme/app_radius.dart';
import '../../app/theme/app_spacing.dart';
import '../../app/theme/app_theme_extension.dart';

enum AppCardVariant { surface, elevated, outlined }

/// Surface container card with subtle borders and elevation variants.
class AppCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final EdgeInsetsGeometry? margin;
  final AppCardVariant variant;
  final VoidCallback? onTap;
  final BorderRadius? borderRadius;
  final Color? customBackgroundColor;

  const AppCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(AppSpacing.s16),
    this.margin,
    this.variant = AppCardVariant.surface,
    this.onTap,
    this.borderRadius,
    this.customBackgroundColor,
  });

  const AppCard.elevated({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(AppSpacing.s16),
    this.margin,
    this.onTap,
    this.borderRadius,
    this.customBackgroundColor,
  }) : variant = AppCardVariant.elevated;

  const AppCard.outlined({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(AppSpacing.s16),
    this.margin,
    this.onTap,
    this.borderRadius,
    this.customBackgroundColor,
  }) : variant = AppCardVariant.outlined;

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;
    final effectiveRadius = borderRadius ?? AppRadius.medium;

    Color bg;
    Border? border;
    List<BoxShadow>? shadows;

    switch (variant) {
      case AppCardVariant.surface:
        bg = customBackgroundColor ?? colors.surfacePrimary;
        border = Border.all(color: colors.borderSubtle, width: 1);
        break;
      case AppCardVariant.elevated:
        bg = customBackgroundColor ?? colors.surfaceElevated;
        border = Border.all(color: colors.borderSubtle, width: 1);
        shadows = [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ];
        break;
      case AppCardVariant.outlined:
        bg = customBackgroundColor ?? Colors.transparent;
        border = Border.all(color: colors.borderDefault, width: 1);
        break;
    }

    Widget content = Container(
      margin: margin,
      decoration: BoxDecoration(
        color: bg,
        borderRadius: effectiveRadius,
        border: border,
        boxShadow: shadows,
      ),
      child: Padding(
        padding: padding,
        child: child,
      ),
    );

    if (onTap != null) {
      return Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: effectiveRadius,
          child: content,
        ),
      );
    }

    return content;
  }
}
