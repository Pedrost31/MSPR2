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
exports.getDailySummaryController = exports.deleteFoodEntryController = exports.updateFoodEntryController = exports.getFoodEntryByIdController = exports.getFoodEntriesController = exports.createFoodEntryController = void 0;
const foodService = __importStar(require("../services/food.service"));
const response_utils_1 = require("../utils/response.utils");
const createFoodEntryController = async (req, res, next) => {
    try {
        const entry = await foodService.createFoodEntry(req.user.userId, req.body);
        (0, response_utils_1.sendSuccess)(res, entry, 201);
    }
    catch (err) {
        next(err);
    }
};
exports.createFoodEntryController = createFoodEntryController;
const getFoodEntriesController = async (req, res, next) => {
    try {
        const result = await foodService.getFoodEntries(req.user.userId, {
            startDate: req.query['startDate'],
            endDate: req.query['endDate'],
            mealType: req.query['mealType'],
            page: req.query['page'] ? parseInt(req.query['page'], 10) : 1,
            limit: req.query['limit'] ? parseInt(req.query['limit'], 10) : 50,
        });
        (0, response_utils_1.sendSuccess)(res, result);
    }
    catch (err) {
        next(err);
    }
};
exports.getFoodEntriesController = getFoodEntriesController;
const getFoodEntryByIdController = async (req, res, next) => {
    try {
        const entry = await foodService.getFoodEntryById(req.params['id'], req.user.userId);
        (0, response_utils_1.sendSuccess)(res, entry);
    }
    catch (err) {
        next(err);
    }
};
exports.getFoodEntryByIdController = getFoodEntryByIdController;
const updateFoodEntryController = async (req, res, next) => {
    try {
        const entry = await foodService.updateFoodEntry(req.params['id'], req.user.userId, req.body);
        (0, response_utils_1.sendSuccess)(res, entry);
    }
    catch (err) {
        next(err);
    }
};
exports.updateFoodEntryController = updateFoodEntryController;
const deleteFoodEntryController = async (req, res, next) => {
    try {
        await foodService.deleteFoodEntry(req.params['id'], req.user.userId);
        (0, response_utils_1.sendSuccess)(res, null, 200, 'Entrée supprimée');
    }
    catch (err) {
        next(err);
    }
};
exports.deleteFoodEntryController = deleteFoodEntryController;
const getDailySummaryController = async (req, res, next) => {
    try {
        const date = req.query['date'] ?? new Date().toISOString().split('T')[0];
        const summary = await foodService.getDailyNutritionSummary(req.user.userId, date);
        (0, response_utils_1.sendSuccess)(res, summary);
    }
    catch (err) {
        next(err);
    }
};
exports.getDailySummaryController = getDailySummaryController;
//# sourceMappingURL=food.controller.js.map