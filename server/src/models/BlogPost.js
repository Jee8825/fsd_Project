import mongoose from 'mongoose';
import { createSchema } from './common.js';

const contentSection = new mongoose.Schema(
  {
    title: String,
    body: String,
  },
  { _id: false },
);

const schema = createSchema({
  id: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  slug: { type: String, required: true },
  coverImage: String,
  excerpt: String,
  content: { type: [contentSection], default: [] },
  authorId: String,
  category: String,
  tags: { type: [String], default: [] },
  readTime: Number,
  featured: { type: Boolean, default: false },
  createdAt: String,
});

export const BlogPost = mongoose.models.BlogPost || mongoose.model('BlogPost', schema);
