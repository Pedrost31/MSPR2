import mongoose from 'mongoose';
import { env } from './env';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000;

export const connectMongoDB = async (): Promise<void> => {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await mongoose.connect(env.MONGODB_URI);
      console.log('MongoDB connecté');
      return;
    } catch (error) {
      if (attempt === MAX_RETRIES) {
        console.error('Échec de connexion MongoDB après plusieurs tentatives :', error);
        process.exit(1);
      }
      console.warn(`MongoDB indisponible (tentative ${attempt}/${MAX_RETRIES}), nouvel essai...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
});
