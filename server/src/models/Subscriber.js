import mongoose from 'mongoose';
import { createSchema } from './common.js';

const schema = createSchema({
  id: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true },
  source: { type: String, default: 'site' },
  active: { type: Boolean, default: true },
  createdAt: String,
});

export const Subscriber =
  mongoose.models.Subscriber || mongoose.model('Subscriber', schema);
