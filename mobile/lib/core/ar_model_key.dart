String? arModelKeyFromQrPayload(String payload) {
  final code = payload.trim().toLowerCase();
  if (code.contains('temperature') || code.contains('dht22')) {
    return 'temperature';
  }
  if (code.contains('vibration') || code.contains('sw-420')) {
    return 'vibration';
  }
  if (code.contains('current') || code.contains('acs712')) {
    return 'current';
  }
  if (code.contains('device') || code.contains('esp32')) {
    return 'device';
  }
  return null;
}
