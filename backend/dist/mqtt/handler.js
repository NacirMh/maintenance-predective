import { parsePredimaintTopic } from "./topics.js";
import { telemetrySchema } from "../validators/telemetry.js";
import { ingestTelemetry } from "../services/measurementIngestService.js";
import { Device } from "../models/Device.js";
import { logger } from "../utils/logger.js";
/** Décodage et contrôle d'identité appareil/topic, sans persistance. */
export function decodeMqttMessage(topic, raw) {
    const parsedTopic = parsePredimaintTopic(topic);
    if (!parsedTopic)
        return { ok: false, reason: "bad_topic" };
    let json;
    try {
        json = JSON.parse(raw);
    }
    catch {
        return { ok: false, reason: "invalid_json" };
    }
    const body = json;
    const hardwareId = parsedTopic.hardwareId ?? (typeof body.deviceId === "string" ? body.deviceId : "");
    if (!hardwareId)
        return { ok: false, reason: "missing_device_id" };
    if (parsedTopic.kind === "status") {
        const online = Boolean(body.online);
        return { ok: true, kind: "status", hardwareId, online };
    }
    if (parsedTopic.kind !== "telemetry") {
        return { ok: false, reason: "unsupported_kind" };
    }
    const parsed = telemetrySchema.safeParse(json);
    if (!parsed.success)
        return { ok: false, reason: "invalid_payload" };
    if (parsed.data.deviceId !== hardwareId) {
        return { ok: false, reason: "device_mismatch" };
    }
    return { ok: true, kind: "telemetry", hardwareId, payload: parsed.data };
}
export async function handleMqttMessage(topic, raw) {
    const decoded = decodeMqttMessage(topic, raw);
    if (!decoded.ok) {
        logger.warn("MQTT message rejected", { topic, reason: decoded.reason });
        return decoded;
    }
    if (decoded.kind === "status") {
        await Device.updateOne({ hardwareId: decoded.hardwareId, revoked: false }, { $set: { lastSeenAt: new Date(), status: decoded.online ? "online" : "offline" } });
        return decoded;
    }
    const ingested = await ingestTelemetry(decoded.payload, decoded.hardwareId);
    return { ...decoded, ingested };
}
//# sourceMappingURL=handler.js.map