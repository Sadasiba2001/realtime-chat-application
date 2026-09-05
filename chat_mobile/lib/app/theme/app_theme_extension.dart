import 'package:flutter/material.dart';
import 'app_colors.dart';
import 'app_gradients.dart';

/// Semantic, theme-aware color extension for SB Chat.
class AppColorsExtension extends ThemeExtension<AppColorsExtension> {
  final Color backgroundPrimary;
  final Color backgroundSecondary;
  final Color surfacePrimary;
  final Color surfaceSecondary;
  final Color surfaceElevated;
  final Color inputSurface;
  final Color borderDefault;
  final Color borderSubtle;

  final Color textPrimary;
  final Color textSecondary;
  final Color textTertiary;
  final Color textDisabled;
  final Color textInverse;

  final Color brandPrimary;
  final Color brandSecondary;
  final Color brandFocus;
  final Color brandSoft;

  final Color chatBubbleIncoming;
  final Color chatBubbleOutgoing;
  final Color chatBubbleOutgoingText;

  final Color success;
  final Color warning;
  final Color error;
  final Color errorSoft;

  final Gradient brandGradient;
  final Gradient canvasGradient;
  final Gradient glowGradient;

  const AppColorsExtension({
    required this.backgroundPrimary,
    required this.backgroundSecondary,
    required this.surfacePrimary,
    required this.surfaceSecondary,
    required this.surfaceElevated,
    required this.inputSurface,
    required this.borderDefault,
    required this.borderSubtle,
    required this.textPrimary,
    required this.textSecondary,
    required this.textTertiary,
    required this.textDisabled,
    required this.textInverse,
    required this.brandPrimary,
    required this.brandSecondary,
    required this.brandFocus,
    required this.brandSoft,
    required this.chatBubbleIncoming,
    required this.chatBubbleOutgoing,
    required this.chatBubbleOutgoingText,
    required this.success,
    required this.warning,
    required this.error,
    required this.errorSoft,
    required this.brandGradient,
    required this.canvasGradient,
    required this.glowGradient,
  });

  /// SB Dark Theme foundation
  static const AppColorsExtension dark = AppColorsExtension(
    backgroundPrimary: AppColors.darkCanvas,
    backgroundSecondary: AppColors.darkSurface,
    surfacePrimary: AppColors.darkSurface,
    surfaceSecondary: AppColors.darkSurface2,
    surfaceElevated: AppColors.darkElevated,
    inputSurface: AppColors.darkInput,
    borderDefault: AppColors.darkBorder,
    borderSubtle: Color(0x1F263149),
    textPrimary: AppColors.darkTextPrimary,
    textSecondary: AppColors.darkTextSecondary,
    textTertiary: AppColors.darkTextMuted,
    textDisabled: AppColors.darkTextDisabled,
    textInverse: AppColors.lightTextPrimary,
    brandPrimary: AppColors.darkPurplePrimary,
    brandSecondary: AppColors.darkPurpleSecondary,
    brandFocus: AppColors.darkPurpleBright,
    brandSoft: AppColors.darkPurpleSoft,
    chatBubbleIncoming: AppColors.darkSurface2,
    chatBubbleOutgoing: AppColors.darkPurplePrimary,
    chatBubbleOutgoingText: Colors.white,
    success: AppColors.darkSuccess,
    warning: AppColors.darkWarning,
    error: AppColors.darkError,
    errorSoft: Color(0x26EF4444),
    brandGradient: AppGradients.purpleGradient,
    canvasGradient: AppGradients.darkCanvasGradient,
    glowGradient: AppGradients.purpleGlow,
  );

  /// SB Light Theme foundation (tinted cool lavender / blue-gray)
  static const AppColorsExtension light = AppColorsExtension(
    backgroundPrimary: AppColors.lightCanvas,
    backgroundSecondary: AppColors.lightCanvasSecondary,
    surfacePrimary: AppColors.lightSurface,
    surfaceSecondary: AppColors.lightInput,
    surfaceElevated: AppColors.lightElevated,
    inputSurface: AppColors.lightInput,
    borderDefault: AppColors.lightBorder,
    borderSubtle: Color(0x1AD9DCE7),
    textPrimary: AppColors.lightTextPrimary,
    textSecondary: AppColors.lightTextSecondary,
    textTertiary: AppColors.lightTextMuted,
    textDisabled: AppColors.lightTextDisabled,
    textInverse: Colors.white,
    brandPrimary: AppColors.lightPurplePrimary,
    brandSecondary: AppColors.lightPurpleSecondary,
    brandFocus: AppColors.lightPurpleSecondary,
    brandSoft: AppColors.lightPurpleSoft,
    chatBubbleIncoming: AppColors.lightIncomingBubble,
    chatBubbleOutgoing: AppColors.lightPurplePrimary,
    chatBubbleOutgoingText: Colors.white,
    success: AppColors.lightSuccess,
    warning: AppColors.lightWarning,
    error: AppColors.lightError,
    errorSoft: Color(0x26DC2626),
    brandGradient: AppGradients.lightPurpleGradient,
    canvasGradient: AppGradients.lightCanvasGradient,
    glowGradient: AppGradients.lightPurpleGlow,
  );

  @override
  ThemeExtension<AppColorsExtension> copyWith({
    Color? backgroundPrimary,
    Color? backgroundSecondary,
    Color? surfacePrimary,
    Color? surfaceSecondary,
    Color? surfaceElevated,
    Color? inputSurface,
    Color? borderDefault,
    Color? borderSubtle,
    Color? textPrimary,
    Color? textSecondary,
    Color? textTertiary,
    Color? textDisabled,
    Color? textInverse,
    Color? brandPrimary,
    Color? brandSecondary,
    Color? brandFocus,
    Color? brandSoft,
    Color? chatBubbleIncoming,
    Color? chatBubbleOutgoing,
    Color? chatBubbleOutgoingText,
    Color? success,
    Color? warning,
    Color? error,
    Color? errorSoft,
    Gradient? brandGradient,
    Gradient? canvasGradient,
    Gradient? glowGradient,
  }) {
    return AppColorsExtension(
      backgroundPrimary: backgroundPrimary ?? this.backgroundPrimary,
      backgroundSecondary: backgroundSecondary ?? this.backgroundSecondary,
      surfacePrimary: surfacePrimary ?? this.surfacePrimary,
      surfaceSecondary: surfaceSecondary ?? this.surfaceSecondary,
      surfaceElevated: surfaceElevated ?? this.surfaceElevated,
      inputSurface: inputSurface ?? this.inputSurface,
      borderDefault: borderDefault ?? this.borderDefault,
      borderSubtle: borderSubtle ?? this.borderSubtle,
      textPrimary: textPrimary ?? this.textPrimary,
      textSecondary: textSecondary ?? this.textSecondary,
      textTertiary: textTertiary ?? this.textTertiary,
      textDisabled: textDisabled ?? this.textDisabled,
      textInverse: textInverse ?? this.textInverse,
      brandPrimary: brandPrimary ?? this.brandPrimary,
      brandSecondary: brandSecondary ?? this.brandSecondary,
      brandFocus: brandFocus ?? this.brandFocus,
      brandSoft: brandSoft ?? this.brandSoft,
      chatBubbleIncoming: chatBubbleIncoming ?? this.chatBubbleIncoming,
      chatBubbleOutgoing: chatBubbleOutgoing ?? this.chatBubbleOutgoing,
      chatBubbleOutgoingText: chatBubbleOutgoingText ?? this.chatBubbleOutgoingText,
      success: success ?? this.success,
      warning: warning ?? this.warning,
      error: error ?? this.error,
      errorSoft: errorSoft ?? this.errorSoft,
      brandGradient: brandGradient ?? this.brandGradient,
      canvasGradient: canvasGradient ?? this.canvasGradient,
      glowGradient: glowGradient ?? this.glowGradient,
    );
  }

  @override
  ThemeExtension<AppColorsExtension> lerp(
    covariant ThemeExtension<AppColorsExtension>? other,
    double t,
  ) {
    if (other is! AppColorsExtension) return this;
    return AppColorsExtension(
      backgroundPrimary: Color.lerp(backgroundPrimary, other.backgroundPrimary, t)!,
      backgroundSecondary: Color.lerp(backgroundSecondary, other.backgroundSecondary, t)!,
      surfacePrimary: Color.lerp(surfacePrimary, other.surfacePrimary, t)!,
      surfaceSecondary: Color.lerp(surfaceSecondary, other.surfaceSecondary, t)!,
      surfaceElevated: Color.lerp(surfaceElevated, other.surfaceElevated, t)!,
      inputSurface: Color.lerp(inputSurface, other.inputSurface, t)!,
      borderDefault: Color.lerp(borderDefault, other.borderDefault, t)!,
      borderSubtle: Color.lerp(borderSubtle, other.borderSubtle, t)!,
      textPrimary: Color.lerp(textPrimary, other.textPrimary, t)!,
      textSecondary: Color.lerp(textSecondary, other.textSecondary, t)!,
      textTertiary: Color.lerp(textTertiary, other.textTertiary, t)!,
      textDisabled: Color.lerp(textDisabled, other.textDisabled, t)!,
      textInverse: Color.lerp(textInverse, other.textInverse, t)!,
      brandPrimary: Color.lerp(brandPrimary, other.brandPrimary, t)!,
      brandSecondary: Color.lerp(brandSecondary, other.brandSecondary, t)!,
      brandFocus: Color.lerp(brandFocus, other.brandFocus, t)!,
      brandSoft: Color.lerp(brandSoft, other.brandSoft, t)!,
      chatBubbleIncoming: Color.lerp(chatBubbleIncoming, other.chatBubbleIncoming, t)!,
      chatBubbleOutgoing: Color.lerp(chatBubbleOutgoing, other.chatBubbleOutgoing, t)!,
      chatBubbleOutgoingText: Color.lerp(chatBubbleOutgoingText, other.chatBubbleOutgoingText, t)!,
      success: Color.lerp(success, other.success, t)!,
      warning: Color.lerp(warning, other.warning, t)!,
      error: Color.lerp(error, other.error, t)!,
      errorSoft: Color.lerp(errorSoft, other.errorSoft, t)!,
      brandGradient: t < 0.5 ? brandGradient : other.brandGradient,
      canvasGradient: t < 0.5 ? canvasGradient : other.canvasGradient,
      glowGradient: t < 0.5 ? glowGradient : other.glowGradient,
    );
  }
}

extension AppColorsContextExtension on BuildContext {
  AppColorsExtension get appColors =>
      Theme.of(this).extension<AppColorsExtension>() ?? AppColorsExtension.dark;
}
