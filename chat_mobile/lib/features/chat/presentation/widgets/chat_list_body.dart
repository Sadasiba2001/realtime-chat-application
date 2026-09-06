import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_theme_extension.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../app/theme/sb_icons.dart';
import '../../../../core/utils/date_formatter.dart';
import '../../../../core/widgets/app_avatar.dart';
import '../../../../core/widgets/app_badge.dart';
import '../../../../core/widgets/app_divider.dart';
import '../../../../core/widgets/app_empty_state.dart';
import '../../../../core/widgets/app_text_field.dart';
import '../../models/mock_chat_models.dart';
import 'sb_chat_filter_bar.dart';

enum ChatFilter { all, unread, pinned, groups, archived }

/// Body content for ChatList screen containing search input, unified segmented filter bar, and conversation rows.
class ChatListBody extends StatefulWidget {
  const ChatListBody({super.key});

  @override
  State<ChatListBody> createState() => _ChatListBodyState();
}

class _ChatListBodyState extends State<ChatListBody> {
  final TextEditingController _searchController = TextEditingController();
  final List<ChatConversation> _conversations = ChatConversation.mockConversations;
  String _searchQuery = '';
  ChatFilter _activeFilter = ChatFilter.all;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  int get _unreadCount => _conversations.where((c) => c.unreadCount > 0).length;
  int get _groupsCount => _conversations.where((c) => c.isGroup).length;

  List<ChatConversation> get _filteredConversations {
    List<ChatConversation> list = _conversations;

    // Apply category filter
    switch (_activeFilter) {
      case ChatFilter.all:
        break;
      case ChatFilter.unread:
        list = list.where((c) => c.unreadCount > 0).toList();
        break;
      case ChatFilter.pinned:
        list = list.where((c) => c.id == '1' || c.id == '2').toList();
        break;
      case ChatFilter.groups:
        list = list.where((c) => c.isGroup).toList();
        break;
      case ChatFilter.archived:
        list = [];
        break;
    }

    // Apply text search query
    if (_searchQuery.trim().isEmpty) return list;
    return list
        .where((c) =>
            c.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
            c.lastMessage.toLowerCase().contains(_searchQuery.toLowerCase()))
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;

    final filterItems = [
      const SBChatFilterItem(label: 'All Chats', keyId: ChatFilter.all),
      SBChatFilterItem(label: 'Unread', keyId: ChatFilter.unread, count: _unreadCount),
      const SBChatFilterItem(label: 'Pinned', keyId: ChatFilter.pinned),
      SBChatFilterItem(label: 'Groups', keyId: ChatFilter.groups, count: _groupsCount),
      const SBChatFilterItem(label: 'Archived', keyId: ChatFilter.archived),
    ];

    return Column(
      children: [
        // Search Input Bar
        Padding(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.s16,
            AppSpacing.s2,
            AppSpacing.s16,
            AppSpacing.s10,
          ),
          child: AppTextField(
            controller: _searchController,
            hintText: 'Search chats or messages...',
            prefix: Icon(SBIcons.search, color: colors.textTertiary, size: 22),
            suffix: _searchQuery.isNotEmpty
                ? IconButton(
                    icon: Icon(SBIcons.clear, color: colors.textTertiary, size: 18),
                    onPressed: () {
                      _searchController.clear();
                      setState(() => _searchQuery = '');
                    },
                  )
                : null,
            onChanged: (val) => setState(() => _searchQuery = val),
          ),
        ),

        // Unified Segmented Filter Bar
        SBChatFilterBar(
          filters: filterItems,
          selectedFilter: _activeFilter,
          onFilterSelected: (val) => setState(() => _activeFilter = val as ChatFilter),
        ),
        const SizedBox(height: AppSpacing.s10),

        // Conversation List
        Expanded(
          child: _filteredConversations.isEmpty
              ? AppEmptyState(
                  icon: SBIcons.chatsOutline,
                  title: _searchQuery.isNotEmpty ? 'No chats found' : 'No conversations',
                  description: _searchQuery.isNotEmpty
                      ? 'Try searching with different keywords.'
                      : 'Start a conversation and connect with someone.',
                )
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(0, 4, 0, 160), // Generous clearance for floating nav & FAB
                  itemCount: _filteredConversations.length,
                  separatorBuilder: (context, index) => const AppDivider(indent: 80),
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
        splashColor: colors.brandPrimary.withValues(alpha: 0.08),
        highlightColor: colors.brandPrimary.withValues(alpha: 0.04),
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.s16,
            vertical: 13.0,
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              AppAvatar(
                name: conversation.name,
                size: 52,
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
                            style: AppTypography.headlineSmall.copyWith(
                              color: colors.textPrimary,
                              fontWeight: hasUnread ? FontWeight.w700 : FontWeight.w600,
                              fontSize: 16.5,
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
                            fontWeight: hasUnread ? FontWeight.w600 : FontWeight.w500,
                            fontSize: 13.0,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4.5),
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            conversation.lastMessage,
                            style: AppTypography.bodySmall.copyWith(
                              color: hasUnread ? colors.textPrimary : colors.textSecondary,
                              fontWeight: hasUnread ? FontWeight.w500 : FontWeight.w400,
                              fontSize: 14.5,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (conversation.isMuted) ...[
                          const SizedBox(width: AppSpacing.s8),
                          Icon(
                            SBIcons.muted,
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
