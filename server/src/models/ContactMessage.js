import mongoose from 'mongoose';
import { createSchema } from './common.js';

const schema = createSchema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  type: { type: String, default: 'support' },
  message: { type: String, required: true },
  status: { type: String, default: 'new' },
  createdAt: String,
  userId: String,
});

export const ContactMessage =
  mongoose.models.ContactMessage || mongoose.model('ContactMessage', schema);
