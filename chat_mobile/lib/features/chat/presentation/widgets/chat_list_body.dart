import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_gradients.dart';
import '../../../../app/theme/app_radius.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_theme_extension.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../core/utils/date_formatter.dart';
import '../../../../core/widgets/app_avatar.dart';
import '../../../../core/widgets/app_badge.dart';
import '../../../../core/widgets/app_divider.dart';
import '../../../../core/widgets/app_empty_state.dart';
import '../../../../core/widgets/app_text_field.dart';
import '../../models/mock_chat_models.dart';

enum ChatFilter { all, unread, pinned, groups, archived }

/// Body content for ChatList screen containing search input, horizontal filter chips, and conversation rows.
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

    return Column(
      children: [
        // Search Input Bar
        Padding(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.s16,
            AppSpacing.s4,
            AppSpacing.s16,
            AppSpacing.s8,
          ),
          child: AppTextField(
            controller: _searchController,
            hintText: 'Search chats or messages...',
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

        // Filter Chips Row
        SizedBox(
          height: 38,
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s16),
            children: [
              _buildFilterChip('All', ChatFilter.all),
              const SizedBox(width: AppSpacing.s8),
              _buildFilterChip('Unread', ChatFilter.unread),
              const SizedBox(width: AppSpacing.s8),
              _buildFilterChip('Pinned', ChatFilter.pinned),
              const SizedBox(width: AppSpacing.s8),
              _buildFilterChip('Groups', ChatFilter.groups),
              const SizedBox(width: AppSpacing.s8),
              _buildFilterChip('Archived', ChatFilter.archived),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.s8),

        // Conversation List
        Expanded(
          child: _filteredConversations.isEmpty
              ? AppEmptyState(
                  icon: Icons.chat_bubble_outline_rounded,
                  title: _searchQuery.isNotEmpty ? 'No chats found' : 'No conversations',
                  description: _searchQuery.isNotEmpty
                      ? 'Try searching with different keywords.'
                      : 'Start a conversation with someone.',
                )
              : ListView.separated(
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

  Widget _buildFilterChip(String label, ChatFilter filter) {
    final isSelected = _activeFilter == filter;
    final colors = context.appColors;

    return GestureDetector(
      onTap: () => setState(() => _activeFilter = filter),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          gradient: isSelected ? AppGradients.purpleGradient : null,
          color: isSelected ? null : colors.surfaceSecondary,
          borderRadius: AppRadius.pill,
          border: Border.all(
            color: isSelected ? Colors.transparent : colors.borderDefault,
            width: 1,
          ),
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: AppTypography.caption.copyWith(
            color: isSelected ? Colors.white : colors.textSecondary,
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
            fontSize: 12,
          ),
        ),
      ),
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
        splashColor: AppColors.brandPrimary.withValues(alpha: 0.1),
        highlightColor: AppColors.brandPrimary.withValues(alpha: 0.05),
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.s16,
            vertical: AppSpacing.s12,
          ),
          child: Row(
            children: [
              AppAvatar(
                name: conversation.name,
                size: 50,
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
                              fontSize: 15,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: AppSpacing.s8),
                        Text(
                          DateFormatter.formatConversationDate(conversation.timestamp),
                          style: AppTypography.caption.copyWith(
                            color: hasUnread ? AppColors.brandFocus : colors.textTertiary,
                            fontWeight: hasUnread ? FontWeight.w600 : FontWeight.w400,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
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

