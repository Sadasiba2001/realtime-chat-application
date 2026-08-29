/// Registration request payload matching Django UserRegisterSerializer.
class RegisterRequestModel {
  final String name;
  final String username;
  final String email;
  final String phoneNumber;
  final String password;

  const RegisterRequestModel({
    required this.name,
    required this.username,
    required this.email,
    this.phoneNumber = '',
    required this.password,
  });

  Map<String, dynamic> toJson() {
    return {
      'name': name.trim(),
      'username': username.trim(),
      'email': email.trim().toLowerCase(),
      'phone_number': phoneNumber.trim(),
      'password': password,
    };
  }
}
