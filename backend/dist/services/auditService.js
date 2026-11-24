import { AuditLog } from "../models/AuditLog.js";
export async function audit(req, action, resource, resourceId = "", metadata = {}) {
    await AuditLog.create({
        actorId: req?.user?.id,
        actorEmail: req?.user?.email ?? "system",
        action,
        resource,
        resourceId,
        metadata,
        ip: req?.ip ?? "",
    });
}
//# sourceMappingURL=auditService.js.map