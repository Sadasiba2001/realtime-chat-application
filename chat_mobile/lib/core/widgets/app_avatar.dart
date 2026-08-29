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

  Color _generateColorForName(String name) {
    final hash = name.codeUnits.fold(0, (prev, curr) => prev + curr);
    final palette = [
      const Color(0xFFA534B0), // Brand
      const Color(0xFF3B82F6), // Blue
      const Color(0xFF10B981), // Emerald
      const Color(0xFFF59E0B), // Amber
      const Color(0xFF8B5CF6), // Violet
      const Color(0xFFEC4899), // Pink
      const Color(0xFF06B6D4), // Cyan
      const Color(0xFF6366F1), // Indigo
    ];
    return palette[hash % palette.length];
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;
    final initials = _getInitials();
    final avatarColor = _generateColorForName(name);

    Widget avatarCore = Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: avatarColor.withValues(alpha: 0.16),
        border: Border.all(
          color: colors.borderSubtle,
          width: 1,
        ),
      ),
      alignment: Alignment.center,
      child: Text(
        initials,
        style: AppTypography.labelLarge.copyWith(
          fontSize: size * 0.38,
          color: avatarColor,
          fontWeight: FontWeight.w700,
        ),
      ),
    );

    if (!showOnlineIndicator) {
      return avatarCore;
    }

    final indicatorSize = (size * 0.28).clamp(9.0, 14.0);

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
                color: colors.surfacePrimary,
                width: 2,
              ),
            ),
          ),
        ),
      ],
    );
  }
}
