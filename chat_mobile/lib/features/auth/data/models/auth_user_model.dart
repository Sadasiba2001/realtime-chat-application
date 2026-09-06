/// Authenticated User model matching the Django UserResponseSerializer.
class AuthUserModel {
  final int id;
  final String name;
  final String username;
  final String email;
  final String phoneNumber;
  final String role;
  final String? profileImage;
  final String? profileImageUrl;
  final String avatar;
  final bool isActive;
  final String? lastSeen;
  final String? createdAt;

  const AuthUserModel({
    required this.id,
    required this.name,
    required this.username,
    required this.email,
    this.phoneNumber = '',
    this.role = 'NORMAL_USER',
    this.profileImage,
    this.profileImageUrl,
    this.avatar = '',
    this.isActive = true,
    this.lastSeen,
    this.createdAt,
  });

  factory AuthUserModel.fromJson(Map<String, dynamic> json) {
    return AuthUserModel(
      id: json['id'] is int
          ? json['id'] as int
          : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      name: json['name'] as String? ?? '',
      username: json['username'] as String? ?? '',
      email: json['email'] as String? ?? '',
      phoneNumber: json['phone_number'] as String? ?? '',
      role: json['role'] as String? ?? 'NORMAL_USER',
      profileImage: json['profile_image'] as String?,
      profileImageUrl: json['profile_image_url'] as String?,
      avatar: json['avatar'] as String? ?? json['profile_image'] as String? ?? '',
      isActive: json['is_active'] as bool? ?? true,
      lastSeen: json['last_seen'] as String?,
      createdAt: json['created_at'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'username': username,
      'email': email,
      'phone_number': phoneNumber,
      'role': role,
      'profile_image': profileImage,
      'profile_image_url': profileImageUrl,
      'avatar': avatar,
      'is_active': isActive,
      'last_seen': lastSeen,
      'created_at': createdAt,
    };
  }

  AuthUserModel copyWith({
    int? id,
    String? name,
    String? username,
    String? email,
    String? phoneNumber,
    String? role,
    String? profileImage,
    String? profileImageUrl,
    String? avatar,
    bool? isActive,
    String? lastSeen,
    String? createdAt,
  }) {
    return AuthUserModel(
      id: id ?? this.id,
      name: name ?? this.name,
      username: username ?? this.username,
      email: email ?? this.email,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      role: role ?? this.role,
      profileImage: profileImage ?? this.profileImage,
      profileImageUrl: profileImageUrl ?? this.profileImageUrl,
      avatar: avatar ?? this.avatar,
      isActive: isActive ?? this.isActive,
      lastSeen: lastSeen ?? this.lastSeen,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
