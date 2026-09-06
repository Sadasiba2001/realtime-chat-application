import 'package:flutter/material.dart';
import '../../app/theme/app_spacing.dart';
import '../../app/theme/app_theme_extension.dart';
import '../../app/theme/app_typography.dart';
import 'app_divider.dart';

/// Reusable, composable screen header component.
///
/// Designed to provide consistent alignment, typography, and optional trailing/avatar elements
/// without hardcoding feature-specific business logic.
class AppHeader extends StatelessWidget {
  final String? title;
  final Widget? titleWidget;
  final String? subtitle;
  final Widget? leading;
  final Widget? trailing;
  final List<Widget>? actions;
  final Widget? avatar;
  final Widget? bottom;
  final EdgeInsetsGeometry? padding;
  final bool showDivider;
  final Color? backgroundColor;

  const AppHeader({
    super.key,
    this.title,
    this.titleWidget,
    this.subtitle,
    this.leading,
    this.trailing,
    this.actions,
    this.avatar,
    this.bottom,
    this.padding,
    this.showDivider = false,
    this.backgroundColor,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;

    Widget? effectiveTitle = titleWidget;
    if (effectiveTitle == null && title != null) {
      if (subtitle != null) {
        effectiveTitle = Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              title!,
              style: AppTypography.headlineLarge.copyWith(
                color: colors.textPrimary,
                fontWeight: FontWeight.w700,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 2),
            Text(
              subtitle!,
              style: AppTypography.caption.copyWith(
                color: colors.textSecondary,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        );
      } else {
        effectiveTitle = Text(
          title!,
          style: AppTypography.headlineLarge.copyWith(
            color: colors.textPrimary,
            fontWeight: FontWeight.w700,
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        );
      }
    }

    // Resolve right-side trailing elements
    Widget? effectiveTrailing = trailing;
    if (effectiveTrailing == null) {
      if (avatar != null) {
        effectiveTrailing = avatar;
      } else if (actions != null && actions!.isNotEmpty) {
        effectiveTrailing = Row(
          mainAxisSize: MainAxisSize.min,
          children: actions!,
        );
      }
    }

    final effectivePadding = padding ??
        const EdgeInsets.fromLTRB(
          AppSpacing.s20,
          AppSpacing.s16,
          AppSpacing.s20,
          AppSpacing.s12,
        );

    return Container(
      color: backgroundColor ?? Colors.transparent,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: effectivePadding,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                ?leading,
                if (leading != null) const SizedBox(width: AppSpacing.s12),
                if (effectiveTitle != null) Expanded(child: effectiveTitle),
                ?effectiveTrailing,
              ],
            ),
          ),
          ?bottom,
          if (showDivider) const AppDivider(),
        ],
      ),
    );
  }
}
