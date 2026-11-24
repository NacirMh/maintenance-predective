import { Machine } from "../models/Machine.js";
import { AppError } from "../utils/AppError.js";
export async function accessibleMachineIds(user) {
    if (user.role === "admin" || user.role === "maintenance_manager") {
        const ids = await Machine.find({}).select("_id").lean();
        return ids.map((m) => m._id);
    }
    const ids = await Machine.find({ assignedTechnicianId: user.id }).select("_id").lean();
    return ids.map((m) => m._id);
}
export async function assertMachineAccess(user, machineId) {
    if (user.role === "admin" || user.role === "maintenance_manager")
        return;
    const machine = await Machine.findById(machineId).select("assignedTechnicianId").lean();
    if (!machine)
        throw new AppError(404, "Machine introuvable", "NOT_FOUND");
    if (String(machine.assignedTechnicianId) !== user.id) {
        throw new AppError(403, "Accès refusé à cette machine", "FORBIDDEN");
    }
}
export function machineFilter(user) {
    if (user.role === "technician") {
        return { assignedTechnicianId: user.id };
    }
    return {};
}
//# sourceMappingURL=scopeService.js.map