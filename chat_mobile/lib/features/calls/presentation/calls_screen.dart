import 'package:flutter/material.dart';
import '../../../app/theme/app_theme_extension.dart';
import '../../../core/widgets/app_header.dart';
import '../../../core/widgets/app_icon_button.dart';
import '../../../core/widgets/app_scaffold.dart';
import 'widgets/calls_body.dart';

/// Screen displaying the recent call logs, composed of [AppHeader] and [CallsBody].
class CallsScreen extends StatelessWidget {
  const CallsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;

    return AppScaffold(
      safeAreaTop: true,
      safeAreaBottom: false,
      header: AppHeader(
        title: 'Calls',
        trailing: AppIconButton(
          icon: Icons.add_ic_call_rounded,
          tooltip: 'Start Call',
          color: colors.brandPrimary,
          onPressed: () {},
        ),
      ),
      body: const CallsBody(),
    );
  }
}
