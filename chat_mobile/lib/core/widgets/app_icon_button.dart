import 'package:flutter/material.dart';
import '../../app/theme/app_radius.dart';
import '../../app/theme/app_spacing.dart';
import '../../app/theme/app_theme_extension.dart';

enum AppIconButtonVariant { standard, filled, filledTonal, outlined }

/// Accessible icon button adhering to minimum touch target constraints.
class AppIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onPressed;
  final String? tooltip;
  final AppIconButtonVariant variant;
  final Color? color;
  final Color? backgroundColor;
  final double size;
  final double iconSize;

  const AppIconButton({
    super.key,
    required this.icon,
    this.onPressed,
    this.tooltip,
    this.variant = AppIconButtonVariant.standard,
    this.color,
    this.backgroundColor,
    this.size = AppSpacing.minTouchTarget,
    this.iconSize = 22.0,
  });

  const AppIconButton.filled({
    super.key,
    required this.icon,
    this.onPressed,
    this.tooltip,
    this.color,
    this.backgroundColor,
    this.size = AppSpacing.minTouchTarget,
    this.iconSize = 22.0,
  }) : variant = AppIconButtonVariant.filled;

  const AppIconButton.tonal({
    super.key,
    required this.icon,
    this.onPressed,
    this.tooltip,
    this.color,
    this.backgroundColor,
    this.size = AppSpacing.minTouchTarget,
    this.iconSize = 22.0,
  }) : variant = AppIconButtonVariant.filledTonal;

  const AppIconButton.outlined({
    super.key,
    required this.icon,
    this.onPressed,
    this.tooltip,
    this.color,
    this.backgroundColor,
    this.size = AppSpacing.minTouchTarget,
    this.iconSize = 22.0,
  }) : variant = AppIconButtonVariant.outlined;

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;
    final isEnabled = onPressed != null;

    Color bg;
    Color fg;
    BorderSide borderSide = BorderSide.none;

    switch (variant) {
      case AppIconButtonVariant.standard:
        bg = backgroundColor ?? Colors.transparent;
        fg = color ?? (isEnabled ? colors.textPrimary : colors.textDisabled);
        break;
      case AppIconButtonVariant.filled:
        bg = backgroundColor ?? (isEnabled ? colors.brandPrimary : colors.brandSoft);
        fg = color ?? (isEnabled ? colors.textInverse : colors.textDisabled);
        break;
      case AppIconButtonVariant.filledTonal:
        bg = backgroundColor ?? (isEnabled ? colors.brandSoft : colors.backgroundSecondary);
        fg = color ?? (isEnabled ? colors.brandPrimary : colors.textDisabled);
        break;
      case AppIconButtonVariant.outlined:
        bg = backgroundColor ?? Colors.transparent;
        fg = color ?? (isEnabled ? colors.textPrimary : colors.textDisabled);
        borderSide = BorderSide(color: colors.borderDefault, width: 1);
        break;
    }

    Widget button = Material(
      color: bg,
      shape: RoundedRectangleBorder(
        borderRadius: AppRadius.medium,
        side: borderSide,
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: isEnabled ? onPressed : null,
        splashColor: colors.brandPrimary.withValues(alpha: 0.12),
        highlightColor: colors.brandPrimary.withValues(alpha: 0.06),
        child: SizedBox(
          width: size,
          height: size,
          child: Center(
            child: Icon(icon, size: iconSize, color: fg),
          ),
        ),
      ),
    );

    if (tooltip != null) {
      return Tooltip(
        message: tooltip!,
        child: button,
      );
    }

    return button;
  }
}
