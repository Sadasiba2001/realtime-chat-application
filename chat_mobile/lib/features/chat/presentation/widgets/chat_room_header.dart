import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_theme_extension.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../core/widgets/app_avatar.dart';
import '../../../../core/widgets/app_divider.dart';
import '../../../../core/widgets/app_icon_button.dart';
import '../../models/mock_chat_models.dart';

/// Dedicated header for Chat Room displaying back button, contact status, and call actions.
class ChatRoomHeader extends StatelessWidget {
  final ChatConversation conversation;
  final VoidCallback? onBack;
  final VoidCallback? onVoiceCall;
  final VoidCallback? onVideoCall;
  final VoidCallback? onMoreOptions;

  const ChatRoomHeader({
    super.key,
    required this.conversation,
    this.onBack,
    this.onVoiceCall,
    this.onVideoCall,
    this.onMoreOptions,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;

    return Container(
      color: colors.surfacePrimary,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(
              AppSpacing.s4,
              AppSpacing.s8,
              AppSpacing.s8,
              AppSpacing.s8,
            ),
            child: Row(
              children: [
                AppIconButton(
                  icon: Icons.arrow_back_ios_new_rounded,
                  iconSize: 18,
                  tooltip: 'Back',
                  color: colors.textPrimary,
                  onPressed: onBack ?? () => Navigator.of(context).maybePop(),
                ),
                const SizedBox(width: AppSpacing.s4),
                AppAvatar(
                  name: conversation.name,
                  size: 38,
                  showOnlineIndicator: true,
                  isOnline: conversation.isOnline,
                ),
                const SizedBox(width: AppSpacing.s12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        conversation.name,
                        style: AppTypography.labelLarge.copyWith(
                          color: colors.textPrimary,
                          fontWeight: FontWeight.w700,
                          fontSize: 15,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 1),
                      Row(
                        children: [
                          if (conversation.isOnline) ...[
                            Container(
                              width: 6,
                              height: 6,
                              margin: const EdgeInsets.only(right: 5),
                              decoration: const BoxDecoration(
                                color: AppColors.onlineIndicator,
                                shape: BoxShape.circle,
                              ),
                            ),
                          ],
                          Text(
                            conversation.isOnline ? 'Online' : 'Offline',
                            style: AppTypography.caption.copyWith(
                              color: conversation.isOnline
                                  ? AppColors.onlineIndicator
                                  : colors.textTertiary,
                              fontSize: 11,
                              fontWeight: conversation.isOnline ? FontWeight.w600 : FontWeight.w400,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                AppIconButton(
                  icon: Icons.phone_outlined,
                  iconSize: 20,
                  tooltip: 'Voice Call',
                  color: AppColors.brandPrimary,
                  onPressed: onVoiceCall ?? () {},
                ),
                AppIconButton(
                  icon: Icons.videocam_outlined,
                  iconSize: 22,
                  tooltip: 'Video Call',
                  color: AppColors.brandPrimary,
                  onPressed: onVideoCall ?? () {},
                ),
                AppIconButton(
                  icon: Icons.more_vert_rounded,
                  iconSize: 20,
                  tooltip: 'More options',
                  color: colors.textSecondary,
                  onPressed: onMoreOptions ?? () {},
                ),
              ],
            ),
          ),
          const AppDivider(),
        ],
      ),
    );
  }
}

