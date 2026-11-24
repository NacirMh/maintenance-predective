import bcrypt from "bcryptjs";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { PendingRegistration } from "../models/PendingRegistration.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { sendAdminApprovalRequest, sendVerificationCode, } from "./emailService.js";
const loginAttempts = new Map();
function checkRate(email) {
    const rec = loginAttempts.get(email);
    if (rec && rec.until > Date.now()) {
        throw new AppError(429, "Trop de tentatives, réessayez plus tard", "RATE_LIMIT");
    }
}
function failLogin(email) {
    const rec = loginAttempts.get(email) ?? { count: 0, until: 0 };
    rec.count += 1;
    if (rec.count >= 5) {
        rec.until = Date.now() + 15 * 60_000;
        rec.count = 0;
    }
    loginAttempts.set(email, rec);
}
export function signToken(user) {
    const payload = {
        sub: user.id,
        role: user.role,
        email: user.email,
        tv: user.tokenVersion ?? 0,
    };
    return jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN,
    });
}
export async function bumpTokenVersion(userId) {
    await User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } });
}
export async function login(email, password) {
    checkRate(email.toLowerCase());
    const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
    if (!user) {
        failLogin(email.toLowerCase());
        throw new AppError(401, "Identifiants invalides", "INVALID_CREDENTIALS");
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok || (!user.isActive && user.approvalStatus !== "pending")) {
        failLogin(email.toLowerCase());
        throw new AppError(401, "Identifiants invalides", "INVALID_CREDENTIALS");
    }
    if (user.approvalStatus === "pending") {
        throw new AppError(403, "Votre adresse e-mail est vérifiée. Votre compte attend l’approbation de l’administrateur.", "ACCOUNT_PENDING_APPROVAL");
    }
    if (!user.isActive) {
        failLogin(email.toLowerCase());
        throw new AppError(401, "Identifiants invalides", "INVALID_CREDENTIALS");
    }
    loginAttempts.delete(email.toLowerCase());
    user.lastLoginAt = new Date();
    await user.save();
    const token = signToken({
        id: String(user._id),
        role: user.role,
        email: user.email,
        tokenVersion: user.tokenVersion ?? 0,
    });
    return {
        token,
        user: {
            id: String(user._id),
            _id: String(user._id),
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            phone: user.phone,
        },
    };
}
function hashVerificationCode(email, code) {
    return createHmac("sha256", env.JWT_SECRET)
        .update(`${email}:${code}`)
        .digest("hex");
}
export async function register(input) {
    const email = input.email.trim().toLowerCase();
    if (await User.exists({ email })) {
        throw new AppError(409, "Un compte utilise déjà cette adresse e-mail", "EMAIL_IN_USE");
    }
    const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
    const passwordHash = await hashPassword(input.password);
    await sendVerificationCode(email, code, input.firstName);
    await PendingRegistration.findOneAndUpdate({ email }, {
        email,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone ?? "",
        role: input.role,
        passwordHash,
        codeHash: hashVerificationCode(email, code),
        expiresAt: new Date(Date.now() + 10 * 60_000),
        failedAttempts: 0,
    }, { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true });
    return { email, expiresInMinutes: 10 };
}
export async function verifyRegistration(emailInput, code) {
    const email = emailInput.trim().toLowerCase();
    const pending = await PendingRegistration.findOne({ email }).select("+passwordHash +codeHash");
    if (!pending || pending.expiresAt.getTime() <= Date.now()) {
        throw new AppError(400, "Code invalide ou expiré", "INVALID_VERIFICATION_CODE");
    }
    if (pending.failedAttempts >= 5) {
        throw new AppError(429, "Trop de tentatives. Demandez un nouveau code.", "VERIFICATION_RATE_LIMIT");
    }
    const expected = Buffer.from(pending.codeHash, "hex");
    const received = Buffer.from(hashVerificationCode(email, code), "hex");
    if (!timingSafeEqual(expected, received)) {
        pending.failedAttempts += 1;
        await pending.save();
        throw new AppError(400, "Code invalide ou expiré", "INVALID_VERIFICATION_CODE");
    }
    let user = await User.findOne({ email: pending.email });
    if (!user) {
        user = await User.create({
            email: pending.email,
            passwordHash: pending.passwordHash,
            firstName: pending.firstName,
            lastName: pending.lastName,
            phone: pending.phone,
            role: pending.role,
            isActive: false,
            approvalStatus: "pending",
        });
    }
    if (user.approvalStatus !== "pending" || user.role === "admin") {
        throw new AppError(409, "Cette adresse est déjà associée à un compte", "EMAIL_IN_USE");
    }
    await sendAdminApprovalRequest(user.email, `${user.firstName} ${user.lastName}`, pending.role);
    await pending.deleteOne();
    return {
        email: user.email,
        approvalRequired: true,
    };
}
export async function bootstrapAdmin(input) {
    if (!env.ADMIN_BOOTSTRAP_ENABLED) {
        throw new AppError(403, "Le bootstrap administrateur est désactivé", "BOOTSTRAP_DISABLED");
    }
    const count = await User.countDocuments();
    if (count > 0) {
        throw new AppError(409, "Un utilisateur existe déjà", "ALREADY_INITIALIZED");
    }
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await User.create({
        ...input,
        email: input.email.toLowerCase(),
        passwordHash,
        role: "admin",
    });
    const token = signToken({
        id: String(user._id),
        role: user.role,
        email: user.email,
        tokenVersion: user.tokenVersion ?? 0,
    });
    return {
        token,
        user: { id: String(user._id), email: user.email, role: user.role },
    };
}
export async function hashPassword(password) {
    return bcrypt.hash(password, 12);
}
//# sourceMappingURL=authService.js.map