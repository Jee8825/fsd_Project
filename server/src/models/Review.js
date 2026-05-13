import mongoose from 'mongoose';
import { createSchema } from './common.js';

const schema = createSchema({
  id: { type: String, required: true, unique: true, index: true },
  recipeId: { type: String, required: true },
  userId: { type: String, required: true },
  rating: { type: Number, required: true },
  comment: String,
  createdAt: String,
  status: { type: String, default: 'approved' },
});

export const Review = mongoose.models.Review || mongoose.model('Review', schema);
