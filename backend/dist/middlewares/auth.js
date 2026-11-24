import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import { User } from "../models/User.js";
export function authenticate(req, _res, next) {
    void (async () => {
        const header = req.headers.authorization;
        if (!header?.startsWith("Bearer ")) {
            throw new AppError(401, "Authentification requise", "UNAUTHENTICATED");
        }
        const token = header.slice(7);
        let payload;
        try {
            payload = jwt.verify(token, env.JWT_SECRET);
        }
        catch {
            throw new AppError(401, "Jeton invalide ou expiré", "INVALID_TOKEN");
        }
        const user = await User.findById(payload.sub).select("role email isActive tokenVersion");
        if (!user || !user.isActive) {
            throw new AppError(401, "Session invalide ou compte désactivé", "INVALID_TOKEN");
        }
        if ((payload.tv ?? 0) !== (user.tokenVersion ?? 0)) {
            throw new AppError(401, "Session expirée", "INVALID_TOKEN");
        }
        req.user = { id: String(user._id), role: user.role, email: user.email };
        next();
    })().catch(next);
}
export function optionalAuth(req, _res, next) {
    const header = req.headers.authorization;
    if (header?.startsWith("Bearer ")) {
        try {
            const payload = jwt.verify(header.slice(7), env.JWT_SECRET);
            req.user = { id: payload.sub, role: payload.role, email: payload.email };
        }
        catch {
            /* ignore */
        }
    }
    next();
}
//# sourceMappingURL=auth.js.map