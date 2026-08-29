import 'package:flutter/material.dart';
import '../../app/theme/app_theme_extension.dart';
import '../../app/theme/app_typography.dart';
import 'app_badge.dart';

/// Configuration data class for an item in [AppBottomNavbar].
class AppBottomNavbarItem {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final int? badgeCount;

  const AppBottomNavbarItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
    this.badgeCount,
  });
}

/// Reusable, presentation-only bottom navigation bar.
class AppBottomNavbar extends StatelessWidget {
  final int currentIndex;
  final List<AppBottomNavbarItem> items;
  final ValueChanged<int> onItemSelected;

  const AppBottomNavbar({
    super.key,
    required this.currentIndex,
    required this.items,
    required this.onItemSelected,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;

    return Container(
      decoration: BoxDecoration(
        color: colors.surfacePrimary,
        border: Border(
          top: BorderSide(
            color: colors.borderSubtle,
            width: 1,
          ),
        ),
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 60,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              for (int i = 0; i < items.length; i++)
                _NavbarItemWidget(
                  item: items[i],
                  isSelected: currentIndex == i,
                  onTap: () => onItemSelected(i),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NavbarItemWidget extends StatelessWidget {
  final AppBottomNavbarItem item;
  final bool isSelected;
  final VoidCallback onTap;

  const _NavbarItemWidget({
    required this.item,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;
    final effectiveColor = isSelected ? colors.brandPrimary : colors.textSecondary;

    return InkWell(
      onTap: onTap,
      splashColor: Colors.transparent,
      highlightColor: Colors.transparent,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                Icon(
                  isSelected ? item.activeIcon : item.icon,
                  size: 24,
                  color: effectiveColor,
                ),
                if (item.badgeCount != null && item.badgeCount! > 0)
                  Positioned(
                    top: -4,
                    right: -8,
                    child: AppBadge.count(item.badgeCount),
                  ),
              ],
            ),
            const SizedBox(height: 3),
            Text(
              item.label,
              style: AppTypography.caption.copyWith(
                color: effectiveColor,
                fontSize: 11,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
