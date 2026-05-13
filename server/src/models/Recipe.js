import mongoose from 'mongoose';
import { createSchema } from './common.js';

const ingredientSchema = new mongoose.Schema(
  {
    name: String,
    amount: Number,
    unit: String,
    category: String,
  },
  { _id: false },
);

const faqSchema = new mongoose.Schema(
  {
    question: String,
    answer: String,
  },
  { _id: false },
);

const schema = createSchema({
  id: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  slug: { type: String, required: true },
  image: String,
  gallery: { type: [String], default: [] },
  shortDescription: String,
  fullDescription: String,
  category: String,
  cuisine: String,
  mealType: String,
  dietType: String,
  difficulty: String,
  prepTime: Number,
  cookTime: Number,
  totalTime: Number,
  servings: Number,
  calories: Number,
  protein: Number,
  carbs: Number,
  fat: Number,
  ingredients: { type: [ingredientSchema], default: [] },
  instructions: { type: [String], default: [] },
  tips: { type: [String], default: [] },
  substitutions: { type: [String], default: [] },
  faq: { type: [faqSchema], default: [] },
  notes: { type: [String], default: [] },
  storage: String,
  tags: { type: [String], default: [] },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  authorId: String,
  pantryFriendly: { type: Boolean, default: false },
  estimatedCost: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  trending: { type: Boolean, default: false },
  seasonal: { type: Boolean, default: false },
  createdAt: String,
  updatedAt: String,
});

export const Recipe = mongoose.models.Recipe || mongoose.model('Recipe', schema);
