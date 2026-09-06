import 'package:flutter/material.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_theme_extension.dart';
import '../../app/theme/app_typography.dart';

/// Clean user avatar with initials fallback and presence indicator badge.
class AppAvatar extends StatelessWidget {
  final String name;
  final String? imageUrl;
  final double size;
  final bool showOnlineIndicator;
  final bool isOnline;

  const AppAvatar({
    super.key,
    required this.name,
    this.imageUrl,
    this.size = 44.0,
    this.showOnlineIndicator = false,
    this.isOnline = false,
  });

  String _getInitials() {
    final trimmed = name.trim();
    if (trimmed.isEmpty) return '?';
    final parts = trimmed.split(RegExp(r'\s+'));
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return trimmed.substring(0, trimmed.length >= 2 ? 2 : 1).toUpperCase();
  }

  LinearGradient _generateGradientForName(String name) {
    final hash = name.codeUnits.fold(0, (prev, curr) => prev + curr);
    final palettes = [
      const LinearGradient(
        colors: [Color(0xFF6D3CFF), Color(0xFF8B5CF6)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
      const LinearGradient(
        colors: [Color(0xFF3B82F6), Color(0xFF60A5FA)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
      const LinearGradient(
        colors: [Color(0xFF059669), Color(0xFF34D399)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
      const LinearGradient(
        colors: [Color(0xFFD97706), Color(0xFFFBBF24)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
      const LinearGradient(
        colors: [Color(0xFFDB2777), Color(0xFFF472B6)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
      const LinearGradient(
        colors: [Color(0xFF4F46E5), Color(0xFF818CF8)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
    ];
    return palettes[hash % palettes.length];
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;
    final initials = _getInitials();
    final gradient = _generateGradientForName(name);

    Widget avatarCore = Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: gradient,
        border: Border.all(
          color: colors.borderDefault.withValues(alpha: 0.6),
          width: 1.2,
        ),
      ),
      alignment: Alignment.center,
      child: Text(
        initials,
        style: AppTypography.labelLarge.copyWith(
          fontSize: size * 0.38,
          color: Colors.white,
          fontWeight: FontWeight.w700,
        ),
      ),
    );

    if (!showOnlineIndicator) {
      return avatarCore;
    }

    final indicatorSize = (size * 0.28).clamp(10.0, 14.0);

    return Stack(
      clipBehavior: Clip.none,
      children: [
        avatarCore,
        Positioned(
          right: 0,
          bottom: 0,
          child: Container(
            width: indicatorSize,
            height: indicatorSize,
            decoration: BoxDecoration(
              color: isOnline ? AppColors.onlineIndicator : AppColors.offlineIndicator,
              shape: BoxShape.circle,
              border: Border.all(
                color: colors.backgroundPrimary,
                width: 2,
              ),
            ),
          ),
        ),
      ],
    );
  }
}
