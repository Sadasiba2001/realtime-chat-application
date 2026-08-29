import 'package:flutter/material.dart';
import '../../../app/theme/app_theme_extension.dart';
import '../../../core/widgets/app_avatar.dart';
import '../../../core/widgets/app_header.dart';
import '../../../core/widgets/app_scaffold.dart';
import 'widgets/chat_list_body.dart';

/// Screen displaying the active conversations list, composed of [AppHeader] and [ChatListBody].
class ChatListScreen extends StatelessWidget {
  const ChatListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;

    return AppScaffold(
      safeAreaTop: true,
      safeAreaBottom: false,
      header: const AppHeader(
        title: 'SB Chats',
        avatar: AppAvatar(
          name: 'Alexander Wright',
          size: 42,
          showOnlineIndicator: true,
          isOnline: true,
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {},
        backgroundColor: colors.brandPrimary,
        foregroundColor: colors.textInverse,
        elevation: 3,
        child: const Icon(Icons.add_comment_rounded),
      ),
      body: const ChatListBody(),
    );
  }
}
