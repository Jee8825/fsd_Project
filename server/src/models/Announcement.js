import mongoose from 'mongoose';
import { createSchema } from './common.js';

const schema = createSchema({
  id: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  tone: { type: String, default: 'info' },
  active: { type: Boolean, default: true },
  link: String,
  createdAt: String,
  updatedAt: String,
  authorId: String,
});

export const Announcement =
  mongoose.models.Announcement || mongoose.model('Announcement', schema);
