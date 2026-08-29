import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_theme_extension.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../core/utils/date_formatter.dart';
import '../../../../core/widgets/app_avatar.dart';
import '../../../../core/widgets/app_badge.dart';
import '../../../../core/widgets/app_divider.dart';
import '../../../../core/widgets/app_text_field.dart';
import '../../models/mock_chat_models.dart';

/// Body content for ChatList screen containing search input and conversation rows.
class ChatListBody extends StatefulWidget {
  const ChatListBody({super.key});

  @override
  State<ChatListBody> createState() => _ChatListBodyState();
}

class _ChatListBodyState extends State<ChatListBody> {
  final TextEditingController _searchController = TextEditingController();
  final List<ChatConversation> _conversations = ChatConversation.mockConversations;
  String _searchQuery = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<ChatConversation> get _filteredConversations {
    if (_searchQuery.trim().isEmpty) return _conversations;
    return _conversations
        .where((c) =>
            c.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
            c.lastMessage.toLowerCase().contains(_searchQuery.toLowerCase()))
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;

    return Column(
      children: [
        // Search Input Bar
        Padding(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.s16,
            AppSpacing.s4,
            AppSpacing.s16,
            AppSpacing.s12,
          ),
          child: AppTextField(
            controller: _searchController,
            hintText: 'Search chats, contacts, or messages...',
            prefix: Icon(Icons.search_rounded, color: colors.textTertiary, size: 20),
            suffix: _searchQuery.isNotEmpty
                ? IconButton(
                    icon: Icon(Icons.clear_rounded, color: colors.textTertiary, size: 18),
                    onPressed: () {
                      _searchController.clear();
                      setState(() => _searchQuery = '');
                    },
                  )
                : null,
            onChanged: (val) => setState(() => _searchQuery = val),
          ),
        ),

        // Conversation List
        Expanded(
          child: ListView.separated(
            itemCount: _filteredConversations.length,
            separatorBuilder: (context, index) => const AppDivider(indent: 76),
            itemBuilder: (context, index) {
              final conversation = _filteredConversations[index];
              return _ConversationRow(
                conversation: conversation,
                onTap: () {
                  context.push('/chat/${conversation.id}');
                },
              );
            },
          ),
        ),
      ],
    );
  }
}

class _ConversationRow extends StatelessWidget {
  final ChatConversation conversation;
  final VoidCallback onTap;

  const _ConversationRow({
    required this.conversation,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;
    final hasUnread = conversation.unreadCount > 0;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.s16,
            vertical: AppSpacing.s12,
          ),
          child: Row(
            children: [
              AppAvatar(
                name: conversation.name,
                size: 48,
                showOnlineIndicator: !conversation.isGroup,
                isOnline: conversation.isOnline,
              ),
              const SizedBox(width: AppSpacing.s12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            conversation.name,
                            style: AppTypography.labelLarge.copyWith(
                              color: colors.textPrimary,
                              fontWeight: hasUnread ? FontWeight.w700 : FontWeight.w600,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: AppSpacing.s8),
                        Text(
                          DateFormatter.formatConversationDate(conversation.timestamp),
                          style: AppTypography.caption.copyWith(
                            color: hasUnread ? colors.brandPrimary : colors.textTertiary,
                            fontWeight: hasUnread ? FontWeight.w600 : FontWeight.w400,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.s4),
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            conversation.lastMessage,
                            style: AppTypography.bodySmall.copyWith(
                              color: hasUnread ? colors.textPrimary : colors.textSecondary,
                              fontWeight: hasUnread ? FontWeight.w500 : FontWeight.w400,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (conversation.isMuted) ...[
                          const SizedBox(width: AppSpacing.s8),
                          Icon(
                            Icons.volume_off_rounded,
                            size: 16,
                            color: colors.textTertiary,
                          ),
                        ],
                        if (hasUnread) ...[
                          const SizedBox(width: AppSpacing.s8),
                          AppBadge.count(conversation.unreadCount),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
