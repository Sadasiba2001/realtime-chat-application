import 'package:flutter/material.dart';
import '../../app/theme/app_theme_extension.dart';

/// Reusable layout scaffolding component composing headers, body content, and navigation regions.
class AppScaffold extends StatelessWidget {
  final Widget? header;
  final Widget body;
  final Widget? bottomNavigationBar;
  final Widget? floatingActionButton;
  final FloatingActionButtonLocation? floatingActionButtonLocation;
  final Color? backgroundColor;
  final bool safeAreaTop;
  final bool safeAreaBottom;
  final bool resizeToAvoidBottomInset;

  const AppScaffold({
    super.key,
    this.header,
    required this.body,
    this.bottomNavigationBar,
    this.floatingActionButton,
    this.floatingActionButtonLocation,
    this.backgroundColor,
    this.safeAreaTop = true,
    this.safeAreaBottom = true,
    this.resizeToAvoidBottomInset = true,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;

    Widget content = Column(
      children: [
        ?header,
        Expanded(child: body),
      ],
    );

    return Scaffold(
      backgroundColor: backgroundColor ?? colors.backgroundPrimary,
      resizeToAvoidBottomInset: resizeToAvoidBottomInset,
      body: SafeArea(
        top: safeAreaTop,
        bottom: safeAreaBottom,
        child: content,
      ),
      bottomNavigationBar: bottomNavigationBar,
      floatingActionButton: floatingActionButton,
      floatingActionButtonLocation: floatingActionButtonLocation,
    );
  }
}
