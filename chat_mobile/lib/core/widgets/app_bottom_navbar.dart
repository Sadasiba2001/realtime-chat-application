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

/// Floating bottom navigation bar with a large soft inner active container.
///
/// Directly translates the Telegram reference interaction model into the SB Chat
/// design system: floating rounded container hosting a soft active capsule around the selected item.
class AppBottomNavbar extends StatelessWidget {
  final int currentIndex;
  final List<AppBottomNavbarItem> items;
  final ValueChanged<int> onItemSelected;
  final bool isLocked;
  final ValueChanged<bool>? onLockChanged;

  const AppBottomNavbar({
    super.key,
    required this.currentIndex,
    required this.items,
    required this.onItemSelected,
    this.isLocked = false,
    this.onLockChanged,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return SafeArea(
      top: false,
      child: Container(
        margin: const EdgeInsets.fromLTRB(16, 0, 16, 10),
        height: 60,
        decoration: BoxDecoration(
          color: colors.navOuterBg,
          borderRadius: BorderRadius.circular(26),
          border: Border.all(
            color: colors.borderDefault,
            width: 1,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.05),
              blurRadius: isDark ? 12 : 8,
              offset: const Offset(0, 2),
              spreadRadius: 0,
            ),
          ],
        ),
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            for (int i = 0; i < items.length; i++)
              Expanded(
                child: _FloatingNavItem(
                  item: items[i],
                  isSelected: currentIndex == i,
                  onTap: () => onItemSelected(i),
                ),
              ),
            Expanded(
              child: _AnimatedLockAction(
                isLocked: isLocked,
                onLockChanged: onLockChanged,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FloatingNavItem extends StatelessWidget {
  final AppBottomNavbarItem item;
  final bool isSelected;
  final VoidCallback onTap;

  const _FloatingNavItem({
    required this.item,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final iconColor = isSelected ? colors.navActiveIcon : colors.navInactive;
    final labelColor = isSelected ? colors.navActiveLabel : colors.navInactive;

    return InkWell(
      onTap: onTap,
      splashColor: Colors.transparent,
      highlightColor: Colors.transparent,
      borderRadius: BorderRadius.circular(18),
      child: Center(
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOutCubic,
          padding: const EdgeInsets.symmetric(vertical: 3.5, horizontal: 10),
          decoration: BoxDecoration(
            color: isSelected ? colors.navActiveCapsule : Colors.transparent,
            borderRadius: BorderRadius.circular(16),
            border: isSelected
                ? Border.all(
                    color: isDark
                        ? colors.brandPrimary.withValues(alpha: 0.18)
                        : colors.brandPrimary.withValues(alpha: 0.10),
                    width: 1,
                  )
                : null,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Stack(
                clipBehavior: Clip.none,
                children: [
                  Icon(
                    isSelected ? item.activeIcon : item.icon,
                    size: 21.5,
                    color: iconColor,
                  ),
                  if (item.badgeCount != null && item.badgeCount! > 0)
                    Positioned(
                      top: -3,
                      right: -8,
                      child: AppBadge.count(item.badgeCount),
                    ),
                ],
              ),
              const SizedBox(height: 2),
              Text(
                item.label,
                style: AppTypography.caption.copyWith(
                  color: labelColor,
                  fontSize: 11.5,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                  height: 1.1,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AnimatedLockAction extends StatefulWidget {
  final bool isLocked;
  final ValueChanged<bool>? onLockChanged;

  const _AnimatedLockAction({
    this.isLocked = false,
    this.onLockChanged,
  });

  @override
  State<_AnimatedLockAction> createState() => _AnimatedLockActionState();
}

class _AnimatedLockActionState extends State<_AnimatedLockAction>
    with SingleTickerProviderStateMixin {
  late bool _isLocked;
  late AnimationController _animController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _rotateAnimation;

  @override
  void initState() {
    super.initState();
    _isLocked = widget.isLocked;
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 320),
    );
    _scaleAnimation = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween(begin: 1.0, end: 1.22).chain(CurveTween(curve: Curves.easeOut)),
        weight: 45,
      ),
      TweenSequenceItem(
        tween: Tween(begin: 1.22, end: 1.0).chain(CurveTween(curve: Curves.elasticOut)),
        weight: 55,
      ),
    ]).animate(_animController);

    _rotateAnimation = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween(begin: 0.0, end: -0.16).chain(CurveTween(curve: Curves.easeInOut)),
        weight: 35,
      ),
      TweenSequenceItem(
        tween: Tween(begin: -0.16, end: 0.08).chain(CurveTween(curve: Curves.easeInOut)),
        weight: 35,
      ),
      TweenSequenceItem(
        tween: Tween(begin: 0.08, end: 0.0).chain(CurveTween(curve: Curves.easeOut)),
        weight: 30,
      ),
    ]).animate(_animController);
  }

  @override
  void didUpdateWidget(covariant _AnimatedLockAction oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isLocked != oldWidget.isLocked && widget.isLocked != _isLocked) {
      setState(() => _isLocked = widget.isLocked);
      _playAnimation();
    }
  }

  void _playAnimation() {
    _animController.forward(from: 0.0);
  }

  void _toggleLock() {
    setState(() {
      _isLocked = !_isLocked;
    });
    _playAnimation();
    widget.onLockChanged?.call(_isLocked);
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final iconColor = _isLocked ? colors.brandPrimary : colors.navInactive;
    final labelColor = _isLocked ? colors.brandPrimary : colors.navInactive;

    return InkWell(
      onTap: _toggleLock,
      splashColor: Colors.transparent,
      highlightColor: Colors.transparent,
      borderRadius: BorderRadius.circular(18),
      child: Center(
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOutCubic,
          padding: const EdgeInsets.symmetric(vertical: 3.5, horizontal: 10),
          decoration: BoxDecoration(
            color: _isLocked ? colors.navActiveCapsule : Colors.transparent,
            borderRadius: BorderRadius.circular(16),
            border: _isLocked
                ? Border.all(
                    color: isDark
                        ? colors.brandPrimary.withValues(alpha: 0.18)
                        : colors.brandPrimary.withValues(alpha: 0.10),
                    width: 1,
                  )
                : null,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              AnimatedBuilder(
                animation: _animController,
                builder: (context, child) {
                  return Transform.scale(
                    scale: _scaleAnimation.value,
                    child: Transform.rotate(
                      angle: _rotateAnimation.value,
                      child: AnimatedSwitcher(
                        duration: const Duration(milliseconds: 250),
                        transitionBuilder: (child, animation) => FadeTransition(
                          opacity: animation,
                          child: ScaleTransition(scale: animation, child: child),
                        ),
                        child: Icon(
                          _isLocked ? Icons.lock_rounded : Icons.lock_open_rounded,
                          key: ValueKey<bool>(_isLocked),
                          size: 21.5,
                          color: iconColor,
                        ),
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: 2),
              Text(
                _isLocked ? 'Locked' : 'Lock',
                style: AppTypography.caption.copyWith(
                  color: labelColor,
                  fontSize: 11.5,
                  fontWeight: _isLocked ? FontWeight.w600 : FontWeight.w500,
                  height: 1.1,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
