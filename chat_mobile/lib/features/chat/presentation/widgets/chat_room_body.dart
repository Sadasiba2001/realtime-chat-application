import 'package:flutter/material.dart';
import '../../../../app/theme/app_radius.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_theme_extension.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../core/utils/date_formatter.dart';
import '../../../../core/widgets/app_icon_button.dart';
import '../../models/mock_chat_models.dart';

/// Body component for Chat Room hosting the message timeline and composer bar.
class ChatRoomBody extends StatefulWidget {
  final String conversationId;
  final ChatConversation conversation;

  const ChatRoomBody({
    super.key,
    required this.conversationId,
    required this.conversation,
  });

  @override
  State<ChatRoomBody> createState() => _ChatRoomBodyState();
}

class _ChatRoomBodyState extends State<ChatRoomBody> {
  late final List<ChatMessage> _messages;
  final TextEditingController _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool _isComposing = false;

  @override
  void initState() {
    super.initState();
    _messages = ChatMessage.getMockMessagesFor(widget.conversationId);
  }

  @override
  void dispose() {
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _sendMessage() {
    final text = _textController.text.trim();
    if (text.isEmpty) return;

    setState(() {
      _messages.add(
        ChatMessage(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          senderId: 'me',
          senderName: 'You',
          text: text,
          timestamp: DateTime.now(),
          isOutgoing: true,
          status: MessageDeliveryStatus.sent,
        ),
      );
      _textController.clear();
      _isComposing = false;
    });

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;

    return Column(
      children: [
        // Message Timeline
        Expanded(
          child: ListView(
            controller: _scrollController,
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.s16,
              vertical: AppSpacing.s12,
            ),
            children: [
              _buildDateDivider('Today', colors),
              const SizedBox(height: AppSpacing.s16),
              for (final message in _messages) ...[
                _MessageBubble(message: message),
                const SizedBox(height: AppSpacing.s8),
              ],
              const SizedBox(height: AppSpacing.s4),
              _buildTypingIndicator(colors),
            ],
          ),
        ),

        // Bottom Message Composer
        _buildComposer(colors),
      ],
    );
  }

  Widget _buildDateDivider(String label, dynamic colors) {
    return Center(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        decoration: BoxDecoration(
          color: colors.surfaceSecondary,
          borderRadius: AppRadius.pill,
          border: Border.all(color: colors.borderSubtle, width: 1),
        ),
        child: Text(
          label,
          style: AppTypography.caption.copyWith(
            color: colors.textSecondary,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }

  Widget _buildTypingIndicator(dynamic colors) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s12, vertical: AppSpacing.s8),
        decoration: BoxDecoration(
          color: colors.chatBubbleIncoming,
          borderRadius: AppRadius.incomingBubble,
          border: Border.all(color: colors.borderSubtle, width: 1),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              '${widget.conversation.name.split(' ').first} is typing',
              style: AppTypography.caption.copyWith(color: colors.textSecondary),
            ),
            const SizedBox(width: AppSpacing.s8),
            _PulseDots(color: colors.brandPrimary),
          ],
        ),
      ),
    );
  }

  Widget _buildComposer(dynamic colors) {
    return Container(
      padding: EdgeInsets.fromLTRB(
        AppSpacing.s8,
        AppSpacing.s8,
        AppSpacing.s8,
        MediaQuery.of(context).padding.bottom + AppSpacing.s8,
      ),
      decoration: BoxDecoration(
        color: colors.surfacePrimary,
        border: Border(top: BorderSide(color: colors.borderSubtle, width: 1)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          AppIconButton(
            icon: Icons.add_circle_outline_rounded,
            tooltip: 'Add attachment',
            color: colors.textSecondary,
            onPressed: () {},
          ),
          Expanded(
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: AppSpacing.s4),
              decoration: BoxDecoration(
                color: colors.surfaceSecondary,
                borderRadius: AppRadius.large,
                border: Border.all(color: colors.borderSubtle, width: 1),
              ),
              child: TextField(
                controller: _textController,
                maxLines: 5,
                minLines: 1,
                textInputAction: TextInputAction.newline,
                onChanged: (val) {
                  final composing = val.trim().isNotEmpty;
                  if (composing != _isComposing) {
                    setState(() => _isComposing = composing);
                  }
                },
                style: AppTypography.body.copyWith(color: colors.textPrimary),
                cursorColor: colors.brandPrimary,
                decoration: InputDecoration(
                  hintText: 'Message...',
                  hintStyle: AppTypography.body.copyWith(color: colors.textTertiary),
                  border: InputBorder.none,
                  enabledBorder: InputBorder.none,
                  focusedBorder: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.s16,
                    vertical: AppSpacing.s12,
                  ),
                ),
              ),
            ),
          ),
          if (_isComposing)
            AppIconButton.filled(
              icon: Icons.send_rounded,
              tooltip: 'Send',
              onPressed: _sendMessage,
              color: Colors.white,
              backgroundColor: colors.brandPrimary,
            )
          else
            AppIconButton(
              icon: Icons.mic_none_rounded,
              tooltip: 'Voice message',
              color: colors.textSecondary,
              onPressed: () {},
            ),
        ],
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  final ChatMessage message;

  const _MessageBubble({required this.message});

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;
    final isOutgoing = message.isOutgoing;

    final bg = isOutgoing ? colors.chatBubbleOutgoing : colors.chatBubbleIncoming;
    final fg = isOutgoing ? colors.textInverse : colors.textPrimary;
    final timeColor = isOutgoing ? colors.textInverse.withValues(alpha: 0.7) : colors.textTertiary;

    return Align(
      alignment: isOutgoing ? Alignment.centerRight : Alignment.centerLeft,
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.76,
        ),
        child: Container(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.s16,
            vertical: AppSpacing.s12,
          ),
          decoration: BoxDecoration(
            color: bg,
            borderRadius: isOutgoing ? AppRadius.outgoingBubble : AppRadius.incomingBubble,
            border: isOutgoing ? null : Border.all(color: colors.borderSubtle, width: 1),
          ),
          child: Column(
            crossAxisAlignment: isOutgoing ? CrossAxisAlignment.end : CrossAxisAlignment.start,
            children: [
              Text(
                message.text,
                style: AppTypography.body.copyWith(
                  color: fg,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: AppSpacing.s4),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    DateFormatter.formatMessageTime(message.timestamp),
                    style: AppTypography.caption.copyWith(
                      color: timeColor,
                      fontSize: 10,
                    ),
                  ),
                  if (isOutgoing) ...[
                    const SizedBox(width: 4),
                    Icon(
                      message.status == MessageDeliveryStatus.read
                          ? Icons.done_all_rounded
                          : Icons.done_rounded,
                      size: 14,
                      color: timeColor,
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PulseDots extends StatelessWidget {
  final Color color;

  const _PulseDots({required this.color});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(3, (index) {
        return Container(
          margin: const EdgeInsets.symmetric(horizontal: 1.5),
          width: 5,
          height: 5,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.4 + (index * 0.3)),
            shape: BoxShape.circle,
          ),
        );
      }),
    );
  }
}
