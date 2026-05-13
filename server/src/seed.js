import { connectDatabase } from './config/database.js';
import { seedDatabase } from './services/seedDatabase.js';

const run = async () => {
  await connectDatabase();
  await seedDatabase({ force: true });
  console.log('Database seeded successfully.');
  process.exit(0);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
