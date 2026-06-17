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
exports.logoutController = exports.refreshController = exports.loginController = exports.registerController = void 0;
const authService = __importStar(require("../services/auth.service"));
const response_utils_1 = require("../utils/response.utils");
const registerController = async (req, res, next) => {
    try {
        const result = await authService.register(req.body);
        (0, response_utils_1.sendSuccess)(res, result, 201, 'Inscription réussie');
    }
    catch (err) {
        next(err);
    }
};
exports.registerController = registerController;
const loginController = async (req, res, next) => {
    try {
        const result = await authService.login(req.body);
        (0, response_utils_1.sendSuccess)(res, result, 200, 'Connexion réussie');
    }
    catch (err) {
        next(err);
    }
};
exports.loginController = loginController;
const refreshController = async (req, res, next) => {
    try {
        const result = await authService.refreshTokens(req.body.refreshToken);
        (0, response_utils_1.sendSuccess)(res, result);
    }
    catch (err) {
        next(err);
    }
};
exports.refreshController = refreshController;
const logoutController = async (req, res, next) => {
    try {
        await authService.logout(req.body.refreshToken);
        (0, response_utils_1.sendSuccess)(res, null, 200, 'Déconnexion réussie');
    }
    catch (err) {
        next(err);
    }
};
exports.logoutController = logoutController;
//# sourceMappingURL=auth.controller.js.map