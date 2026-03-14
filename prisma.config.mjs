import 'dotenv/config';
import { defineConfig } from '@prisma/config';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set. Please define it in your .env file.');
}

export default defineConfig({
  // `datasource` (singular) is required by migrate; keep `datasources` for compatibility
  datasource: {
    url: databaseUrl,
  },
  datasources: {
    db: {
      provider: 'postgresql',
      url: databaseUrl,
    },
  },
});
