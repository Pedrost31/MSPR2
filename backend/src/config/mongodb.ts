import mongoose from 'mongoose';
import { env } from './env';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000;

// Sur Windows, "localhost" se résout en IPv6 (::1) qui, ici, pointe vers le proxy
// Docker (conteneur healthai-mongo), alors que les microservices Python écrivent
// sur le mongod local en IPv4 (127.0.0.1). On force l'IPv4 pour que backend et
// services IA partagent la même base.
const resolveMongoUri = (uri: string): string =>
  uri.replace('://localhost', '://127.0.0.1');

export const connectMongoDB = async (): Promise<void> => {
  const uri = resolveMongoUri(env.MONGODB_URI);
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await mongoose.connect(uri);
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
