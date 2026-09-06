import 'package:flutter/material.dart';
import '../../../../app/theme/app_radius.dart';
import '../../../../app/theme/app_theme_extension.dart';
import '../../../../app/theme/app_typography.dart';

/// Data class representing an item in the [SBChatFilterBar].
class SBChatFilterItem {
  final String label;
  final dynamic keyId;
  final int? count;

  const SBChatFilterItem({
    required this.label,
    required this.keyId,
    this.count,
  });
}

/// Unified segmented chat filter bar with a soft sliding selected inner capsule.
///
/// Directly translates the Telegram reference interaction model into the SB Chat
/// design system: one continuous rounded outer container hosting an animated inner active pill.
class SBChatFilterBar extends StatelessWidget {
  final List<SBChatFilterItem> filters;
  final dynamic selectedFilter;
  final ValueChanged<dynamic> onFilterSelected;

  const SBChatFilterBar({
    super.key,
    required this.filters,
    required this.selectedFilter,
    required this.onFilterSelected,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;

    return Container(
      height: 48,
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(3.5),
      decoration: BoxDecoration(
        color: colors.filterOuterBg,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: colors.borderDefault,
          width: 1,
        ),
      ),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final totalFilters = filters.length;
          // If 2 or 3 items, expand equally to fill the bar. If more, enable horizontal scroll.
          if (totalFilters <= 3) {
            return Row(
              children: [
                for (int i = 0; i < totalFilters; i++)
                  Expanded(
                    child: _FilterSegment(
                      item: filters[i],
                      isSelected: filters[i].keyId == selectedFilter,
                      onTap: () => onFilterSelected(filters[i].keyId),
                    ),
                  ),
              ],
            );
          }

          return SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                for (int i = 0; i < totalFilters; i++)
                  Padding(
                    padding: EdgeInsets.only(right: i == totalFilters - 1 ? 0 : 4),
                    child: _FilterSegment(
                      item: filters[i],
                      isSelected: filters[i].keyId == selectedFilter,
                      onTap: () => onFilterSelected(filters[i].keyId),
                      minWidth: 88,
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _FilterSegment extends StatelessWidget {
  final SBChatFilterItem item;
  final bool isSelected;
  final VoidCallback onTap;
  final double? minWidth;

  const _FilterSegment({
    required this.item,
    required this.isSelected,
    required this.onTap,
    this.minWidth,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final activeTextColor = isSelected ? colors.filterActiveText : colors.textSecondary;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 220),
      curve: Curves.easeOutCubic,
      constraints: minWidth != null ? BoxConstraints(minWidth: minWidth!) : null,
      decoration: BoxDecoration(
        color: isSelected ? colors.filterActiveCapsule : Colors.transparent,
        borderRadius: BorderRadius.circular(20),
        border: isSelected
            ? Border.all(
                color: isDark
                    ? colors.brandPrimary.withValues(alpha: 0.25)
                    : colors.brandPrimary.withValues(alpha: 0.15),
                width: 1,
              )
            : null,
        boxShadow: isSelected
            ? [
                BoxShadow(
                  color: colors.brandPrimary.withValues(alpha: isDark ? 0.15 : 0.08),
                  blurRadius: 6,
                  offset: const Offset(0, 2),
                ),
              ]
            : null,
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(20),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(20),
          splashColor: colors.brandPrimary.withValues(alpha: 0.1),
          highlightColor: colors.brandPrimary.withValues(alpha: 0.05),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                AnimatedDefaultTextStyle(
                  duration: const Duration(milliseconds: 200),
                  style: AppTypography.caption.copyWith(
                    color: activeTextColor,
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                    fontSize: 14.5,
                  ),
                  child: Text(item.label),
                ),
                if (item.count != null && item.count! > 0) ...[
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? colors.brandPrimary
                          : colors.surfaceSecondary,
                      borderRadius: AppRadius.pill,
                    ),
                    child: Text(
                      item.count! > 99 ? '99+' : item.count.toString(),
                      style: AppTypography.caption.copyWith(
                        color: isSelected ? Colors.white : colors.textSecondary,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        height: 1.1,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
