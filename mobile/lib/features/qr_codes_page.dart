import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';

class QrCodesPage extends StatelessWidget {
  const QrCodesPage({super.key});

  static const entries = <({String title, String subtitle, String payload})>[
    (title: 'ESP32', subtitle: 'Appareil ESP32', payload: 'predimaint:sensor:device'),
    (title: 'DHT22', subtitle: 'Température et humidité', payload: 'predimaint:sensor:temperature'),
    (title: 'SW-420', subtitle: 'Détection de vibration', payload: 'predimaint:sensor:vibration'),
    (title: 'ACS712', subtitle: 'Mesure du courant', payload: 'predimaint:sensor:current'),
    (title: 'Câblage', subtitle: 'ESP32, capteurs et connexions', payload: 'predimaint:wiring'),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('QR des composants')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Imprimez ces codes et placez-en un près de chaque composant.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 12),
          for (final entry in entries)
            Card(
              margin: const EdgeInsets.only(bottom: 12),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(entry.title,
                              style: Theme.of(context).textTheme.titleMedium),
                          const SizedBox(height: 4),
                          Text(entry.subtitle,
                              style: Theme.of(context).textTheme.bodySmall),
                        ],
                      ),
                    ),
                    Container(
                      width: 120,
                      height: 120,
                      padding: const EdgeInsets.all(8),
                      color: Colors.white,
                      child: QrImageView(
                        data: entry.payload,
                        version: QrVersions.auto,
                        gapless: false,
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
