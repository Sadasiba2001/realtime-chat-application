import 'package:flutter/material.dart';

/// Semantic elevation and shadow tokens for subtle depth.
abstract final class AppShadows {
  static const List<BoxShadow> subtleLight = [
    BoxShadow(
      color: Color(0x0A1E1B26),
      offset: Offset(0, 2),
      blurRadius: 8,
      spreadRadius: 0,
    ),
  ];

  static const List<BoxShadow> elevatedLight = [
    BoxShadow(
      color: Color(0x121E1B26),
      offset: Offset(0, 4),
      blurRadius: 16,
      spreadRadius: 0,
    ),
  ];

  static const List<BoxShadow> subtleDark = [
    BoxShadow(
      color: Color(0x33000000),
      offset: Offset(0, 2),
      blurRadius: 8,
      spreadRadius: 0,
    ),
  ];

  static const List<BoxShadow> elevatedDark = [
    BoxShadow(
      color: Color(0x4D000000),
      offset: Offset(0, 4),
      blurRadius: 16,
      spreadRadius: 0,
    ),
  ];
}
