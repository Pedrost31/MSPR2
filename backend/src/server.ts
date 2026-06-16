import app from './app';
import { prisma } from './config/database';
import { connectMongoDB } from './config/mongodb';
import { env } from './config/env';

const start = async () => {
  await connectMongoDB();
  await prisma.$connect();
  console.log('PostgreSQL connecté');

  const server = app.listen(env.PORT, () => {
    console.log(`\nHealthAI Coach API — port ${env.PORT} (${env.NODE_ENV})`);
    console.log(`Docs : http://localhost:${env.PORT}/api-docs\n`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n${signal} reçu. Arrêt propre...`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
};

start().catch((err) => {
  console.error('Échec du démarrage :', err);
  process.exit(1);
});
