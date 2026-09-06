import 'package:flutter/material.dart';
import '../../../../app/app.dart';
import '../../../../app/theme/app_radius.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_theme_extension.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../app/theme/sb_icons.dart';
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
        : (user?.username.isNotEmpty == true ? user!.username : 'Alexander Wright');
    final subtitle = user != null
        ? '${user.email}${user.phoneNumber.isNotEmpty ? " • ${user.phoneNumber}" : ""}'
        : '+1 (555) 019-2834 • @alexwright';

    return ListView(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.s16,
        AppSpacing.s8,
        AppSpacing.s16,
        96,
      ),
      children: [
        // Profile Hero Card
        AppCard(
          padding: const EdgeInsets.all(AppSpacing.s16),
          child: Row(
            children: [
              AppAvatar(
                name: displayName,
                size: 60,
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
                      style: AppTypography.headlineSmall.copyWith(
                        color: colors.textPrimary,
                        fontWeight: FontWeight.w700,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 3),
                    Text(
                      subtitle,
                      style: AppTypography.bodySmall.copyWith(color: colors.textSecondary),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: colors.surfaceSecondary,
                  borderRadius: AppRadius.small,
                  border: Border.all(color: colors.borderDefault, width: 1),
                ),
                child: Icon(
                  SBIcons.qrCode,
                  color: colors.brandPrimary,
                  size: 22,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.s20),

        // Appearance / Theme Section
        _buildSectionHeader('APPEARANCE', colors),
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
                    icon: SBIcons.autoMode,
                    isSelected: currentThemeMode == ThemeMode.system,
                    onTap: () => ChatApp.setThemeMode(ThemeMode.system),
                  ),
                  const AppDivider(),
                  _buildThemeOption(
                    context: context,
                    title: 'Dark Theme (#080D18)',
                    icon: SBIcons.darkMode,
                    isSelected: currentThemeMode == ThemeMode.dark,
                    onTap: () => ChatApp.setThemeMode(ThemeMode.dark),
                  ),
                  const AppDivider(),
                  _buildThemeOption(
                    context: context,
                    title: 'Light Theme',
                    icon: SBIcons.lightMode,
                    isSelected: currentThemeMode == ThemeMode.light,
                    onTap: () => ChatApp.setThemeMode(ThemeMode.light),
                  ),
                ],
              ),
            );
          },
        ),
        const SizedBox(height: AppSpacing.s20),

        // Preferences Section
        _buildSectionHeader('PREFERENCES', colors),
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
                icon: SBIcons.notifications,
                onTap: () {},
              ),
              const AppDivider(),
              _buildSettingTile(
                context: context,
                title: 'Privacy & Security',
                subtitle: 'Biometrics, end-to-end encryption, blocklist',
                icon: SBIcons.security,
                onTap: () {},
              ),
              const AppDivider(),
              _buildSettingTile(
                context: context,
                title: 'Data & Storage',
                subtitle: 'Network usage, auto-download, media cache',
                icon: SBIcons.storage,
                onTap: () {},
              ),
              const AppDivider(),
              _buildSettingTile(
                context: context,
                title: 'Chat Backup & Sync',
                subtitle: 'Encrypted cloud backup',
                icon: SBIcons.cloud,
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
            icon: const Icon(SBIcons.logout, size: 18),
            isFullWidth: true,
            isLoading: controller.state is AuthLoading,
            onPressed: () => _confirmLogout(context, controller),
          ),
          const SizedBox(height: AppSpacing.s24),
        ],

        Center(
          child: Text(
            'SB Chat • v1.0.0 (Build 1)',
            style: AppTypography.caption.copyWith(color: colors.textTertiary),
          ),
        ),
        const SizedBox(height: AppSpacing.s20),
      ],
    );
  }

  Widget _buildSectionHeader(String title, dynamic colors) {
    return Text(
      title,
      style: AppTypography.caption.copyWith(
        color: colors.textTertiary,
        fontWeight: FontWeight.w700,
        letterSpacing: 1.0,
      ),
    );
  }

  void _confirmLogout(BuildContext context, AuthController controller) {
    showDialog(
      context: context,
      builder: (ctx) {
        final colors = ctx.appColors;
        return AlertDialog(
          backgroundColor: colors.surfacePrimary,
          shape: RoundedRectangleBorder(
            borderRadius: AppRadius.large,
            side: BorderSide(color: colors.borderDefault, width: 1),
          ),
          title: Text(
            'Log Out',
            style: AppTypography.headlineSmall.copyWith(
              color: colors.textPrimary,
              fontWeight: FontWeight.w700,
            ),
          ),
          content: Text(
            'Are you sure you want to log out of your SB Chat account?',
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
            Icon(
              icon,
              size: 20,
              color: isSelected ? colors.brandPrimary : colors.textSecondary,
            ),
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
              Icon(SBIcons.check, color: colors.brandPrimary, size: 20),
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
                    style: AppTypography.body.copyWith(
                      color: colors.textPrimary,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: AppTypography.caption.copyWith(color: colors.textSecondary),
                  ),
                ],
              ),
            ),
            Icon(SBIcons.chevronRight, color: colors.textTertiary, size: 20),
          ],
        ),
      ),
    );
  }
}
