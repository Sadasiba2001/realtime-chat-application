import 'package:flutter/material.dart';

/// Semantic color tokens for SB Chat Mobile Design System.
/// Primary Purple: #6D3CFF / #6D28FF
/// Deep Navy Canvas: #080D18
/// Layered Surfaces: #0F1726, #141D2E, #192338
abstract final class AppColors {
  // Brand foundation
  static const Color brandPrimary = Color(0xFF6D3CFF);
  static const Color brandSecondary = Color(0xFF8B5CF6);
  static const Color brandAccent = Color(0xFF7C3AED);
  static const Color brandPressed = Color(0xFF5B2EE0);
  static const Color brandHover = Color(0xFF7C3AED);
  static const Color brandFocus = Color(0xFFA78BFA);

  // Brand tints
  static const Color brandSoftLight = Color(0xFFF1EDFE);
  static const Color brandSoftDark = Color(0xFF1F1836);
  static const Color brandSubtleLight = Color(0xFFF8F6FF);
  static const Color brandSubtleDark = Color(0xFF151024);

  // Neutral Backgrounds - Light
  static const Color bgPrimaryLight = Color(0xFFF8FAFC);
  static const Color bgSecondaryLight = Color(0xFFF1F5F9);

  // Neutral Backgrounds - Dark (SB Chat Deep Navy canvas)
  static const Color bgPrimaryDark = Color(0xFF080D18);
  static const Color bgSecondaryDark = Color(0xFF0C1322);

  // Surfaces - Light
  static const Color surfacePrimaryLight = Color(0xFFFFFFFF);
  static const Color surfaceSecondaryLight = Color(0xFFF8FAFC);
  static const Color surfaceElevatedLight = Color(0xFFFFFFFF);

  // Surfaces - Dark (Layered Navy)
  static const Color surfacePrimaryDark = Color(0xFF0F1726);
  static const Color surfaceSecondaryDark = Color(0xFF141D2E);
  static const Color surfaceElevatedDark = Color(0xFF192338);

  // Typography - Light
  static const Color textPrimaryLight = Color(0xFF0F172A);
  static const Color textSecondaryLight = Color(0xFF475569);
  static const Color textTertiaryLight = Color(0xFF94A3B8);
  static const Color textDisabledLight = Color(0xFFCBD5E1);
  static const Color textInverseLight = Color(0xFFFFFFFF);

  // Typography - Dark
  static const Color textPrimaryDark = Color(0xFFF8FAFC);
  static const Color textSecondaryDark = Color(0xFFA7B0C0);
  static const Color textTertiaryDark = Color(0xFF68758A);
  static const Color textDisabledDark = Color(0xFF3B4559);
  static const Color textInverseDark = Color(0xFF080D18);

  // Borders - Light
  static const Color borderSubtleLight = Color(0xFFE2E8F0);
  static const Color borderDefaultLight = Color(0xFFCBD5E1);
  static const Color borderStrongLight = Color(0xFF94A3B8);

  // Borders - Dark (Subtle Navy borders)
  static const Color borderSubtleDark = Color(0xFF1E293B);
  static const Color borderDefaultDark = Color(0xFF263149);
  static const Color borderStrongDark = Color(0xFF334155);

  // Semantic Status
  static const Color success = Color(0xFF22C55E);
  static const Color successSoft = Color(0xFF143026);
  static const Color warning = Color(0xFFF59E0B);
  static const Color warningSoft = Color(0xFF322714);
  static const Color error = Color(0xFFEF4444);
  static const Color errorSoft = Color(0xFF33161A);
  static const Color info = Color(0xFF3B82F6);
  static const Color infoSoft = Color(0xFF12243C);

  // Chat Specific
  static const Color chatBubbleOutgoing = Color(0xFF6D3CFF);
  static const Color chatBubbleIncomingLight = Color(0xFFF1F5F9);
  static const Color chatBubbleIncomingDark = Color(0xFF141D2E);

  static const Color onlineIndicator = Color(0xFF22C55E);
  static const Color offlineIndicator = Color(0xFF64748B);
}
