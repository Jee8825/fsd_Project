import app from './app.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { seedDatabase } from './services/seedDatabase.js';

const start = async () => {
  try {
    await connectDatabase();
    await seedDatabase();
    app.listen(env.port, () => {
      console.log(`API server listening on http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start backend:', error.message);
    process.exit(1);
  }
};

start();
