import 'package:flutter/material.dart';
import '../../../core/widgets/app_scaffold.dart';
import '../models/mock_chat_models.dart';
import 'widgets/chat_room_body.dart';
import 'widgets/chat_room_header.dart';

/// Screen displaying an active chat room, composed of [ChatRoomHeader] and [ChatRoomBody].
class ChatRoomScreen extends StatefulWidget {
  final String conversationId;

  const ChatRoomScreen({
    super.key,
    required this.conversationId,
  });

  @override
  State<ChatRoomScreen> createState() => _ChatRoomScreenState();
}

class _ChatRoomScreenState extends State<ChatRoomScreen> {
  late final ChatConversation _conversation;

  @override
  void initState() {
    super.initState();
    final all = ChatConversation.mockConversations;
    _conversation = all.firstWhere(
      (c) => c.id == widget.conversationId,
      orElse: () => all.first,
    );
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      safeAreaTop: true,
      safeAreaBottom: false,
      header: ChatRoomHeader(
        conversation: _conversation,
        onBack: () => Navigator.of(context).maybePop(),
      ),
      body: ChatRoomBody(
        conversationId: widget.conversationId,
        conversation: _conversation,
      ),
    );
  }
}
