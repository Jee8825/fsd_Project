import bcrypt from 'bcryptjs';
import {
  authors,
  blogPosts,
  categories,
  collections,
  cuisines,
  recipes,
  reviews,
  siteSettings,
  users,
} from '../../../src/data/mockData.js';
import {
  Announcement,
  Author,
  BlogPost,
  Category,
  Collection,
  Cuisine,
  Recipe,
  Review,
  Setting,
  User,
} from '../models/index.js';

const hashedUsers = async () =>
  Promise.all(
    users.map(async (user) => ({
      ...user,
      passwordHash: await bcrypt.hash(`${user.role}123`, 10),
    })),
  );

const announcementsSeed = [
  {
    id: 'announcement-welcome',
    title: 'Welcome to Saffron Table',
    message:
      'Browse seasonal collections, save favorites, and try our new recipe submission feature in your profile.',
    tone: 'info',
    active: true,
    link: '/recipes',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const seedDatabase = async ({ force = false } = {}) => {
  const collectionsToSeed = [
    { model: Category, data: categories },
    { model: Cuisine, data: cuisines },
    { model: Author, data: authors },
    { model: Recipe, data: recipes },
    { model: BlogPost, data: blogPosts },
    { model: Review, data: reviews },
    { model: User, data: await hashedUsers() },
    { model: Collection, data: collections },
    { model: Setting, data: [{ id: 'settings-primary', ...siteSettings }] },
    { model: Announcement, data: announcementsSeed },
  ];

  for (const entry of collectionsToSeed) {
    if (force) {
      await entry.model.deleteMany({});
    }
    const count = await entry.model.countDocuments();
    if (!count) {
      await entry.model.insertMany(entry.data);
    }
  }
};
