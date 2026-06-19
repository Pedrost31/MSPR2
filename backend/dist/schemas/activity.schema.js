"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateActivitySchema = exports.createActivitySchema = void 0;
const zod_1 = require("zod");
exports.createActivitySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200),
    duration: zod_1.z.number().int().positive('Durée en minutes requise'),
    caloriesBurned: zod_1.z.number().nonnegative(),
    type: zod_1.z.enum(['cardio', 'strength', 'flexibility', 'sports', 'other']).optional(),
    date: zod_1.z.string().datetime().optional(),
});
exports.updateActivitySchema = exports.createActivitySchema.partial();
//# sourceMappingURL=activity.schema.js.map