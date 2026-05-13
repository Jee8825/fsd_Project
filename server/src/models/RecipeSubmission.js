import mongoose from 'mongoose';
import { createSchema } from './common.js';

const schema = createSchema({
  id: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  ingredientsText: { type: String, default: '' },
  instructionsText: { type: String, default: '' },
  cuisine: String,
  category: String,
  estimatedTime: Number,
  status: { type: String, default: 'pending' },
  reviewerNote: String,
  userId: String,
  submitterName: String,
  createdAt: String,
  reviewedAt: String,
});

export const RecipeSubmission =
  mongoose.models.RecipeSubmission || mongoose.model('RecipeSubmission', schema);
