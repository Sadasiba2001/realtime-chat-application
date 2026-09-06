import 'package:flutter/material.dart';
import 'app_colors.dart';

/// Refined gradients for SB Chat brand elements, buttons, active chips, and message bubbles.
abstract final class AppGradients {
  /// Primary purple brand gradient (#6D3CFF -> #8B5CF6)
  static const LinearGradient purpleGradient = LinearGradient(
    colors: [
      AppColors.darkPurplePrimary,
      AppColors.darkPurpleSecondary,
    ],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  /// Light theme purple gradient (#6841E8 -> #7C5CE8)
  static const LinearGradient lightPurpleGradient = LinearGradient(
    colors: [
      AppColors.lightPurplePrimary,
      AppColors.lightPurpleSecondary,
    ],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  /// Subtle dark canvas gradient for timeline and backdrops
  static const LinearGradient darkCanvasGradient = LinearGradient(
    colors: [
      Color(0xFF080D18),
      Color(0xFF0C1322),
    ],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  /// Subtle light canvas gradient for timeline and backdrops
  static const LinearGradient lightCanvasGradient = LinearGradient(
    colors: [
      Color(0xFFF3F4F8),
      Color(0xFFECEEF5),
    ],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  /// Radial ambient glow effect behind avatars and hero cards
  static const RadialGradient purpleGlow = RadialGradient(
    colors: [
      Color(0x556D3CFF),
      Color(0x006D3CFF),
    ],
    radius: 0.85,
  );

  /// Subtle light glow
  static const RadialGradient lightPurpleGlow = RadialGradient(
    colors: [
      Color(0x356841E8),
      Color(0x006841E8),
    ],
    radius: 0.85,
  );
}
