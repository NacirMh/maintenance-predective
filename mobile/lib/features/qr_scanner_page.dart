import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

class QrScannerPage extends StatefulWidget {
  const QrScannerPage({super.key});

  @override
  State<QrScannerPage> createState() => _QrScannerPageState();
}

class _QrScannerPageState extends State<QrScannerPage> {
  final MobileScannerController controller = MobileScannerController(
    detectionSpeed: DetectionSpeed.normal,
  );
  bool handled = false;

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Scanner QR'),
        actions: [
          IconButton(
            onPressed: controller.switchCamera,
            tooltip: 'Changer de caméra',
            icon: const Icon(Icons.cameraswitch_rounded),
          ),
          IconButton(
            onPressed: controller.toggleTorch,
            tooltip: 'Lampe',
            icon: const Icon(Icons.flashlight_on_rounded),
          ),
        ],
      ),
      body: Stack(
        fit: StackFit.expand,
        children: [
          MobileScanner(
            controller: controller,
            onDetect: (capture) {
              if (handled) return;
              final value = capture.barcodes.firstOrNull?.rawValue?.trim();
              if (value == null || value.isEmpty) return;
              handled = true;
              controller.stop();
              context.pop(value);
            },
          ),
          Align(
            alignment: Alignment.bottomCenter,
            child: Container(
              width: double.infinity,
              margin: const EdgeInsets.all(24),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: .72),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Text(
                'Placez le QR code au centre du cadre.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
