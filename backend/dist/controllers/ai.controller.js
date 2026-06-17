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
exports.getRecommendationHistoryController = exports.getRecommendationController = void 0;
const zod_1 = require("zod");
const aiService = __importStar(require("../services/ai.service"));
const response_utils_1 = require("../utils/response.utils");
const recommendSchema = zod_1.z.object({
    type: zod_1.z.enum(['nutrition', 'activity', 'general']).default('general'),
    context: zod_1.z.string().max(500).optional(),
});
const getRecommendationController = async (req, res, next) => {
    try {
        const { type, context } = recommendSchema.parse(req.body);
        const rec = await aiService.generateRecommendation({ userId: req.user.userId, type, context });
        (0, response_utils_1.sendSuccess)(res, rec, 200, 'Recommandation générée');
    }
    catch (err) {
        next(err);
    }
};
exports.getRecommendationController = getRecommendationController;
const getRecommendationHistoryController = async (req, res, next) => {
    try {
        const type = req.query['type'];
        const limit = req.query['limit'] ? parseInt(req.query['limit'], 10) : 10;
        const history = await aiService.getRecommendationHistory(req.user.userId, type, limit);
        (0, response_utils_1.sendSuccess)(res, history);
    }
    catch (err) {
        next(err);
    }
};
exports.getRecommendationHistoryController = getRecommendationHistoryController;
//# sourceMappingURL=ai.controller.js.map