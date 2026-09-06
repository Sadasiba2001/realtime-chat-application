import 'package:flutter/material.dart';

/// Semantic border radius tokens for SB Chat Mobile.
abstract final class AppRadius {
  static const double radiusSmall = 12.0;
  static const double radiusMedium = 16.0;
  static const double radiusLarge = 20.0;
  static const double radiusExtraLarge = 24.0;
  static const double radiusPill = 999.0;

  // BorderRadius helpers
  static const BorderRadius small = BorderRadius.all(Radius.circular(radiusSmall));
  static const BorderRadius medium = BorderRadius.all(Radius.circular(radiusMedium));
  static const BorderRadius large = BorderRadius.all(Radius.circular(radiusLarge));
  static const BorderRadius extraLarge = BorderRadius.all(Radius.circular(radiusExtraLarge));
  static const BorderRadius pill = BorderRadius.all(Radius.circular(radiusPill));

  // Chat message bubble corners (18-20px with asymmetric sharp origin corner)
  static const BorderRadius outgoingBubble = BorderRadius.only(
    topLeft: Radius.circular(radiusLarge),
    topRight: Radius.circular(radiusLarge),
    bottomLeft: Radius.circular(radiusLarge),
    bottomRight: Radius.circular(6.0),
  );

  static const BorderRadius incomingBubble = BorderRadius.only(
    topLeft: Radius.circular(radiusLarge),
    topRight: Radius.circular(radiusLarge),
    bottomRight: Radius.circular(radiusLarge),
    bottomLeft: Radius.circular(6.0),
  );
}

