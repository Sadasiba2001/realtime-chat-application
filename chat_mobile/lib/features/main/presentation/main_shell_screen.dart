import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme/app_theme_extension.dart';
import '../../../app/theme/sb_icons.dart';
import '../../../core/widgets/app_bottom_navbar.dart';

/// Main Application Shell hosting the persistent bottom navigation bar.
class MainShellScreen extends StatelessWidget {
  final StatefulNavigationShell navigationShell;

  const MainShellScreen({
    super.key,
    required this.navigationShell,
  });

  static const List<AppBottomNavbarItem> _navItems = [
    AppBottomNavbarItem(
      icon: SBIcons.chatsOutline,
      activeIcon: SBIcons.chatsFilled,
      label: 'Chats',
      badgeCount: 3,
    ),
    AppBottomNavbarItem(
      icon: SBIcons.contactsOutline,
      activeIcon: SBIcons.contactsFilled,
      label: 'Contacts',
    ),
    AppBottomNavbarItem(
      icon: SBIcons.callsOutline,
      activeIcon: SBIcons.callsFilled,
      label: 'Calls',
    ),
    AppBottomNavbarItem(
      icon: SBIcons.settingsOutline,
      activeIcon: SBIcons.settingsFilled,
      label: 'Settings',
    ),
  ];

  void _onItemSelected(int index) {
    navigationShell.goBranch(
      index,
      initialLocation: index == navigationShell.currentIndex,
    );
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;

    return Scaffold(
      backgroundColor: colors.backgroundPrimary,
      body: navigationShell,
      bottomNavigationBar: AppBottomNavbar(
        currentIndex: navigationShell.currentIndex,
        items: _navItems,
        onItemSelected: _onItemSelected,
      ),
    );
  }
}
