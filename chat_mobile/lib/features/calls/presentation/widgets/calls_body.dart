import 'package:flutter/material.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_theme_extension.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../app/theme/sb_icons.dart';
import '../../../../core/utils/date_formatter.dart';
import '../../../../core/widgets/app_avatar.dart';
import '../../../../core/widgets/app_divider.dart';
import '../../../../core/widgets/app_empty_state.dart';
import '../../../../core/widgets/app_icon_button.dart';

class CallRecord {
  final String name;
  final DateTime time;
  final bool isVideo;
  final bool isMissed;
  final bool isOutgoing;

  const CallRecord({
    required this.name,
    required this.time,
    required this.isVideo,
    required this.isMissed,
    required this.isOutgoing,
  });
}

/// Body component for Calls screen displaying recent call logs.
class CallsBody extends StatelessWidget {
  const CallsBody({super.key});

  static final List<CallRecord> _mockCalls = [
    CallRecord(
      name: 'Elena Rostova',
      time: DateTime.now().subtract(const Duration(minutes: 50)),
      isVideo: true,
      isMissed: false,
      isOutgoing: false,
    ),
    CallRecord(
      name: 'Marcus Chen',
      time: DateTime.now().subtract(const Duration(hours: 3)),
      isVideo: false,
      isMissed: true,
      isOutgoing: false,
    ),
    CallRecord(
      name: 'Sarah Jenkins',
      time: DateTime.now().subtract(const Duration(hours: 6)),
      isVideo: false,
      isMissed: false,
      isOutgoing: true,
    ),
    CallRecord(
      name: 'Priya Patel',
      time: DateTime.now().subtract(const Duration(days: 1)),
      isVideo: true,
      isMissed: false,
      isOutgoing: true,
    ),
    CallRecord(
      name: 'David Kim',
      time: DateTime.now().subtract(const Duration(days: 2)),
      isVideo: false,
      isMissed: true,
      isOutgoing: false,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;

    if (_mockCalls.isEmpty) {
      return const AppEmptyState(
        icon: SBIcons.callsOutline,
        title: 'No recent calls',
        description: 'Start a voice or video call with your contacts.',
      );
    }

    return ListView.separated(
      itemCount: _mockCalls.length,
      separatorBuilder: (context, index) => const AppDivider(indent: 76),
      itemBuilder: (context, index) {
        final call = _mockCalls[index];
        final statusColor = call.isMissed
            ? colors.error
            : (call.isOutgoing ? colors.brandPrimary : colors.success);

        return ListTile(
          contentPadding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.s16,
            vertical: AppSpacing.s6,
          ),
          leading: AppAvatar(name: call.name, size: 48),
          title: Text(
            call.name,
            style: AppTypography.labelLarge.copyWith(
              color: call.isMissed ? colors.error : colors.textPrimary,
              fontWeight: FontWeight.w600,
            ),
          ),
          subtitle: Row(
            children: [
              Icon(
                call.isOutgoing
                    ? SBIcons.callOutgoing
                    : (call.isMissed ? SBIcons.callMissed : SBIcons.callIncoming),
                size: 14,
                color: statusColor,
              ),
              const SizedBox(width: AppSpacing.s4),
              Text(
                call.isMissed
                    ? 'Missed • ${DateFormatter.formatMessageTime(call.time)}'
                    : '${call.isVideo ? "Video" : "Voice"} call • ${DateFormatter.formatMessageTime(call.time)}',
                style: AppTypography.caption.copyWith(color: colors.textSecondary),
              ),
            ],
          ),
          trailing: AppIconButton(
            icon: call.isVideo ? SBIcons.videoCall : SBIcons.voiceCall,
            iconSize: 20,
            color: colors.brandPrimary,
            tooltip: call.isVideo ? 'Start video call' : 'Start voice call',
            onPressed: () {},
          ),
        );
      },
    );
  }
}
