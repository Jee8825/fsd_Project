import mongoose from 'mongoose';
import { createSchema } from './common.js';

const schema = createSchema({
  id: { type: String, required: true, unique: true, index: true },
  slug: String,
  name: { type: String, required: true },
  avatar: String,
  bio: String,
  specialty: String,
  socialLinks: { type: Object, default: {} },
});

export const Author = mongoose.models.Author || mongoose.model('Author', schema);
