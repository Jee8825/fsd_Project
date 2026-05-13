import mongoose from 'mongoose';
import { createSchema } from './common.js';

const schema = createSchema({
  id: { type: String, required: true, unique: true, index: true },
  siteTitle: String,
  logoText: String,
  contactEmail: String,
  contactPhone: String,
  footerBlurb: String,
  featuredHeroRecipeId: String,
});

export const Setting = mongoose.models.Setting || mongoose.model('Setting', schema);
