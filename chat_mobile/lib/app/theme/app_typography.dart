import 'package:flutter/material.dart';

/// Semantic typography definition prioritizing readability, contrast, and hierarchy.
abstract final class AppTypography {
  static const TextStyle display = TextStyle(
    fontSize: 28,
    fontWeight: FontWeight.w800,
    letterSpacing: -0.5,
    height: 1.2,
  );

  /// Main screen titles ("Chats", "Contacts", "Calls", "Settings")
  static const TextStyle headlineLarge = TextStyle(
    fontSize: 25,
    fontWeight: FontWeight.w700,
    letterSpacing: -0.4,
    height: 1.25,
  );

  static const TextStyle headlineMedium = TextStyle(
    fontSize: 20,
    fontWeight: FontWeight.w700,
    letterSpacing: -0.2,
    height: 1.3,
  );

  /// Chat contact names and section headers
  static const TextStyle headlineSmall = TextStyle(
    fontSize: 17,
    fontWeight: FontWeight.w600,
    letterSpacing: -0.1,
    height: 1.3,
  );

  /// Large body text
  static const TextStyle bodyLarge = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w400,
    letterSpacing: 0.1,
    height: 1.4,
  );

  /// Primary message text and input fields
  static const TextStyle body = TextStyle(
    fontSize: 15,
    fontWeight: FontWeight.w400,
    letterSpacing: 0.1,
    height: 1.4,
  );

  /// Message preview in chat list
  static const TextStyle bodySmall = TextStyle(
    fontSize: 14.5,
    fontWeight: FontWeight.w400,
    letterSpacing: 0.1,
    height: 1.35,
  );

  /// Filter tab labels and primary button text
  static const TextStyle labelLarge = TextStyle(
    fontSize: 14.5,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.1,
    height: 1.2,
  );

  /// Standard buttons & controls
  static const TextStyle label = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.1,
    height: 1.2,
  );

  /// Bottom navigation labels & timestamps
  static const TextStyle caption = TextStyle(
    fontSize: 13,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.15,
    height: 1.2,
  );

  /// Message bubbles
  static const TextStyle chatMessage = TextStyle(
    fontSize: 15.5,
    fontWeight: FontWeight.w400,
    letterSpacing: 0.1,
    height: 1.38,
  );
}
