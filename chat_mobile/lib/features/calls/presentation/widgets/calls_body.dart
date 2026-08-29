import 'package:flutter/material.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_theme_extension.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../core/widgets/app_avatar.dart';
import '../../../../core/widgets/app_divider.dart';
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
  ];

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;

    return ListView.separated(
      itemCount: _mockCalls.length,
      separatorBuilder: (context, index) => const AppDivider(indent: 76),
      itemBuilder: (context, index) {
        final call = _mockCalls[index];
        return ListTile(
          contentPadding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.s16,
            vertical: AppSpacing.s4,
          ),
          leading: AppAvatar(name: call.name, size: 48),
          title: Text(
            call.name,
            style: AppTypography.labelLarge.copyWith(
              color: call.isMissed ? colors.error : colors.textPrimary,
            ),
          ),
          subtitle: Row(
            children: [
              Icon(
                call.isOutgoing
                    ? Icons.call_made_rounded
                    : (call.isMissed ? Icons.call_missed_rounded : Icons.call_received_rounded),
                size: 14,
                color: call.isMissed
                    ? colors.error
                    : (call.isOutgoing ? colors.brandPrimary : colors.success),
              ),
              const SizedBox(width: AppSpacing.s4),
              Text(
                call.isMissed ? 'Missed call' : (call.isVideo ? 'Video call' : 'Voice call'),
                style: AppTypography.caption.copyWith(color: colors.textSecondary),
              ),
            ],
          ),
          trailing: AppIconButton(
            icon: call.isVideo ? Icons.videocam_rounded : Icons.call_rounded,
            color: colors.brandPrimary,
            tooltip: call.isVideo ? 'Start video call' : 'Start voice call',
            onPressed: () {},
          ),
        );
      },
    );
  }
}
