import 'package:flutter/material.dart';
import '../../app/theme/app_radius.dart';
import '../../app/theme/app_spacing.dart';
import '../../app/theme/app_theme_extension.dart';
import '../../app/theme/app_typography.dart';

enum _ButtonVariant { primary, secondary, tertiary, destructive }

enum AppButtonSize { small, medium, large }

/// Semantic, accessible action button with loading and full-width capabilities.
class AppButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final _ButtonVariant _variant;
  final AppButtonSize size;
  final Widget? icon;
  final bool isLoading;
  final bool isFullWidth;

  const AppButton.primary({
    super.key,
    required this.text,
    this.onPressed,
    this.size = AppButtonSize.medium,
    this.icon,
    this.isLoading = false,
    this.isFullWidth = false,
  }) : _variant = _ButtonVariant.primary;

  const AppButton.secondary({
    super.key,
    required this.text,
    this.onPressed,
    this.size = AppButtonSize.medium,
    this.icon,
    this.isLoading = false,
    this.isFullWidth = false,
  }) : _variant = _ButtonVariant.secondary;

  const AppButton.tertiary({
    super.key,
    required this.text,
    this.onPressed,
    this.size = AppButtonSize.medium,
    this.icon,
    this.isLoading = false,
    this.isFullWidth = false,
  }) : _variant = _ButtonVariant.tertiary;

  const AppButton.destructive({
    super.key,
    required this.text,
    this.onPressed,
    this.size = AppButtonSize.medium,
    this.icon,
    this.isLoading = false,
    this.isFullWidth = false,
  }) : _variant = _ButtonVariant.destructive;

  double _getHeight() {
    switch (size) {
      case AppButtonSize.small:
        return 38.0;
      case AppButtonSize.medium:
        return 48.0; // Meets touch target guidelines
      case AppButtonSize.large:
        return 56.0;
    }
  }

  EdgeInsetsGeometry _getPadding() {
    switch (size) {
      case AppButtonSize.small:
        return const EdgeInsets.symmetric(horizontal: AppSpacing.s12);
      case AppButtonSize.medium:
        return const EdgeInsets.symmetric(horizontal: AppSpacing.s20);
      case AppButtonSize.large:
        return const EdgeInsets.symmetric(horizontal: AppSpacing.s24);
    }
  }

  TextStyle _getTextStyle() {
    switch (size) {
      case AppButtonSize.small:
        return AppTypography.label;
      case AppButtonSize.medium:
        return AppTypography.labelLarge;
      case AppButtonSize.large:
        return AppTypography.headlineSmall.copyWith(fontSize: 16);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;
    final isEnabled = onPressed != null && !isLoading;

    Color bg;
    Color fg;
    BorderSide borderSide = BorderSide.none;

    switch (_variant) {
      case _ButtonVariant.primary:
        bg = isEnabled ? colors.brandPrimary : colors.brandSoft;
        fg = isEnabled ? colors.textInverse : colors.textDisabled;
        break;
      case _ButtonVariant.secondary:
        bg = isEnabled ? colors.surfaceSecondary : colors.backgroundSecondary;
        fg = isEnabled ? colors.textPrimary : colors.textDisabled;
        borderSide = BorderSide(color: colors.borderDefault, width: 1);
        break;
      case _ButtonVariant.tertiary:
        bg = Colors.transparent;
        fg = isEnabled ? colors.brandPrimary : colors.textDisabled;
        break;
      case _ButtonVariant.destructive:
        bg = isEnabled ? colors.error : colors.errorSoft;
        fg = isEnabled ? Colors.white : colors.textDisabled;
        break;
    }

    Widget content = Row(
      mainAxisSize: isFullWidth ? MainAxisSize.max : MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (isLoading) ...[
          SizedBox(
            width: 18,
            height: 18,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              valueColor: AlwaysStoppedAnimation<Color>(fg),
            ),
          ),
          const SizedBox(width: AppSpacing.s8),
        ] else if (icon != null) ...[
          IconTheme(
            data: IconThemeData(color: fg, size: 18),
            child: icon!,
          ),
          const SizedBox(width: AppSpacing.s8),
        ],
        Text(
          text,
          style: _getTextStyle().copyWith(color: fg),
        ),
      ],
    );

    final button = Material(
      color: bg,
      shape: RoundedRectangleBorder(
        borderRadius: AppRadius.medium,
        side: borderSide,
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: isEnabled ? onPressed : null,
        splashColor: colors.brandPressed.withValues(alpha: 0.15),
        highlightColor: colors.brandPressed.withValues(alpha: 0.08),
        child: Container(
          height: _getHeight(),
          padding: _getPadding(),
          alignment: Alignment.center,
          child: content,
        ),
      ),
    );

    if (isFullWidth) {
      return SizedBox(width: double.infinity, child: button);
    }
    return button;
  }
}
