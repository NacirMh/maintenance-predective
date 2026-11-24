import { z } from "zod";
const metricSchema = z.object({
    value: z.number().finite(),
    unit: z.string().min(1),
});
const humiditySchema = z.object({
    value: z.number().finite().min(0).max(100),
    unit: z.string().min(1),
});
function normalizeUnit(unit) {
    if (unit === "°C" || unit === "℃" || unit === "celsius")
        return "C";
    if (unit === "mm/s" || unit === "mm_s")
        return "mm/s";
    return unit;
}
function normalizeSource(source) {
    if (source === "SIMULATION" || source === "simulation")
        return "simulation";
    if (source === "HARDWARE_REAL" || source === "hardware")
        return "hardware";
    return undefined;
}
function flattenTelemetry(input) {
    if (!input || typeof input !== "object")
        return input;
    const o = input;
    const nested = o.measurements;
    const vibration = (o.vibration ?? nested?.vibration);
    const temperature = (o.temperature ?? nested?.temperature);
    const humidity = (o.humidity ?? nested?.humidity);
    const current = (o.current ?? nested?.current);
    return {
        ...o,
        vibration: vibration
            ? { value: vibration.value, unit: normalizeUnit(String(vibration.unit ?? "g")) }
            : o.vibration,
        temperature: temperature
            ? { value: temperature.value, unit: normalizeUnit(String(temperature.unit ?? "C")) }
            : o.temperature,
        humidity: humidity
            ? { value: humidity.value, unit: String(humidity.unit ?? "%") }
            : o.humidity,
        current: current
            ? { value: current.value, unit: normalizeUnit(String(current.unit ?? "A")) }
            : o.current,
        source: normalizeSource(o.source) ?? o.source,
    };
}
export const telemetrySchema = z.preprocess(flattenTelemetry, z.object({
    deviceId: z.string().min(1),
    machineId: z.string().optional(),
    messageId: z.string().optional(),
    timestamp: z.string().datetime().optional(),
    vibration: metricSchema,
    temperature: metricSchema,
    humidity: humiditySchema.optional(),
    current: metricSchema,
    source: z.enum(["simulation", "hardware"]),
    sensorErrors: z
        .object({
        vibration: z.boolean().optional(),
        temperature: z.boolean().optional(),
        humidity: z.boolean().optional(),
        current: z.boolean().optional(),
    })
        .optional(),
    firmwareVersion: z.string().optional(),
}));
//# sourceMappingURL=telemetry.js.map