import mongoose from 'mongoose';
import { createSchema } from './common.js';

const schema = createSchema({
  id: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  slug: { type: String, required: true },
  description: String,
  image: String,
  recipeIds: { type: [String], default: [] },
});

export const Collection = mongoose.models.Collection || mongoose.model('Collection', schema);
