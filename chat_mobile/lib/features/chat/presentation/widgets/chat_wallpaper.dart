import 'package:flutter/material.dart';
import '../../../../app/theme/app_theme_extension.dart';

/// Quiet, elegant wallpaper background widget with abstract geometric and communication motifs.
///
/// Designed to provide subtle texture and identity without ever interfering with message readability.
class ChatWallpaper extends StatelessWidget {
  final Widget? child;

  const ChatWallpaper({
    super.key,
    this.child,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      decoration: BoxDecoration(
        color: colors.backgroundPrimary,
        gradient: colors.canvasGradient,
      ),
      child: Stack(
        children: [
          Positioned.fill(
            child: CustomPaint(
              painter: _ChatPatternPainter(
                isDark: isDark,
                patternColor: isDark
                    ? const Color(0xFF6D3CFF).withValues(alpha: 0.035)
                    : const Color(0xFF6841E8).withValues(alpha: 0.04),
              ),
            ),
          ),
          ?child,
        ],
      ),
    );
  }
}

class _ChatPatternPainter extends CustomPainter {
  final bool isDark;
  final Color patternColor;

  _ChatPatternPainter({
    required this.isDark,
    required this.patternColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = patternColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2
      ..strokeCap = StrokeCap.round;

    final dotPaint = Paint()
      ..color = patternColor
      ..style = PaintingStyle.fill;

    const double stepX = 72.0;
    const double stepY = 84.0;

    int row = 0;
    for (double y = 20; y < size.height + 40; y += stepY) {
      double offsetX = (row % 2 == 1) ? (stepX / 2) : 0.0;
      int col = 0;

      for (double x = 16 + offsetX; x < size.width + 40; x += stepX) {
        final symbolType = (row + col) % 4;

        switch (symbolType) {
          case 0:
            // Subtle chat bubble outline
            final bubbleRect = RRect.fromRectAndRadius(
              Rect.fromCenter(center: Offset(x, y), width: 18, height: 14),
              const Radius.circular(4),
            );
            canvas.drawRRect(bubbleRect, paint);
            // tiny tail
            canvas.drawLine(Offset(x - 6, y + 7), Offset(x - 9, y + 10), paint);
            break;
          case 1:
            // Tiny message lines
            canvas.drawLine(Offset(x - 6, y - 3), Offset(x + 6, y - 3), paint);
            canvas.drawLine(Offset(x - 6, y + 3), Offset(x + 3, y + 3), paint);
            break;
          case 2:
            // Subtle diamond / sparkle
            final path = Path()
              ..moveTo(x, y - 6)
              ..lineTo(x + 5, y)
              ..lineTo(x, y + 6)
              ..lineTo(x - 5, y)
              ..close();
            canvas.drawPath(path, paint);
            break;
          case 3:
            // Soft micro dots triad
            canvas.drawCircle(Offset(x - 4, y), 1.2, dotPaint);
            canvas.drawCircle(Offset(x, y), 1.2, dotPaint);
            canvas.drawCircle(Offset(x + 4, y), 1.2, dotPaint);
            break;
        }
        col++;
      }
      row++;
    }
  }

  @override
  bool shouldRepaint(covariant _ChatPatternPainter oldDelegate) {
    return oldDelegate.isDark != isDark || oldDelegate.patternColor != patternColor;
  }
}
