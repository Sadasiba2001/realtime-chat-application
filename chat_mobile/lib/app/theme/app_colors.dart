import 'package:flutter/material.dart';

/// Semantic color tokens for the SB Chat Mobile Design System.
///
/// Features two intentionally designed first-class theme foundations:
/// 1. **SB Dark**: Deep navy canvas (#080D18) with layered neutral surfaces & purple accents.
/// 2. **SB Light**: Sophisticated tinted canvas (#F3F4F8) with soft lavender/blue-gray hierarchy.
abstract final class AppColors {
  // -------------------------------------------------------------
  // SB DARK FOUNDATION
  // -------------------------------------------------------------
  static const Color darkCanvas = Color(0xFF080D18);
  static const Color darkSurface = Color(0xFF0F1726);
  static const Color darkSurface2 = Color(0xFF141D2E);
  static const Color darkElevated = Color(0xFF192338);
  static const Color darkInput = Color(0xFF111A2A);
  static const Color darkBorder = Color(0xFF263149);

  static const Color darkTextPrimary = Color(0xFFF4F7FB);
  static const Color darkTextSecondary = Color(0xFFAAB4C5);
  static const Color darkTextMuted = Color(0xFF69768A);
  static const Color darkTextDisabled = Color(0xFF465267);

  static const Color darkPurplePrimary = Color(0xFF6D3CFF);
  static const Color darkPurpleSecondary = Color(0xFF8B5CF6);
  static const Color darkPurpleBright = Color(0xFF7C3AED);
  static const Color darkPurpleSoft = Color(0x2A6D3CFF);

  // Filter Bar Tokens (Dark)
  static const Color darkFilterOuterBg = Color(0xFF111A2A);
  static const Color darkFilterActiveCapsule = Color(0xFF2A2148);
  static const Color darkFilterActiveText = Color(0xFFF5F3FF);

  // Floating Nav Tokens (Dark)
  static const Color darkNavOuterBg = Color(0xFF111A2A);
  static const Color darkNavActiveCapsule = Color(0xFF2A2148);
  static const Color darkNavActiveIcon = Color(0xFF9B7BFF);
  static const Color darkNavActiveLabel = Color(0xFFF4F0FF);
  static const Color darkNavInactive = Color(0xFF7D899D);

  static const Color darkSuccess = Color(0xFF22C55E);
  static const Color darkWarning = Color(0xFFF59E0B);
  static const Color darkError = Color(0xFFEF4444);

  // -------------------------------------------------------------
  // SB LIGHT FOUNDATION (High-contrast, soft cool lavender/gray)
  // -------------------------------------------------------------
  static const Color lightCanvas = Color(0xFFF3F4F8);
  static const Color lightCanvasSecondary = Color(0xFFECEEF5);
  static const Color lightSurface = Color(0xFFF8F9FC);
  static const Color lightElevated = Color(0xFFFFFFFF);
  static const Color lightInput = Color(0xFFE9EBF3);
  static const Color lightBorder = Color(0xFFD9DCE7);

  // High-contrast, darker text colors for light theme
  static const Color lightTextPrimary = Color(0xFF172033);
  static const Color lightTextSecondary = Color(0xFF4F5A70);
  static const Color lightTextMuted = Color(0xFF707A8D);
  static const Color lightTextDisabled = Color(0xFFAEB4C1);

  static const Color lightPurplePrimary = Color(0xFF6841E8);
  static const Color lightPurpleSecondary = Color(0xFF7C5CE8);
  static const Color lightPurpleSoft = Color(0xFFEEE9FF);

  // Filter Bar Tokens (Light)
  static const Color lightFilterOuterBg = Color(0xFFE9EBF3);
  static const Color lightFilterActiveCapsule = Color(0xFFEEE9FF);
  static const Color lightFilterActiveText = Color(0xFF6841E8);

  // Floating Nav Tokens (Light)
  static const Color lightNavOuterBg = Color(0xFFF8F9FC);
  static const Color lightNavActiveCapsule = Color(0xFFEEE9FF);
  static const Color lightNavActiveIcon = Color(0xFF6841E8);
  static const Color lightNavActiveLabel = Color(0xFF6841E8);
  static const Color lightNavInactive = Color(0xFF697286);

  static const Color lightOutgoingBubble = Color(0xFFE7DEFF);
  static const Color lightIncomingBubble = Color(0xFFE8EBF2);

  static const Color lightSuccess = Color(0xFF16A34A);
  static const Color lightWarning = Color(0xFFD97706);
  static const Color lightError = Color(0xFFDC2626);

  // -------------------------------------------------------------
  // DEFAULT ALIASES & COMPATIBILITY HELPERS
  // -------------------------------------------------------------
  static const Color brandPrimary = darkPurplePrimary;
  static const Color brandSecondary = darkPurpleSecondary;
  static const Color brandFocus = darkPurpleBright;
  static const Color brandSoft = darkPurpleSoft;

  static const Color backgroundPrimaryDark = darkCanvas;
  static const Color surfacePrimaryDark = darkSurface;
  static const Color surfaceSecondaryDark = darkSurface2;
  static const Color surfaceElevatedDark = darkElevated;
  static const Color borderDefaultDark = darkBorder;

  static const Color backgroundPrimaryLight = lightCanvas;
  static const Color surfacePrimaryLight = lightSurface;
  static const Color surfaceSecondaryLight = lightInput;
  static const Color borderDefaultLight = lightBorder;

  static const Color onlineIndicator = Color(0xFF22C55E);
  static const Color offlineIndicator = Color(0xFF69768A);

  static const Color success = darkSuccess;
  static const Color warning = darkWarning;
  static const Color error = darkError;
  static const Color errorSoft = Color(0x26EF4444);
}
