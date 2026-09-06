import 'package:flutter/material.dart';

/// Semantic elevation and shadow tokens for subtle depth.
abstract final class AppShadows {
  static const List<BoxShadow> subtleLight = [
    BoxShadow(
      color: Color(0x0A0F172A),
      offset: Offset(0, 2),
      blurRadius: 8,
      spreadRadius: 0,
    ),
  ];

  static const List<BoxShadow> elevatedLight = [
    BoxShadow(
      color: Color(0x120F172A),
      offset: Offset(0, 4),
      blurRadius: 16,
      spreadRadius: 0,
    ),
  ];

  static const List<BoxShadow> subtleDark = [
    BoxShadow(
      color: Color(0x66000000),
      offset: Offset(0, 2),
      blurRadius: 10,
      spreadRadius: 0,
    ),
  ];

  static const List<BoxShadow> elevatedDark = [
    BoxShadow(
      color: Color(0x80000000),
      offset: Offset(0, 8),
      blurRadius: 24,
      spreadRadius: -2,
    ),
  ];

  static const List<BoxShadow> purpleGlow = [
    BoxShadow(
      color: Color(0x406D28FF),
      offset: Offset(0, 6),
      blurRadius: 20,
      spreadRadius: 0,
    ),
  ];
}

