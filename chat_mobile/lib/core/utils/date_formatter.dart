/// Utility for formatting chat timestamps and relative dates.
abstract final class DateFormatter {
  static String formatMessageTime(DateTime dateTime) {
    final hour = dateTime.hour.toString().padLeft(2, '0');
    final minute = dateTime.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }

  static String formatConversationDate(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inDays == 0 && now.day == dateTime.day) {
      return formatMessageTime(dateTime);
    } else if (difference.inDays <= 1 && (now.day - dateTime.day == 1 || difference.inHours < 24)) {
      return 'Yesterday';
    } else if (difference.inDays < 7) {
      const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return weekdays[dateTime.weekday - 1];
    } else {
      final month = dateTime.month.toString().padLeft(2, '0');
      final day = dateTime.day.toString().padLeft(2, '0');
      return '$day/$month';
    }
  }
}
