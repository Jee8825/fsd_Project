import mongoose from 'mongoose';
import { createSchema } from './common.js';

const schema = createSchema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  avatar: String,
  role: { type: String, default: 'viewer' },
  savedRecipes: { type: [String], default: [] },
  preferences: { type: [String], default: [] },
  passwordHash: { type: String, select: false },
});

export const User = mongoose.models.User || mongoose.model('User', schema);
