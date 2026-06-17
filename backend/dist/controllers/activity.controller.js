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
exports.getWeeklySummaryController = exports.deleteActivityController = exports.updateActivityController = exports.getActivityByIdController = exports.getActivitiesController = exports.createActivityController = void 0;
const activityService = __importStar(require("../services/activity.service"));
const response_utils_1 = require("../utils/response.utils");
const createActivityController = async (req, res, next) => {
    try {
        const entry = await activityService.createActivity(req.user.userId, req.body);
        (0, response_utils_1.sendSuccess)(res, entry, 201);
    }
    catch (err) {
        next(err);
    }
};
exports.createActivityController = createActivityController;
const getActivitiesController = async (req, res, next) => {
    try {
        const result = await activityService.getActivities(req.user.userId, {
            startDate: req.query['startDate'],
            endDate: req.query['endDate'],
            type: req.query['type'],
            page: req.query['page'] ? parseInt(req.query['page'], 10) : 1,
            limit: req.query['limit'] ? parseInt(req.query['limit'], 10) : 50,
        });
        (0, response_utils_1.sendSuccess)(res, result);
    }
    catch (err) {
        next(err);
    }
};
exports.getActivitiesController = getActivitiesController;
const getActivityByIdController = async (req, res, next) => {
    try {
        const entry = await activityService.getActivityById(req.params['id'], req.user.userId);
        (0, response_utils_1.sendSuccess)(res, entry);
    }
    catch (err) {
        next(err);
    }
};
exports.getActivityByIdController = getActivityByIdController;
const updateActivityController = async (req, res, next) => {
    try {
        const entry = await activityService.updateActivity(req.params['id'], req.user.userId, req.body);
        (0, response_utils_1.sendSuccess)(res, entry);
    }
    catch (err) {
        next(err);
    }
};
exports.updateActivityController = updateActivityController;
const deleteActivityController = async (req, res, next) => {
    try {
        await activityService.deleteActivity(req.params['id'], req.user.userId);
        (0, response_utils_1.sendSuccess)(res, null, 200, 'Activité supprimée');
    }
    catch (err) {
        next(err);
    }
};
exports.deleteActivityController = deleteActivityController;
const getWeeklySummaryController = async (req, res, next) => {
    try {
        const summary = await activityService.getWeeklyActivitySummary(req.user.userId);
        (0, response_utils_1.sendSuccess)(res, summary);
    }
    catch (err) {
        next(err);
    }
};
exports.getWeeklySummaryController = getWeeklySummaryController;
//# sourceMappingURL=activity.controller.js.map