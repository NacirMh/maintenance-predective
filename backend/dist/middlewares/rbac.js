import { AppError } from "../utils/AppError.js";
export function authorize(...roles) {
    return (req, _res, next) => {
        if (!req.user)
            throw new AppError(401, "Authentification requise", "UNAUTHENTICATED");
        if (!roles.includes(req.user.role)) {
            throw new AppError(403, "Droits insuffisants", "FORBIDDEN");
        }
        next();
    };
}
export function isPrivileged(role) {
    return role === "admin" || role === "maintenance_manager";
}
//# sourceMappingURL=rbac.js.map