import 'package:flutter/material.dart';

/// Refined gradients for SB Chat brand elements, buttons, active chips, and message bubbles.
abstract final class AppGradients {
  /// Primary purple brand gradient (#6D28FF -> #8B5CF6)
  static const LinearGradient purpleGradient = LinearGradient(
    colors: [
      Color(0xFF6D28FF),
      Color(0xFF8B5CF6),
    ],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  /// Subtle purple glow gradient for hero accents and active indicators
  static const RadialGradient purpleGlow = RadialGradient(
    colors: [
      Color(0x386D28FF),
      Color(0x006D28FF),
    ],
    radius: 0.85,
  );

  /// Ambient dark background gradient for chat rooms
  static const LinearGradient darkCanvasGradient = LinearGradient(
    colors: [
      Color(0xFF080D18),
      Color(0xFF0B1220),
    ],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  /// Elevated card surface gradient for subtle depth
  static const LinearGradient surfaceElevatedGradient = LinearGradient(
    colors: [
      Color(0xFF141D2E),
      Color(0xFF192338),
    ],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}
