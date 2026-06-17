"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateGoalSchema = void 0;
const zod_1 = require("zod");
exports.updateGoalSchema = zod_1.z.object({
    dailyCalorieTarget: zod_1.z.number().int().positive().optional(),
    dailyProteinTarget: zod_1.z.number().positive().optional(),
    dailyCarbsTarget: zod_1.z.number().positive().optional(),
    dailyFatTarget: zod_1.z.number().positive().optional(),
    weeklyWorkoutTarget: zod_1.z.number().int().positive().optional(),
    targetWeight: zod_1.z.number().positive().optional(),
});
//# sourceMappingURL=goal.schema.js.map