import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../app/theme/app_theme_extension.dart';
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
      icon: Icons.chat_bubble_outline_rounded,
      activeIcon: Icons.chat_bubble_rounded,
      label: 'Chats',
      badgeCount: 3,
    ),
    AppBottomNavbarItem(
      icon: Icons.people_outline_rounded,
      activeIcon: Icons.people_rounded,
      label: 'Contacts',
    ),
    AppBottomNavbarItem(
      icon: Icons.call_outlined,
      activeIcon: Icons.call_rounded,
      label: 'Calls',
    ),
    AppBottomNavbarItem(
      icon: Icons.settings_outlined,
      activeIcon: Icons.settings_rounded,
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

