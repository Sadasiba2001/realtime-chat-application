import 'package:flutter/material.dart';

/// Centralized SB Chat icon language.
///
/// Provides a consistent, rounded, outlined icon geometry with standardized
/// stroke weights and sizing across the entire application:
/// - Navigation: 24.0px
/// - Toolbar / Header: 22.0px
/// - Inline / List tiles: 20.0px
/// - Small / Indicators: 16.0px
abstract final class SBIcons {
  // Sizing constants
  static const double sizeNavigation = 24.0;
  static const double sizeToolbar = 22.0;
  static const double sizeInline = 20.0;
  static const double sizeSmall = 16.0;

  // Primary Navigation
  static const IconData chatsOutline = Icons.chat_bubble_outline_rounded;
  static const IconData chatsFilled = Icons.chat_bubble_rounded;

  static const IconData contactsOutline = Icons.people_outline_rounded;
  static const IconData contactsFilled = Icons.people_rounded;

  static const IconData callsOutline = Icons.call_outlined;
  static const IconData callsFilled = Icons.call_rounded;

  static const IconData settingsOutline = Icons.settings_outlined;
  static const IconData settingsFilled = Icons.settings_rounded;

  // Communication & Chat Actions
  static const IconData newChat = Icons.edit_square;
  static const IconData addChat = Icons.add_comment_rounded;
  static const IconData voiceCall = Icons.phone_outlined;
  static const IconData voiceCallFilled = Icons.phone_rounded;
  static const IconData videoCall = Icons.videocam_outlined;
  static const IconData videoCallFilled = Icons.videocam_rounded;
  static const IconData newCall = Icons.add_call;
  static const IconData addContact = Icons.person_add_alt_1_rounded;

  // Composer & Input
  static const IconData attach = Icons.add_circle_outline_rounded;
  static const IconData emoji = Icons.sentiment_satisfied_alt_rounded;
  static const IconData mic = Icons.mic_none_rounded;
  static const IconData micFilled = Icons.mic_rounded;
  static const IconData send = Icons.send_rounded;
  static const IconData search = Icons.search_rounded;
  static const IconData clear = Icons.clear_rounded;

  // Message Status & Indicators
  static const IconData delivered = Icons.done_rounded;
  static const IconData read = Icons.done_all_rounded;
  static const IconData pin = Icons.push_pin_outlined;
  static const IconData pinFilled = Icons.push_pin_rounded;
  static const IconData archive = Icons.archive_outlined;
  static const IconData muted = Icons.volume_off_rounded;

  // Call Logs Status
  static const IconData callOutgoing = Icons.call_made_rounded;
  static const IconData callIncoming = Icons.call_received_rounded;
  static const IconData callMissed = Icons.call_missed_rounded;

  // Security, Identity & Settings
  static const IconData security = Icons.security_rounded;
  static const IconData lock = Icons.lock_outline_rounded;
  static const IconData qrCode = Icons.qr_code_2_rounded;
  static const IconData notifications = Icons.notifications_none_rounded;
  static const IconData storage = Icons.pie_chart_outline_rounded;
  static const IconData cloud = Icons.cloud_outlined;
  static const IconData theme = Icons.brightness_6_rounded;
  static const IconData darkMode = Icons.dark_mode_rounded;
  static const IconData lightMode = Icons.light_mode_rounded;
  static const IconData autoMode = Icons.brightness_auto_rounded;
  static const IconData logout = Icons.logout_rounded;
  static const IconData check = Icons.check_rounded;

  // Navigation & Control
  static const IconData back = Icons.arrow_back_ios_new_rounded;
  static const IconData chevronRight = Icons.chevron_right_rounded;
  static const IconData moreVert = Icons.more_vert_rounded;
  static const IconData close = Icons.close_rounded;
  static const IconData error = Icons.error_outline_rounded;
}
