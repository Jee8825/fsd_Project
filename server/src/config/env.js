import dotenv from 'dotenv';

dotenv.config({ override: true });

export const env = {
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/saffron-table',
  jwtSecret: process.env.JWT_SECRET || 'saffron-table-dev-secret',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};
