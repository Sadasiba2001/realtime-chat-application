import 'package:flutter/material.dart';
import '../../../app/theme/app_theme_extension.dart';
import '../../../core/widgets/app_header.dart';
import '../../../core/widgets/app_icon_button.dart';
import '../../../core/widgets/app_scaffold.dart';
import 'widgets/contacts_body.dart';

/// Screen displaying the contacts directory, composed of [AppHeader] and [ContactsBody].
class ContactsScreen extends StatelessWidget {
  const ContactsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;

    return AppScaffold(
      safeAreaTop: true,
      safeAreaBottom: false,
      header: AppHeader(
        title: 'Contacts',
        trailing: AppIconButton(
          icon: Icons.person_add_alt_1_rounded,
          tooltip: 'Add Contact',
          color: colors.brandPrimary,
          onPressed: () {},
        ),
      ),
      body: const ContactsBody(),
    );
  }
}
