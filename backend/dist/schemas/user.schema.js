"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserSchema = void 0;
const zod_1 = require("zod");
exports.updateUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).optional(),
    age: zod_1.z.number().int().min(1).max(150).optional(),
    weight: zod_1.z.number().positive().optional(),
    height: zod_1.z.number().positive().optional(),
    gender: zod_1.z.enum(['male', 'female', 'other']).optional(),
    activityLevel: zod_1.z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']).optional(),
    goal: zod_1.z.enum(['lose', 'maintain', 'gain']).optional(),
    dailyCalorieTarget: zod_1.z.number().int().positive().optional(),
    password: zod_1.z.string().min(8).optional(),
});
//# sourceMappingURL=user.schema.js.map