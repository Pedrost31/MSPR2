"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const user_routes_1 = __importDefault(require("./user.routes"));
const food_routes_1 = __importDefault(require("./food.routes"));
const activity_routes_1 = __importDefault(require("./activity.routes"));
const goal_routes_1 = __importDefault(require("./goal.routes"));
const ai_routes_1 = __importDefault(require("./ai.routes"));
const router = (0, express_1.Router)();
router.use('/auth', auth_routes_1.default);
router.use('/users', user_routes_1.default);
router.use('/food-entries', food_routes_1.default);
router.use('/activities', activity_routes_1.default);
router.use('/goals', goal_routes_1.default);
router.use('/ai', ai_routes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map