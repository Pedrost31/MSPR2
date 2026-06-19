"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshTokenSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Email invalide'),
    password: zod_1.z.string().min(8, 'Mot de passe : 8 caractères minimum'),
    name: zod_1.z.string().min(1).max(100),
    age: zod_1.z.number().int().min(1).max(150).optional(),
    weight: zod_1.z.number().positive().optional(),
    height: zod_1.z.number().positive().optional(),
    gender: zod_1.z.enum(['male', 'female', 'other']).optional(),
    activityLevel: zod_1.z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']).optional(),
    goal: zod_1.z.enum(['lose', 'maintain', 'gain']).optional(),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
exports.refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1),
});
//# sourceMappingURL=auth.schema.js.map