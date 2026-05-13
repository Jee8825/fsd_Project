import { createId, createSlug, getAverageRating } from '../../../src/utils/helpers.js';
import {
  Announcement,
  Author,
  BlogPost,
  Category,
  Collection,
  ContactMessage,
  Cuisine,
  Recipe,
  RecipeNote,
  RecipeSubmission,
  Review,
  Setting,
  Subscriber,
  User,
} from '../models/index.js';

export const resourceRegistry = {
  recipes: { model: Recipe, singular: 'recipe' },
  blogPosts: { model: BlogPost, singular: 'blog post' },
  categories: { model: Category, singular: 'category' },
  cuisines: { model: Cuisine, singular: 'cuisine' },
  authors: { model: Author, singular: 'author' },
  reviews: { model: Review, singular: 'review' },
  users: { model: User, singular: 'user' },
  collections: { model: Collection, singular: 'collection' },
  settings: { model: Setting, singular: 'setting' },
  announcements: { model: Announcement, singular: 'announcement' },
  contactMessages: { model: ContactMessage, singular: 'contact message' },
  recipeSubmissions: { model: RecipeSubmission, singular: 'recipe submission' },
  subscribers: { model: Subscriber, singular: 'subscriber' },
  recipeNotes: { model: RecipeNote, singular: 'recipe note' },
};

export const normalizePayload = (resource, payload, existing = {}) => {
  const merged = { ...existing, ...payload };

  if (['recipes', 'blogPosts', 'categories', 'cuisines', 'authors', 'collections'].includes(resource)) {
    const titleLike = merged.title || merged.name;
    merged.slug = merged.slug || createSlug(titleLike || merged.id || resource);
  }

  if (resource === 'recipes') {
    merged.id = merged.id || createId('recipe');
    merged.totalTime = Number(merged.prepTime || 0) + Number(merged.cookTime || 0);
    merged.gallery = merged.gallery || [];
    merged.tags = merged.tags || [];
    merged.ingredients = merged.ingredients || [];
    merged.instructions = merged.instructions || [];
    merged.tips = merged.tips || ['Chef note coming soon.'];
    merged.substitutions = merged.substitutions || [];
    merged.faq = merged.faq || [];
    merged.notes = merged.notes || [];
    merged.createdAt = merged.createdAt || new Date().toISOString();
    merged.updatedAt = new Date().toISOString();
    merged.reviewCount = merged.reviewCount || 0;
    merged.rating = merged.rating || 0;
  }

  if (resource === 'blogPosts') {
    merged.id = merged.id || createId('blog');
    merged.tags = merged.tags || [];
    merged.content = merged.content || [];
    merged.createdAt = merged.createdAt || new Date().toISOString();
  }

  if (resource === 'reviews') {
    merged.id = merged.id || createId('review');
    merged.createdAt = merged.createdAt || new Date().toISOString();
    merged.status = merged.status || 'approved';
  }

  if (resource === 'users') {
    merged.id = merged.id || createId('user');
    merged.savedRecipes = merged.savedRecipes || [];
    merged.preferences = merged.preferences || [];
  }

  if (resource === 'settings') {
    merged.id = merged.id || 'settings-primary';
  }

  if (['categories', 'cuisines'].includes(resource)) {
    merged.id = merged.id || createId(resource.slice(0, -1));
  }

  if (resource === 'authors') {
    merged.id = merged.id || createId('author');
    merged.socialLinks = merged.socialLinks || existing.socialLinks || {};
  }

  if (resource === 'collections') {
    merged.id = merged.id || createId('collection');
    merged.recipeIds = merged.recipeIds || [];
  }

  if (resource === 'announcements') {
    merged.id = merged.id || createId('announcement');
    merged.createdAt = merged.createdAt || new Date().toISOString();
    merged.updatedAt = new Date().toISOString();
    if (typeof merged.active === 'undefined') merged.active = true;
    merged.tone = merged.tone || 'info';
  }

  if (resource === 'contactMessages') {
    merged.id = merged.id || createId('message');
    merged.createdAt = merged.createdAt || new Date().toISOString();
    merged.status = merged.status || 'new';
    merged.type = merged.type || 'support';
  }

  if (resource === 'recipeSubmissions') {
    merged.id = merged.id || createId('submission');
    merged.createdAt = merged.createdAt || new Date().toISOString();
    merged.status = merged.status || 'pending';
  }

  if (resource === 'subscribers') {
    merged.id = merged.id || createId('subscriber');
    merged.createdAt = merged.createdAt || new Date().toISOString();
    if (typeof merged.active === 'undefined') merged.active = true;
    merged.source = merged.source || 'site';
  }

  if (resource === 'recipeNotes') {
    merged.id = merged.id || createId('note');
    merged.createdAt = merged.createdAt || new Date().toISOString();
    merged.updatedAt = new Date().toISOString();
  }

  return merged;
};

export const syncRecipeMetrics = async (recipeId) => {
  const approvedReviews = await Review.find({ recipeId, status: 'approved' }).lean();
  const rating = Number(getAverageRating(approvedReviews).toFixed(1)) || 0;
  await Recipe.findOneAndUpdate(
    { id: recipeId },
    {
      rating,
      reviewCount: approvedReviews.length,
      updatedAt: new Date().toISOString(),
    },
  );
};
