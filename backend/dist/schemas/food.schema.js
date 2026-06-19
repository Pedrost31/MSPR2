"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFoodEntrySchema = exports.createFoodEntrySchema = void 0;
const zod_1 = require("zod");
exports.createFoodEntrySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200),
    calories: zod_1.z.number().nonnegative(),
    protein: zod_1.z.number().nonnegative().optional(),
    carbs: zod_1.z.number().nonnegative().optional(),
    fat: zod_1.z.number().nonnegative().optional(),
    fiber: zod_1.z.number().nonnegative().optional(),
    mealType: zod_1.z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
    date: zod_1.z.string().datetime().optional(),
});
exports.updateFoodEntrySchema = exports.createFoodEntrySchema.partial();
//# sourceMappingURL=food.schema.js.map