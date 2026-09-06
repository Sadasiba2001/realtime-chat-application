import 'package:flutter/material.dart';
import '../../app/theme/app_theme_extension.dart';

/// Semantic thin divider for separating list items and sections.
class AppDivider extends StatelessWidget {
  final double indent;
  final double endIndent;
  final double thickness;
  final double space;
  final Color? color;

  const AppDivider({
    super.key,
    this.indent = 0.0,
    this.endIndent = 0.0,
    this.thickness = 1.0,
    this.space = 1.0,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;
    return Divider(
      indent: indent,
      endIndent: endIndent,
      thickness: thickness,
      height: space,
      color: color ?? colors.borderSubtle,
    );
  }
}
