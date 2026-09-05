import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_theme_extension.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../app/theme/sb_icons.dart';
import '../../../../core/widgets/app_avatar.dart';
import '../../../../core/widgets/app_divider.dart';
import '../../../../core/widgets/app_empty_state.dart';
import '../../../../core/widgets/app_icon_button.dart';
import '../../../../core/widgets/app_text_field.dart';

class ContactItem {
  final String id;
  final String name;
  final String status;
  final bool isOnline;

  const ContactItem({
    required this.id,
    required this.name,
    required this.status,
    required this.isOnline,
  });
}

/// Body component for Contacts screen displaying searchable directory list with sections.
class ContactsBody extends StatefulWidget {
  const ContactsBody({super.key});

  @override
  State<ContactsBody> createState() => _ContactsBodyState();
}

class _ContactsBodyState extends State<ContactsBody> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  static final List<ContactItem> _allContacts = [
    const ContactItem(id: '1', name: 'Elena Rostova', status: 'Design Systems Architect', isOnline: true),
    const ContactItem(id: '2', name: 'Marcus Chen', status: 'Coding Flutter & WebRTC', isOnline: true),
    const ContactItem(id: '6', name: 'Priya Patel', status: 'Security & Auth', isOnline: true),
    const ContactItem(id: '7', name: 'Alex Rivera', status: 'Available for work', isOnline: false),
    const ContactItem(id: '5', name: 'David Kim', status: 'In a meeting', isOnline: false),
    const ContactItem(id: '4', name: 'Sarah Jenkins', status: 'Product Lead', isOnline: false),
    const ContactItem(id: '8', name: 'Zack Miller', status: 'Offline', isOnline: false),
  ];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<ContactItem> get _filteredContacts {
    if (_searchQuery.trim().isEmpty) return _allContacts;
    return _allContacts
        .where((c) =>
            c.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
            c.status.toLowerCase().contains(_searchQuery.toLowerCase()))
        .toList();
  }

  List<ContactItem> get _onlineContacts =>
      _filteredContacts.where((c) => c.isOnline).toList();

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;
    final contacts = _filteredContacts;
    final online = _onlineContacts;

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.s16,
            AppSpacing.s4,
            AppSpacing.s16,
            AppSpacing.s12,
          ),
          child: AppTextField(
            controller: _searchController,
            hintText: 'Search contacts by name or role...',
            prefix: Icon(SBIcons.search, color: colors.textTertiary, size: 20),
            suffix: _searchQuery.isNotEmpty
                ? IconButton(
                    icon: Icon(SBIcons.clear, color: colors.textTertiary, size: 18),
                    onPressed: () {
                      _searchController.clear();
                      setState(() => _searchQuery = '');
                    },
                  )
                : null,
            onChanged: (val) => setState(() => _searchQuery = val),
          ),
        ),
        Expanded(
          child: contacts.isEmpty
              ? AppEmptyState(
                  icon: SBIcons.contactsOutline,
                  title: 'No contacts found',
                  description: 'Try searching with a different name or keyword.',
                )
              : ListView(
                  padding: const EdgeInsets.only(bottom: AppSpacing.s24),
                  children: [
                    if (_searchQuery.isEmpty && online.isNotEmpty) ...[
                      _buildSectionHeader('ONLINE (${online.length})', colors),
                      for (final contact in online) ...[
                        _buildContactTile(contact, colors),
                        const AppDivider(indent: 76),
                      ],
                      const SizedBox(height: AppSpacing.s12),
                    ],
                    _buildSectionHeader(
                      _searchQuery.isEmpty ? 'ALL CONTACTS (${contacts.length})' : 'RESULTS',
                      colors,
                    ),
                    for (final contact in contacts) ...[
                      _buildContactTile(contact, colors),
                      const AppDivider(indent: 76),
                    ],
                  ],
                ),
        ),
      ],
    );
  }

  Widget _buildSectionHeader(String title, dynamic colors) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.s16,
        AppSpacing.s8,
        AppSpacing.s16,
        AppSpacing.s6,
      ),
      child: Text(
        title,
        style: AppTypography.caption.copyWith(
          color: colors.textTertiary,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.8,
        ),
      ),
    );
  }

  Widget _buildContactTile(ContactItem contact, dynamic colors) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.s16,
        vertical: AppSpacing.s4,
      ),
      onTap: () {
        context.push('/chat/${contact.id}');
      },
      leading: AppAvatar(
        name: contact.name,
        size: 48,
        showOnlineIndicator: true,
        isOnline: contact.isOnline,
      ),
      title: Text(
        contact.name,
        style: AppTypography.labelLarge.copyWith(
          color: colors.textPrimary,
          fontWeight: FontWeight.w600,
        ),
      ),
      subtitle: Text(
        contact.status,
        style: AppTypography.bodySmall.copyWith(
          color: colors.textSecondary,
        ),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          AppIconButton(
            icon: SBIcons.chatsOutline,
            iconSize: 18,
            tooltip: 'Message',
            color: colors.brandPrimary,
            onPressed: () => context.push('/chat/${contact.id}'),
          ),
          AppIconButton(
            icon: SBIcons.voiceCall,
            iconSize: 18,
            tooltip: 'Call',
            color: colors.textTertiary,
            onPressed: () {},
          ),
        ],
      ),
    );
  }
}
