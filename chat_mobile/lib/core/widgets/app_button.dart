import 'package:flutter/material.dart';
import '../../app/theme/app_gradients.dart';
import '../../app/theme/app_radius.dart';
import '../../app/theme/app_shadows.dart';
import '../../app/theme/app_spacing.dart';
import '../../app/theme/app_theme_extension.dart';
import '../../app/theme/app_typography.dart';

enum _ButtonVariant { primary, secondary, tertiary, destructive }

enum AppButtonSize { small, medium, large }

/// Semantic, accessible action button with brand gradient, loading states, and full-width capabilities.
class AppButton extends StatefulWidget {
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

  @override
  State<AppButton> createState() => _AppButtonState();
}

class _AppButtonState extends State<AppButton> {
  bool _isPressed = false;

  double _getHeight() {
    switch (widget.size) {
      case AppButtonSize.small:
        return 40.0;
      case AppButtonSize.medium:
        return 50.0;
      case AppButtonSize.large:
        return 56.0;
    }
  }

  EdgeInsetsGeometry _getPadding() {
    switch (widget.size) {
      case AppButtonSize.small:
        return const EdgeInsets.symmetric(horizontal: AppSpacing.s16);
      case AppButtonSize.medium:
        return const EdgeInsets.symmetric(horizontal: AppSpacing.s20);
      case AppButtonSize.large:
        return const EdgeInsets.symmetric(horizontal: AppSpacing.s24);
    }
  }

  TextStyle _getTextStyle() {
    switch (widget.size) {
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
    final isEnabled = widget.onPressed != null && !widget.isLoading;

    Color? bg;
    Gradient? gradient;
    Color fg;
    BorderSide borderSide = BorderSide.none;
    List<BoxShadow>? shadows;

    switch (widget._variant) {
      case _ButtonVariant.primary:
        if (isEnabled) {
          gradient = AppGradients.purpleGradient;
          shadows = AppShadows.purpleGlow;
        } else {
          bg = colors.brandSoft;
        }
        fg = isEnabled ? Colors.white : colors.textDisabled;
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
      mainAxisSize: widget.isFullWidth ? MainAxisSize.max : MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (widget.isLoading) ...[
          SizedBox(
            width: 18,
            height: 18,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              valueColor: AlwaysStoppedAnimation<Color>(fg),
            ),
          ),
          const SizedBox(width: AppSpacing.s8),
        ] else if (widget.icon != null) ...[
          IconTheme(
            data: IconThemeData(color: fg, size: 18),
            child: widget.icon!,
          ),
          const SizedBox(width: AppSpacing.s8),
        ],
        Text(
          widget.text,
          style: _getTextStyle().copyWith(
            color: fg,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );

    final button = AnimatedScale(
      scale: _isPressed && isEnabled ? 0.98 : 1.0,
      duration: const Duration(milliseconds: 100),
      child: Container(
        height: _getHeight(),
        decoration: BoxDecoration(
          color: bg,
          gradient: gradient,
          borderRadius: AppRadius.medium,
          border: borderSide != BorderSide.none ? Border.fromBorderSide(borderSide) : null,
          boxShadow: shadows,
        ),
        child: Material(
          color: Colors.transparent,
          borderRadius: AppRadius.medium,
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: isEnabled ? widget.onPressed : null,
            onHighlightChanged: (pressed) => setState(() => _isPressed = pressed),
            splashColor: Colors.white.withValues(alpha: 0.15),
            highlightColor: Colors.white.withValues(alpha: 0.08),
            child: Padding(
              padding: _getPadding(),
              child: Center(
                widthFactor: widget.isFullWidth ? null : 1.0,
                child: content,
              ),
            ),
          ),
        ),
      ),
    );

    if (widget.isFullWidth) {
      return SizedBox(width: double.infinity, child: button);
    }
    return button;
  }
}

