import mongoose from 'mongoose';
import { createSchema } from './common.js';

const schema = createSchema({
  id: { type: String, required: true, unique: true, index: true },
  recipeId: { type: String, required: true },
  userId: { type: String, required: true },
  body: { type: String, required: true },
  createdAt: String,
  updatedAt: String,
});

schema.index({ recipeId: 1, userId: 1 }, { unique: true });

export const RecipeNote =
  mongoose.models.RecipeNote || mongoose.model('RecipeNote', schema);
