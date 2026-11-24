import 'package:flutter_test/flutter_test.dart';
import 'package:predimaint_mobile/core/ar_model_key.dart';

void main() {
  test('component QR payloads select their Unity model keys', () {
    expect(
      arModelKeyFromQrPayload('predimaint:sensor:temperature'),
      'temperature',
    );
    expect(
      arModelKeyFromQrPayload('predimaint:sensor:vibration'),
      'vibration',
    );
    expect(
      arModelKeyFromQrPayload('predimaint:sensor:current'),
      'current',
    );
    expect(arModelKeyFromQrPayload('predimaint:sensor:device'), 'device');
    expect(arModelKeyFromQrPayload('predimaint:wiring'), isNull);
    expect(arModelKeyFromQrPayload('unrecognized'), isNull);
  });
}
