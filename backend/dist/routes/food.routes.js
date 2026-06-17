"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const foodController = __importStar(require("../controllers/food.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validate_middleware_1 = require("../middlewares/validate.middleware");
const food_schema_1 = require("../schemas/food.schema");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.get('/daily-summary', foodController.getDailySummaryController);
router.post('/', (0, validate_middleware_1.validate)(food_schema_1.createFoodEntrySchema), foodController.createFoodEntryController);
router.get('/', foodController.getFoodEntriesController);
router.get('/:id', foodController.getFoodEntryByIdController);
router.put('/:id', (0, validate_middleware_1.validate)(food_schema_1.updateFoodEntrySchema), foodController.updateFoodEntryController);
router.delete('/:id', foodController.deleteFoodEntryController);
exports.default = router;
//# sourceMappingURL=food.routes.js.map