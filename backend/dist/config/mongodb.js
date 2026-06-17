"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectMongoDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000;
const connectMongoDB = async () => {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            await mongoose_1.default.connect(env_1.env.MONGODB_URI);
            console.log('MongoDB connecté');
            return;
        }
        catch (error) {
            if (attempt === MAX_RETRIES) {
                console.error('Échec de connexion MongoDB après plusieurs tentatives :', error);
                process.exit(1);
            }
            console.warn(`MongoDB indisponible (tentative ${attempt}/${MAX_RETRIES}), nouvel essai...`);
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        }
    }
};
exports.connectMongoDB = connectMongoDB;
mongoose_1.default.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
});
//# sourceMappingURL=mongodb.js.map