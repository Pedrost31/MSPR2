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
exports.deleteMeController = exports.updateMeController = exports.getMeController = void 0;
const userService = __importStar(require("../services/user.service"));
const response_utils_1 = require("../utils/response.utils");
const getMeController = async (req, res, next) => {
    try {
        const user = await userService.getUserById(req.user.userId);
        (0, response_utils_1.sendSuccess)(res, user);
    }
    catch (err) {
        next(err);
    }
};
exports.getMeController = getMeController;
const updateMeController = async (req, res, next) => {
    try {
        const user = await userService.updateUser(req.user.userId, req.body);
        (0, response_utils_1.sendSuccess)(res, user, 200, 'Profil mis à jour');
    }
    catch (err) {
        next(err);
    }
};
exports.updateMeController = updateMeController;
const deleteMeController = async (req, res, next) => {
    try {
        await userService.deleteUser(req.user.userId);
        (0, response_utils_1.sendSuccess)(res, null, 200, 'Compte supprimé');
    }
    catch (err) {
        next(err);
    }
};
exports.deleteMeController = deleteMeController;
//# sourceMappingURL=user.controller.js.map