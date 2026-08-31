import 'package:flutter/material.dart';
import '../../../../app/app.dart';
import '../../../../app/theme/app_radius.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_theme_extension.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../core/widgets/app_avatar.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../../core/widgets/app_divider.dart';
import '../../../auth/presentation/controllers/auth_controller.dart';
import '../../../auth/presentation/controllers/auth_scope.dart';
import '../../../auth/presentation/controllers/auth_state.dart';

/// Body component for Settings screen containing user profile card, preferences, and logout.
class SettingsBody extends StatelessWidget {
  final AuthController? authController;

  const SettingsBody({
    super.key,
    this.authController,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;
    final controller = authController ?? AuthScope.maybeOf(context);
    final user = controller?.currentUser;

    final displayName = user?.name.isNotEmpty == true
        ? user!.name
        : (user?.username.isNotEmpty == true ? user!.username : 'User');
    final subtitle = user != null
        ? '${user.email}${user.phoneNumber.isNotEmpty ? " • ${user.phoneNumber}" : ""}'
        : '+1 (555) 019-2834 • @alexwright';

    return ListView(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.s16,
        vertical: AppSpacing.s8,
      ),
      children: [
        // Profile Card
        AppCard(
          padding: const EdgeInsets.all(AppSpacing.s16),
          child: Row(
            children: [
              AppAvatar(
                name: displayName,
                size: 58,
                showOnlineIndicator: true,
                isOnline: true,
              ),
              const SizedBox(width: AppSpacing.s16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      displayName,
                      style: AppTypography.headlineSmall.copyWith(color: colors.textPrimary),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: AppTypography.bodySmall.copyWith(color: colors.textSecondary),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              Icon(Icons.qr_code_rounded, color: colors.textSecondary, size: 24),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.s20),

        // Theme / Appearance Section
        Text(
          'APPEARANCE',
          style: AppTypography.caption.copyWith(
            color: colors.textTertiary,
            fontWeight: FontWeight.w700,
            letterSpacing: 1.0,
          ),
        ),
        const SizedBox(height: AppSpacing.s8),
        ValueListenableBuilder<ThemeMode>(
          valueListenable: ChatApp.themeModeNotifier,
          builder: (context, currentThemeMode, _) {
            return AppCard(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.s16,
                vertical: AppSpacing.s8,
              ),
              child: Column(
                children: [
                  _buildThemeOption(
                    context: context,
                    title: 'System Default',
                    icon: Icons.brightness_auto_rounded,
                    isSelected: currentThemeMode == ThemeMode.system,
                    onTap: () => ChatApp.setThemeMode(ThemeMode.system),
                  ),
                  const AppDivider(),
                  _buildThemeOption(
                    context: context,
                    title: 'Light Theme',
                    icon: Icons.light_mode_rounded,
                    isSelected: currentThemeMode == ThemeMode.light,
                    onTap: () => ChatApp.setThemeMode(ThemeMode.light),
                  ),
                  const AppDivider(),
                  _buildThemeOption(
                    context: context,
                    title: 'Dark Theme (#252330)',
                    icon: Icons.dark_mode_rounded,
                    isSelected: currentThemeMode == ThemeMode.dark,
                    onTap: () => ChatApp.setThemeMode(ThemeMode.dark),
                  ),
                ],
              ),
            );
          },
        ),
        const SizedBox(height: AppSpacing.s20),

        // General Settings Section
        Text(
          'PREFERENCES',
          style: AppTypography.caption.copyWith(
            color: colors.textTertiary,
            fontWeight: FontWeight.w700,
            letterSpacing: 1.0,
          ),
        ),
        const SizedBox(height: AppSpacing.s8),
        AppCard(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.s16,
            vertical: AppSpacing.s4,
          ),
          child: Column(
            children: [
              _buildSettingTile(
                context: context,
                title: 'Notifications & Sounds',
                subtitle: 'Messages, group tones, call alerts',
                icon: Icons.notifications_none_rounded,
                onTap: () {},
              ),
              const AppDivider(),
              _buildSettingTile(
                context: context,
                title: 'Privacy & Security',
                subtitle: 'Biometrics, end-to-end encryption, blocklist',
                icon: Icons.security_rounded,
                onTap: () {},
              ),
              const AppDivider(),
              _buildSettingTile(
                context: context,
                title: 'Data & Storage',
                subtitle: 'Network usage, auto-download, media cache',
                icon: Icons.pie_chart_outline_rounded,
                onTap: () {},
              ),
              const AppDivider(),
              _buildSettingTile(
                context: context,
                title: 'Chat Backup & Sync',
                subtitle: 'Encrypted cloud backup',
                icon: Icons.cloud_outlined,
                onTap: () {},
              ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.s24),

        // Log Out Button
        if (controller != null) ...[
          AppButton.destructive(
            text: 'Log Out',
            icon: const Icon(Icons.logout_rounded, size: 18),
            isFullWidth: true,
            isLoading: controller.state is AuthLoading,
            onPressed: () => _confirmLogout(context, controller),
          ),
          const SizedBox(height: AppSpacing.s24),
        ],

        Center(
          child: Text(
            'Chat Mobile • v1.0.0 (Build 1)',
            style: AppTypography.caption.copyWith(color: colors.textTertiary),
          ),
        ),
        const SizedBox(height: AppSpacing.s20),
      ],
    );
  }

  void _confirmLogout(BuildContext context, AuthController controller) {
    showDialog(
      context: context,
      builder: (ctx) {
        final colors = ctx.appColors;
        return AlertDialog(
          backgroundColor: colors.surfacePrimary,
          title: Text(
            'Log Out',
            style: AppTypography.headlineSmall.copyWith(color: colors.textPrimary),
          ),
          content: Text(
            'Are you sure you want to log out of your account?',
            style: AppTypography.body.copyWith(color: colors.textSecondary),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: Text(
                'Cancel',
                style: AppTypography.labelLarge.copyWith(color: colors.textSecondary),
              ),
            ),
            TextButton(
              onPressed: () {
                Navigator.of(ctx).pop();
                controller.logout();
              },
              child: Text(
                'Log Out',
                style: AppTypography.labelLarge.copyWith(color: colors.error),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildThemeOption({
    required BuildContext context,
    required String title,
    required IconData icon,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    final colors = context.appColors;

    return InkWell(
      onTap: onTap,
      borderRadius: AppRadius.small,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.s12),
        child: Row(
          children: [
            Icon(icon, size: 20, color: isSelected ? colors.brandPrimary : colors.textSecondary),
            const SizedBox(width: AppSpacing.s12),
            Expanded(
              child: Text(
                title,
                style: AppTypography.body.copyWith(
                  color: isSelected ? colors.brandPrimary : colors.textPrimary,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                ),
              ),
            ),
            if (isSelected)
              Icon(Icons.check_rounded, color: colors.brandPrimary, size: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildSettingTile({
    required BuildContext context,
    required String title,
    required String subtitle,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    final colors = context.appColors;

    return InkWell(
      onTap: onTap,
      borderRadius: AppRadius.small,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.s12),
        child: Row(
          children: [
            Icon(icon, size: 22, color: colors.textSecondary),
            const SizedBox(width: AppSpacing.s16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: AppTypography.body.copyWith(color: colors.textPrimary, fontWeight: FontWeight.w500),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: AppTypography.caption.copyWith(color: colors.textSecondary),
                  ),
                ],
              ),
            ),
            Icon(Icons.chevron_right_rounded, color: colors.textTertiary, size: 20),
          ],
        ),
      ),
    );
  }
}
