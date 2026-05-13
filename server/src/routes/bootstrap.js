import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
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

const router = Router();

const decodeUser = async (req) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return null;
    const decoded = jwt.verify(token, env.jwtSecret);
    return await User.findOne({ id: decoded.sub }).select('-passwordHash').lean();
  } catch (error) {
    return null;
  }
};

router.get('/', async (req, res, next) => {
  try {
    const user = await decodeUser(req);
    const isStaff = user && ['admin', 'editor'].includes(user.role);

    const [
      recipes,
      blogPosts,
      categories,
      cuisines,
      authors,
      reviews,
      users,
      collections,
      settings,
      announcements,
      contactMessages,
      recipeSubmissions,
      subscribers,
      recipeNotes,
    ] = await Promise.all([
      Recipe.find().lean(),
      BlogPost.find().lean(),
      Category.find().lean(),
      Cuisine.find().lean(),
      Author.find().lean(),
      Review.find().lean(),
      User.find().select('-passwordHash').lean(),
      Collection.find().lean(),
      Setting.findOne({ id: 'settings-primary' }).lean(),
      Announcement.find().lean(),
      isStaff ? ContactMessage.find().lean() : Promise.resolve([]),
      isStaff ? RecipeSubmission.find().lean() : Promise.resolve([]),
      isStaff ? Subscriber.find().lean() : Promise.resolve([]),
      user ? RecipeNote.find({ userId: user.id }).lean() : Promise.resolve([]),
    ]);

    res.json({
      recipes,
      blogPosts,
      categories,
      cuisines,
      authors,
      reviews,
      users,
      collections,
      settings,
      announcements,
      contactMessages,
      recipeSubmissions,
      subscribers,
      recipeNotes,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
