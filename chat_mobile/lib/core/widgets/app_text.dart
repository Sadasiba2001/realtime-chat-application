import 'package:flutter/material.dart';
import '../../app/theme/app_theme_extension.dart';
import '../../app/theme/app_typography.dart';

enum AppTextStyleVariant {
  display,
  headlineLarge,
  headlineMedium,
  headlineSmall,
  bodyLarge,
  body,
  bodySmall,
  labelLarge,
  label,
  caption,
}

enum AppTextColorVariant {
  primary,
  secondary,
  tertiary,
  disabled,
  inverse,
  brand,
  success,
  warning,
  error,
}

/// Semantic typography component ensuring text style consistency across screens.
class AppText extends StatelessWidget {
  final String text;
  final AppTextStyleVariant variant;
  final AppTextColorVariant colorVariant;
  final Color? customColor;
  final TextAlign? textAlign;
  final TextOverflow? overflow;
  final int? maxLines;
  final FontWeight? fontWeight;
  final bool isSelectable;

  const AppText(
    this.text, {
    super.key,
    this.variant = AppTextStyleVariant.body,
    this.colorVariant = AppTextColorVariant.primary,
    this.customColor,
    this.textAlign,
    this.overflow,
    this.maxLines,
    this.fontWeight,
    this.isSelectable = false,
  });

  const AppText.display(
    this.text, {
    super.key,
    this.colorVariant = AppTextColorVariant.primary,
    this.customColor,
    this.textAlign,
    this.overflow,
    this.maxLines,
    this.fontWeight,
    this.isSelectable = false,
  }) : variant = AppTextStyleVariant.display;

  const AppText.headlineLarge(
    this.text, {
    super.key,
    this.colorVariant = AppTextColorVariant.primary,
    this.customColor,
    this.textAlign,
    this.overflow,
    this.maxLines,
    this.fontWeight,
    this.isSelectable = false,
  }) : variant = AppTextStyleVariant.headlineLarge;

  const AppText.headlineMedium(
    this.text, {
    super.key,
    this.colorVariant = AppTextColorVariant.primary,
    this.customColor,
    this.textAlign,
    this.overflow,
    this.maxLines,
    this.fontWeight,
    this.isSelectable = false,
  }) : variant = AppTextStyleVariant.headlineMedium;

  const AppText.headlineSmall(
    this.text, {
    super.key,
    this.colorVariant = AppTextColorVariant.primary,
    this.customColor,
    this.textAlign,
    this.overflow,
    this.maxLines,
    this.fontWeight,
    this.isSelectable = false,
  }) : variant = AppTextStyleVariant.headlineSmall;

  const AppText.bodyLarge(
    this.text, {
    super.key,
    this.colorVariant = AppTextColorVariant.primary,
    this.customColor,
    this.textAlign,
    this.overflow,
    this.maxLines,
    this.fontWeight,
    this.isSelectable = false,
  }) : variant = AppTextStyleVariant.bodyLarge;

  const AppText.body(
    this.text, {
    super.key,
    this.colorVariant = AppTextColorVariant.primary,
    this.customColor,
    this.textAlign,
    this.overflow,
    this.maxLines,
    this.fontWeight,
    this.isSelectable = false,
  }) : variant = AppTextStyleVariant.body;

  const AppText.bodySmall(
    this.text, {
    super.key,
    this.colorVariant = AppTextColorVariant.secondary,
    this.customColor,
    this.textAlign,
    this.overflow,
    this.maxLines,
    this.fontWeight,
    this.isSelectable = false,
  }) : variant = AppTextStyleVariant.bodySmall;

  const AppText.labelLarge(
    this.text, {
    super.key,
    this.colorVariant = AppTextColorVariant.primary,
    this.customColor,
    this.textAlign,
    this.overflow,
    this.maxLines,
    this.fontWeight,
    this.isSelectable = false,
  }) : variant = AppTextStyleVariant.labelLarge;

  const AppText.label(
    this.text, {
    super.key,
    this.colorVariant = AppTextColorVariant.secondary,
    this.customColor,
    this.textAlign,
    this.overflow,
    this.maxLines,
    this.fontWeight,
    this.isSelectable = false,
  }) : variant = AppTextStyleVariant.label;

  const AppText.caption(
    this.text, {
    super.key,
    this.colorVariant = AppTextColorVariant.tertiary,
    this.customColor,
    this.textAlign,
    this.overflow,
    this.maxLines,
    this.fontWeight,
    this.isSelectable = false,
  }) : variant = AppTextStyleVariant.caption;

  TextStyle _getBaseStyle() {
    switch (variant) {
      case AppTextStyleVariant.display:
        return AppTypography.display;
      case AppTextStyleVariant.headlineLarge:
        return AppTypography.headlineLarge;
      case AppTextStyleVariant.headlineMedium:
        return AppTypography.headlineMedium;
      case AppTextStyleVariant.headlineSmall:
        return AppTypography.headlineSmall;
      case AppTextStyleVariant.bodyLarge:
        return AppTypography.bodyLarge;
      case AppTextStyleVariant.body:
        return AppTypography.body;
      case AppTextStyleVariant.bodySmall:
        return AppTypography.bodySmall;
      case AppTextStyleVariant.labelLarge:
        return AppTypography.labelLarge;
      case AppTextStyleVariant.label:
        return AppTypography.label;
      case AppTextStyleVariant.caption:
        return AppTypography.caption;
    }
  }

  Color _resolveColor(BuildContext context) {
    if (customColor != null) return customColor!;
    final colors = context.appColors;

    switch (colorVariant) {
      case AppTextColorVariant.primary:
        return colors.textPrimary;
      case AppTextColorVariant.secondary:
        return colors.textSecondary;
      case AppTextColorVariant.tertiary:
        return colors.textTertiary;
      case AppTextColorVariant.disabled:
        return colors.textDisabled;
      case AppTextColorVariant.inverse:
        return colors.textInverse;
      case AppTextColorVariant.brand:
        return colors.brandPrimary;
      case AppTextColorVariant.success:
        return colors.success;
      case AppTextColorVariant.warning:
        return colors.warning;
      case AppTextColorVariant.error:
        return colors.error;
    }
  }

  @override
  Widget build(BuildContext context) {
    final baseStyle = _getBaseStyle();
    final effectiveColor = _resolveColor(context);
    final finalStyle = baseStyle.copyWith(
      color: effectiveColor,
      fontWeight: fontWeight ?? baseStyle.fontWeight,
    );

    if (isSelectable) {
      return SelectableText(
        text,
        style: finalStyle,
        textAlign: textAlign,
        maxLines: maxLines,
      );
    }

    return Text(
      text,
      style: finalStyle,
      textAlign: textAlign,
      overflow: overflow,
      maxLines: maxLines,
    );
  }
}
