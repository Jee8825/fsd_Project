import mongoose from 'mongoose';
import { createSchema } from './common.js';

const schema = createSchema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  slug: { type: String, required: true },
  image: String,
  description: String,
});

export const Category = mongoose.models.Category || mongoose.model('Category', schema);
