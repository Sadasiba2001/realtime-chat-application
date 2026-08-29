import 'package:flutter/material.dart';
import '../../../core/widgets/app_header.dart';
import '../../../core/widgets/app_scaffold.dart';
import 'widgets/settings_body.dart';

/// Screen displaying user settings and theme toggle, composed of [AppHeader] and [SettingsBody].
class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const AppScaffold(
      safeAreaTop: true,
      safeAreaBottom: false,
      header: AppHeader(
        title: 'Settings',
      ),
      body: SettingsBody(),
    );
  }
}
