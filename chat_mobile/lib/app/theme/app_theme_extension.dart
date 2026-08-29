import 'package:flutter/material.dart';
import 'app_colors.dart';

/// Custom ThemeExtension providing semantic color tokens.
class AppColorsExtension extends ThemeExtension<AppColorsExtension> {
  final Color brandPrimary;
  final Color brandPressed;
  final Color brandSoft;
  final Color brandSubtle;

  final Color backgroundPrimary;
  final Color backgroundSecondary;

  final Color surfacePrimary;
  final Color surfaceSecondary;
  final Color surfaceElevated;

  final Color textPrimary;
  final Color textSecondary;
  final Color textTertiary;
  final Color textDisabled;
  final Color textInverse;

  final Color borderSubtle;
  final Color borderDefault;
  final Color borderStrong;

  final Color success;
  final Color successSoft;
  final Color warning;
  final Color warningSoft;
  final Color error;
  final Color errorSoft;
  final Color info;
  final Color infoSoft;

  final Color chatBubbleOutgoing;
  final Color chatBubbleIncoming;

  final Color onlineIndicator;
  final Color offlineIndicator;

  const AppColorsExtension({
    required this.brandPrimary,
    required this.brandPressed,
    required this.brandSoft,
    required this.brandSubtle,
    required this.backgroundPrimary,
    required this.backgroundSecondary,
    required this.surfacePrimary,
    required this.surfaceSecondary,
    required this.surfaceElevated,
    required this.textPrimary,
    required this.textSecondary,
    required this.textTertiary,
    required this.textDisabled,
    required this.textInverse,
    required this.borderSubtle,
    required this.borderDefault,
    required this.borderStrong,
    required this.success,
    required this.successSoft,
    required this.warning,
    required this.warningSoft,
    required this.error,
    required this.errorSoft,
    required this.info,
    required this.infoSoft,
    required this.chatBubbleOutgoing,
    required this.chatBubbleIncoming,
    required this.onlineIndicator,
    required this.offlineIndicator,
  });

  static const AppColorsExtension light = AppColorsExtension(
    brandPrimary: AppColors.brandPrimary,
    brandPressed: AppColors.brandPressed,
    brandSoft: AppColors.brandSoftLight,
    brandSubtle: AppColors.brandSubtleLight,
    backgroundPrimary: AppColors.bgPrimaryLight,
    backgroundSecondary: AppColors.bgSecondaryLight,
    surfacePrimary: AppColors.surfacePrimaryLight,
    surfaceSecondary: AppColors.surfaceSecondaryLight,
    surfaceElevated: AppColors.surfaceElevatedLight,
    textPrimary: AppColors.textPrimaryLight,
    textSecondary: AppColors.textSecondaryLight,
    textTertiary: AppColors.textTertiaryLight,
    textDisabled: AppColors.textDisabledLight,
    textInverse: AppColors.textInverseLight,
    borderSubtle: AppColors.borderSubtleLight,
    borderDefault: AppColors.borderDefaultLight,
    borderStrong: AppColors.borderStrongLight,
    success: AppColors.success,
    successSoft: AppColors.successSoft,
    warning: AppColors.warning,
    warningSoft: AppColors.warningSoft,
    error: AppColors.error,
    errorSoft: AppColors.errorSoft,
    info: AppColors.info,
    infoSoft: AppColors.infoSoft,
    chatBubbleOutgoing: AppColors.chatBubbleOutgoing,
    chatBubbleIncoming: AppColors.chatBubbleIncomingLight,
    onlineIndicator: AppColors.onlineIndicator,
    offlineIndicator: AppColors.offlineIndicator,
  );

  static const AppColorsExtension dark = AppColorsExtension(
    brandPrimary: AppColors.brandPrimary,
    brandPressed: AppColors.brandPressed,
    brandSoft: AppColors.brandSoftDark,
    brandSubtle: AppColors.brandSubtleDark,
    backgroundPrimary: AppColors.bgPrimaryDark,
    backgroundSecondary: AppColors.bgSecondaryDark,
    surfacePrimary: AppColors.surfacePrimaryDark,
    surfaceSecondary: AppColors.surfaceSecondaryDark,
    surfaceElevated: AppColors.surfaceElevatedDark,
    textPrimary: AppColors.textPrimaryDark,
    textSecondary: AppColors.textSecondaryDark,
    textTertiary: AppColors.textTertiaryDark,
    textDisabled: AppColors.textDisabledDark,
    textInverse: AppColors.textInverseDark,
    borderSubtle: AppColors.borderSubtleDark,
    borderDefault: AppColors.borderDefaultDark,
    borderStrong: AppColors.borderStrongDark,
    success: AppColors.success,
    successSoft: AppColors.brandSoftDark,
    warning: AppColors.warning,
    warningSoft: AppColors.brandSoftDark,
    error: AppColors.error,
    errorSoft: AppColors.brandSoftDark,
    info: AppColors.info,
    infoSoft: AppColors.brandSoftDark,
    chatBubbleOutgoing: AppColors.chatBubbleOutgoing,
    chatBubbleIncoming: AppColors.chatBubbleIncomingDark,
    onlineIndicator: AppColors.onlineIndicator,
    offlineIndicator: AppColors.offlineIndicator,
  );

  @override
  ThemeExtension<AppColorsExtension> copyWith({
    Color? brandPrimary,
    Color? brandPressed,
    Color? brandSoft,
    Color? brandSubtle,
    Color? backgroundPrimary,
    Color? backgroundSecondary,
    Color? surfacePrimary,
    Color? surfaceSecondary,
    Color? surfaceElevated,
    Color? textPrimary,
    Color? textSecondary,
    Color? textTertiary,
    Color? textDisabled,
    Color? textInverse,
    Color? borderSubtle,
    Color? borderDefault,
    Color? borderStrong,
    Color? success,
    Color? successSoft,
    Color? warning,
    Color? warningSoft,
    Color? error,
    Color? errorSoft,
    Color? info,
    Color? infoSoft,
    Color? chatBubbleOutgoing,
    Color? chatBubbleIncoming,
    Color? onlineIndicator,
    Color? offlineIndicator,
  }) {
    return AppColorsExtension(
      brandPrimary: brandPrimary ?? this.brandPrimary,
      brandPressed: brandPressed ?? this.brandPressed,
      brandSoft: brandSoft ?? this.brandSoft,
      brandSubtle: brandSubtle ?? this.brandSubtle,
      backgroundPrimary: backgroundPrimary ?? this.backgroundPrimary,
      backgroundSecondary: backgroundSecondary ?? this.backgroundSecondary,
      surfacePrimary: surfacePrimary ?? this.surfacePrimary,
      surfaceSecondary: surfaceSecondary ?? this.surfaceSecondary,
      surfaceElevated: surfaceElevated ?? this.surfaceElevated,
      textPrimary: textPrimary ?? this.textPrimary,
      textSecondary: textSecondary ?? this.textSecondary,
      textTertiary: textTertiary ?? this.textTertiary,
      textDisabled: textDisabled ?? this.textDisabled,
      textInverse: textInverse ?? this.textInverse,
      borderSubtle: borderSubtle ?? this.borderSubtle,
      borderDefault: borderDefault ?? this.borderDefault,
      borderStrong: borderStrong ?? this.borderStrong,
      success: success ?? this.success,
      successSoft: successSoft ?? this.successSoft,
      warning: warning ?? this.warning,
      warningSoft: warningSoft ?? this.warningSoft,
      error: error ?? this.error,
      errorSoft: errorSoft ?? this.errorSoft,
      info: info ?? this.info,
      infoSoft: infoSoft ?? this.infoSoft,
      chatBubbleOutgoing: chatBubbleOutgoing ?? this.chatBubbleOutgoing,
      chatBubbleIncoming: chatBubbleIncoming ?? this.chatBubbleIncoming,
      onlineIndicator: onlineIndicator ?? this.onlineIndicator,
      offlineIndicator: offlineIndicator ?? this.offlineIndicator,
    );
  }

  @override
  ThemeExtension<AppColorsExtension> lerp(
    covariant ThemeExtension<AppColorsExtension>? other,
    double t,
  ) {
    if (other is! AppColorsExtension) return this;
    return AppColorsExtension(
      brandPrimary: Color.lerp(brandPrimary, other.brandPrimary, t)!,
      brandPressed: Color.lerp(brandPressed, other.brandPressed, t)!,
      brandSoft: Color.lerp(brandSoft, other.brandSoft, t)!,
      brandSubtle: Color.lerp(brandSubtle, other.brandSubtle, t)!,
      backgroundPrimary: Color.lerp(backgroundPrimary, other.backgroundPrimary, t)!,
      backgroundSecondary: Color.lerp(backgroundSecondary, other.backgroundSecondary, t)!,
      surfacePrimary: Color.lerp(surfacePrimary, other.surfacePrimary, t)!,
      surfaceSecondary: Color.lerp(surfaceSecondary, other.surfaceSecondary, t)!,
      surfaceElevated: Color.lerp(surfaceElevated, other.surfaceElevated, t)!,
      textPrimary: Color.lerp(textPrimary, other.textPrimary, t)!,
      textSecondary: Color.lerp(textSecondary, other.textSecondary, t)!,
      textTertiary: Color.lerp(textTertiary, other.textTertiary, t)!,
      textDisabled: Color.lerp(textDisabled, other.textDisabled, t)!,
      textInverse: Color.lerp(textInverse, other.textInverse, t)!,
      borderSubtle: Color.lerp(borderSubtle, other.borderSubtle, t)!,
      borderDefault: Color.lerp(borderDefault, other.borderDefault, t)!,
      borderStrong: Color.lerp(borderStrong, other.borderStrong, t)!,
      success: Color.lerp(success, other.success, t)!,
      successSoft: Color.lerp(successSoft, other.successSoft, t)!,
      warning: Color.lerp(warning, other.warning, t)!,
      warningSoft: Color.lerp(warningSoft, other.warningSoft, t)!,
      error: Color.lerp(error, other.error, t)!,
      errorSoft: Color.lerp(errorSoft, other.errorSoft, t)!,
      info: Color.lerp(info, other.info, t)!,
      infoSoft: Color.lerp(infoSoft, other.infoSoft, t)!,
      chatBubbleOutgoing: Color.lerp(chatBubbleOutgoing, other.chatBubbleOutgoing, t)!,
      chatBubbleIncoming: Color.lerp(chatBubbleIncoming, other.chatBubbleIncoming, t)!,
      onlineIndicator: Color.lerp(onlineIndicator, other.onlineIndicator, t)!,
      offlineIndicator: Color.lerp(offlineIndicator, other.offlineIndicator, t)!,
    );
  }
}

/// Helper extension on BuildContext for quick access to app theme tokens.
extension AppThemeContext on BuildContext {
  AppColorsExtension get appColors {
    final colors = Theme.of(this).extension<AppColorsExtension>();
    return colors ?? AppColorsExtension.light;
  }
}
