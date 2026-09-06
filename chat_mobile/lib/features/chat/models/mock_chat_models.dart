enum MessageDeliveryStatus { sending, sent, delivered, read }

class ChatConversation {
  final String id;
  final String name;
  final String lastMessage;
  final DateTime timestamp;
  final int unreadCount;
  final bool isOnline;
  final bool isMuted;
  final bool isGroup;
  final String? avatarUrl;

  const ChatConversation({
    required this.id,
    required this.name,
    required this.lastMessage,
    required this.timestamp,
    this.unreadCount = 0,
    this.isOnline = false,
    this.isMuted = false,
    this.isGroup = false,
    this.avatarUrl,
  });

  static List<ChatConversation> get mockConversations => [
        ChatConversation(
          id: '1',
          name: 'Elena Rostova',
          lastMessage: 'The design tokens look incredible! Did you check the latest dark mode surfaces?',
          timestamp: DateTime.now().subtract(const Duration(minutes: 4)),
          unreadCount: 2,
          isOnline: true,
        ),
        ChatConversation(
          id: '2',
          name: 'Marcus Chen',
          lastMessage: 'Audio/Video WebRTC signaling pipeline is ready for review.',
          timestamp: DateTime.now().subtract(const Duration(minutes: 42)),
          unreadCount: 1,
          isOnline: true,
        ),
        ChatConversation(
          id: '3',
          name: 'Mobile Core Architecture',
          lastMessage: 'Sarah: We finalized the WebSocket reconnection strategy.',
          timestamp: DateTime.now().subtract(const Duration(hours: 2)),
          unreadCount: 0,
          isOnline: false,
          isGroup: true,
        ),
        ChatConversation(
          id: '4',
          name: 'Sarah Jenkins',
          lastMessage: 'Sent an attachment: ui_spec_v2.pdf',
          timestamp: DateTime.now().subtract(const Duration(hours: 5)),
          unreadCount: 0,
          isOnline: false,
          isMuted: true,
        ),
        ChatConversation(
          id: '5',
          name: 'David Kim',
          lastMessage: 'Let’s sync tomorrow morning at 10 AM.',
          timestamp: DateTime.now().subtract(const Duration(days: 1)),
          unreadCount: 0,
          isOnline: false,
        ),
        ChatConversation(
          id: '6',
          name: 'Priya Patel',
          lastMessage: 'Can you verify the biometric token storage flow?',
          timestamp: DateTime.now().subtract(const Duration(days: 2)),
          unreadCount: 0,
          isOnline: true,
        ),
        ChatConversation(
          id: '7',
          name: 'Alex Rivera',
          lastMessage: 'Thanks for the quick response! Catch you later.',
          timestamp: DateTime.now().subtract(const Duration(days: 3)),
          unreadCount: 0,
          isOnline: false,
        ),
        ChatConversation(
          id: '8',
          name: 'Elena Rostova',
          lastMessage: 'The design tokens look incredible! Did you check the latest dark mode surfaces?',
          timestamp: DateTime.now().subtract(const Duration(minutes: 4)),
          unreadCount: 2,
          isOnline: true,
        ),
        ChatConversation(
          id: '9',
          name: 'Marcus Chen',
          lastMessage: 'Audio/Video WebRTC signaling pipeline is ready for review.',
          timestamp: DateTime.now().subtract(const Duration(minutes: 42)),
          unreadCount: 1,
          isOnline: true,
        ),
        ChatConversation(
          id: '10',
          name: 'Mobile Core Architecture',
          lastMessage: 'Sarah: We finalized the WebSocket reconnection strategy.',
          timestamp: DateTime.now().subtract(const Duration(hours: 2)),
          unreadCount: 0,
          isOnline: false,
          isGroup: true,
        ),
        ChatConversation(
          id: '11',
          name: 'Sarah Jenkins',
          lastMessage: 'Sent an attachment: ui_spec_v2.pdf',
          timestamp: DateTime.now().subtract(const Duration(hours: 5)),
          unreadCount: 0,
          isOnline: false,
          isMuted: true,
        ),
        ChatConversation(
          id: '12',
          name: 'David Kim',
          lastMessage: 'Let’s sync tomorrow morning at 10 AM.',
          timestamp: DateTime.now().subtract(const Duration(days: 1)),
          unreadCount: 0,
          isOnline: false,
        ),
        ChatConversation(
          id: '13',
          name: 'Priya Patel',
          lastMessage: 'Can you verify the biometric token storage flow?',
          timestamp: DateTime.now().subtract(const Duration(days: 2)),
          unreadCount: 0,
          isOnline: true,
        ),
        ChatConversation(
          id: '14',
          name: 'Alex Rivera',
          lastMessage: 'Thanks for the quick response! Catch you later.',
          timestamp: DateTime.now().subtract(const Duration(days: 3)),
          unreadCount: 0,
          isOnline: false,
        ),
      ];
}

class ChatMessage {
  final String id;
  final String senderId;
  final String senderName;
  final String text;
  final DateTime timestamp;
  final bool isOutgoing;
  final MessageDeliveryStatus status;
  final bool isTyping;

  const ChatMessage({
    required this.id,
    required this.senderId,
    required this.senderName,
    required this.text,
    required this.timestamp,
    required this.isOutgoing,
    this.status = MessageDeliveryStatus.read,
    this.isTyping = false,
  });

  static List<ChatMessage> getMockMessagesFor(String conversationId) => [
        ChatMessage(
          id: 'm1',
          senderId: 'contact',
          senderName: 'Elena Rostova',
          text: 'Hey! Are you working on the new Flutter application foundation today?',
          timestamp: DateTime.now().subtract(const Duration(minutes: 25)),
          isOutgoing: false,
        ),
        ChatMessage(
          id: 'm2',
          senderId: 'me',
          senderName: 'You',
          text: 'Yes! Implementing the centralized design system with strict color hierarchy and GoRouter navigation.',
          timestamp: DateTime.now().subtract(const Duration(minutes: 20)),
          isOutgoing: true,
          status: MessageDeliveryStatus.read,
        ),
        ChatMessage(
          id: 'm3',
          senderId: 'contact',
          senderName: 'Elena Rostova',
          text: 'Awesome! Did we preserve #252330 for the dark theme surface baseline?',
          timestamp: DateTime.now().subtract(const Duration(minutes: 15)),
          isOutgoing: false,
        ),
        ChatMessage(
          id: 'm4',
          senderId: 'me',
          senderName: 'You',
          text: 'Exactly. #A534B0 is our primary brand purple, and #252330 is the dark surface anchor. Contrast and readability feel very calm and premium.',
          timestamp: DateTime.now().subtract(const Duration(minutes: 10)),
          isOutgoing: true,
          status: MessageDeliveryStatus.read,
        ),
        ChatMessage(
          id: 'm5',
          senderId: 'contact',
          senderName: 'Elena Rostova',
          text: 'The design tokens look incredible! Did you check the latest dark mode surfaces?',
          timestamp: DateTime.now().subtract(const Duration(minutes: 4)),
          isOutgoing: false,
        ),
      ];
}
