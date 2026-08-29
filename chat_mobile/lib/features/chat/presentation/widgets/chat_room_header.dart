import 'package:flutter/material.dart';
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
              AppSpacing.s8,
              AppSpacing.s12,
              AppSpacing.s8,
              AppSpacing.s12,
            ),
            child: Row(
              children: [
                AppIconButton(
                  icon: Icons.arrow_back_ios_new_rounded,
                  iconSize: 20,
                  tooltip: 'Back',
                  onPressed: onBack ?? () => Navigator.of(context).maybePop(),
                ),
                const SizedBox(width: AppSpacing.s4),
                AppAvatar(
                  name: conversation.name,
                  size: 40,
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
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        conversation.isOnline ? 'Online' : 'Offline',
                        style: AppTypography.caption.copyWith(
                          color: conversation.isOnline ? colors.onlineIndicator : colors.textTertiary,
                        ),
                      ),
                    ],
                  ),
                ),
                AppIconButton(
                  icon: Icons.phone_outlined,
                  tooltip: 'Voice Call',
                  onPressed: onVoiceCall ?? () {},
                ),
                AppIconButton(
                  icon: Icons.videocam_outlined,
                  tooltip: 'Video Call',
                  onPressed: onVideoCall ?? () {},
                ),
                AppIconButton(
                  icon: Icons.more_vert_rounded,
                  tooltip: 'More options',
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
