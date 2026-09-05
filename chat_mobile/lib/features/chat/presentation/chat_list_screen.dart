import 'package:flutter/material.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_theme_extension.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/sb_icons.dart';
import '../../../core/widgets/app_avatar.dart';
import '../../../core/widgets/app_icon_button.dart';
import '../../../core/widgets/app_scaffold.dart';
import 'widgets/chat_list_body.dart';

/// Screen displaying the active conversations list with filter chips and search.
class ChatListScreen extends StatelessWidget {
  const ChatListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;

    return AppScaffold(
      safeAreaTop: true,
      safeAreaBottom: false,
      header: Container(
        color: colors.surfacePrimary,
        padding: const EdgeInsets.fromLTRB(
          AppSpacing.s16,
          AppSpacing.s12,
          AppSpacing.s16,
          AppSpacing.s12,
        ),
        child: Row(
          children: [
            const AppAvatar(
              name: 'Alexander Wright',
              size: 40,
              showOnlineIndicator: true,
              isOnline: true,
            ),
            const SizedBox(width: AppSpacing.s12),
            Expanded(
              child: Text(
                'Chats',
                style: AppTypography.headlineLarge.copyWith(
                  color: colors.textPrimary,
                  fontWeight: FontWeight.w800,
                  fontSize: 22,
                ),
              ),
            ),
            AppIconButton(
              icon: SBIcons.newChat,
              iconSize: 20,
              tooltip: 'New message',
              color: colors.brandPrimary,
              onPressed: () {},
            ),
          ],
        ),
      ),
      floatingActionButton: Container(
        width: 56,
        height: 56,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: colors.brandGradient,
          boxShadow: [
            BoxShadow(
              color: colors.brandPrimary.withValues(alpha: 0.4),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Material(
          color: Colors.transparent,
          shape: const CircleBorder(),
          child: InkWell(
            onTap: () {},
            customBorder: const CircleBorder(),
            child: const Center(
              child: Icon(
                SBIcons.addChat,
                color: Colors.white,
                size: 24,
              ),
            ),
          ),
        ),
      ),
      body: const ChatListBody(),
    );
  }
}
