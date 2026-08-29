import 'package:flutter/material.dart';

/// Semantic color tokens for Chat Mobile Design System.
/// Primary Purple: #A534B0
/// Brand Dark: #252330
abstract final class AppColors {
  // Brand foundation
  static const Color brandPrimary = Color(0xFFA534B0);
  static const Color brandPressed = Color(0xFF882592);
  static const Color brandHover = Color(0xFFB844C4);
  static const Color brandFocus = Color(0xFFD673E0);

  // Brand tints
  static const Color brandSoftLight = Color(0xFFF7EBF8);
  static const Color brandSoftDark = Color(0xFF381F3E);
  static const Color brandSubtleLight = Color(0xFFFCF7FD);
  static const Color brandSubtleDark = Color(0xFF28182D);

  // Neutral Backgrounds - Light
  static const Color bgPrimaryLight = Color(0xFFFAF9FC);
  static const Color bgSecondaryLight = Color(0xFFF3F1F7);

  // Neutral Backgrounds - Dark
  static const Color bgPrimaryDark = Color(0xFF191722);
  static const Color bgSecondaryDark = Color(0xFF201E2B);

  // Surfaces - Light
  static const Color surfacePrimaryLight = Color(0xFFFFFFFF);
  static const Color surfaceSecondaryLight = Color(0xFFF7F6FA);
  static const Color surfaceElevatedLight = Color(0xFFFFFFFF);

  // Surfaces - Dark
  static const Color surfacePrimaryDark = Color(0xFF252330); // Brand Dark reference
  static const Color surfaceSecondaryDark = Color(0xFF2C2939);
  static const Color surfaceElevatedDark = Color(0xFF343043);

  // Typography - Light
  static const Color textPrimaryLight = Color(0xFF1E1B26);
  static const Color textSecondaryLight = Color(0xFF676277);
  static const Color textTertiaryLight = Color(0xFF9993AB);
  static const Color textDisabledLight = Color(0xFFC7C3D4);
  static const Color textInverseLight = Color(0xFFFFFFFF);

  // Typography - Dark
  static const Color textPrimaryDark = Color(0xFFF6F5F9);
  static const Color textSecondaryDark = Color(0xFFA5A0B6);
  static const Color textTertiaryDark = Color(0xFF756F88);
  static const Color textDisabledDark = Color(0xFF4C475F);
  static const Color textInverseDark = Color(0xFF1E1B26);

  // Borders - Light
  static const Color borderSubtleLight = Color(0xFFECEAF2);
  static const Color borderDefaultLight = Color(0xFFDDD9E7);
  static const Color borderStrongLight = Color(0xFFBFBACF);

  // Borders - Dark
  static const Color borderSubtleDark = Color(0xFF2F2C3E);
  static const Color borderDefaultDark = Color(0xFF3B374E);
  static const Color borderStrongDark = Color(0xFF504A66);

  // Semantic Status
  static const Color success = Color(0xFF10B981);
  static const Color successSoft = Color(0xFFE6F8F2);
  static const Color warning = Color(0xFFF59E0B);
  static const Color warningSoft = Color(0xFFFEF5E7);
  static const Color error = Color(0xFFEF4444);
  static const Color errorSoft = Color(0xFFFEECEE);
  static const Color info = Color(0xFF3B82F6);
  static const Color infoSoft = Color(0xFFEBF3FE);

  // Chat Specific
  static const Color chatBubbleOutgoing = Color(0xFFA534B0);
  static const Color chatBubbleIncomingLight = Color(0xFFF0EEF5);
  static const Color chatBubbleIncomingDark = Color(0xFF2D2A3B);

  static const Color onlineIndicator = Color(0xFF22C55E);
  static const Color offlineIndicator = Color(0xFF94A3B8);
}
