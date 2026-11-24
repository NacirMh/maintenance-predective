package com.example.predimaint_mobile

import android.content.ComponentName
import android.content.Intent
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import com.unity3d.player.UnityPlayer

class MainActivity : FlutterActivity() {
    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL)
            .setMethodCallHandler { call, result ->
                when (call.method) {
                    "openAr" -> {
                        val modelKey = call.argument<String>("modelKey")
                        val telemetryJson = call.argument<String>("telemetryJson")
                        if (modelKey == null || modelKey !in MODEL_KEYS || telemetryJson.isNullOrBlank()) {
                            result.error("invalid_ar_request", "QR model or telemetry is invalid.", null)
                            return@setMethodCallHandler
                        }

                        val intent = Intent().setComponent(
                            ComponentName(packageName, UNITY_ACTIVITY)
                        ).putExtra("predimaint.model", modelKey)
                            .putExtra("predimaint.telemetry", telemetryJson)
                        if (intent.resolveActivity(packageManager) == null) {
                            result.error("unity_activity_missing", "Unity AR activity is not packaged.", null)
                        } else {
                            startActivity(intent)
                            result.success(null)
                        }
                    }

                    "updateTelemetry" -> {
                        val telemetryJson = call.argument<String>("telemetryJson")
                        if (telemetryJson.isNullOrBlank()) {
                            result.error("invalid_telemetry", "Telemetry JSON is empty.", null)
                            return@setMethodCallHandler
                        }
                        UnityPlayer.UnitySendMessage(
                            TELEMETRY_RECEIVER,
                            "SetTelemetryJson",
                            telemetryJson
                        )
                        result.success(null)
                    }

                    else -> result.notImplemented()
                }
            }
    }

    private companion object {
        const val CHANNEL = "predimaint/unity_ar"
        const val UNITY_ACTIVITY = "com.unity3d.player.UnityPlayerActivity"
        const val TELEMETRY_RECEIVER = "PrédiMaint Telemetry Receiver"
        val MODEL_KEYS = setOf("device", "temperature", "vibration", "current")
    }
}
