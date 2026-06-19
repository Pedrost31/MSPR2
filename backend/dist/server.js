"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const database_1 = require("./config/database");
const mongodb_1 = require("./config/mongodb");
const env_1 = require("./config/env");
const start = async () => {
    await (0, mongodb_1.connectMongoDB)();
    await database_1.prisma.$connect();
    console.log('PostgreSQL connecté');
    const server = app_1.default.listen(env_1.env.PORT, () => {
        console.log(`\nHealthAI Coach API — port ${env_1.env.PORT} (${env_1.env.NODE_ENV})`);
        console.log(`Docs : http://localhost:${env_1.env.PORT}/api-docs\n`);
    });
    const shutdown = async (signal) => {
        console.log(`\n${signal} reçu. Arrêt propre...`);
        server.close(async () => {
            await database_1.prisma.$disconnect();
            process.exit(0);
        });
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
};
start().catch((err) => {
    console.error('Échec du démarrage :', err);
    process.exit(1);
});
//# sourceMappingURL=server.js.map