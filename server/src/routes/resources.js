import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { normalizePayload, resourceRegistry, syncRecipeMetrics } from '../services/resourceRegistry.js';

const router = Router();

const ADMIN_ONLY_RESOURCES = new Set(['contactMessages', 'subscribers', 'recipeSubmissions']);

const decodeUserFromHeader = async (req) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return null;
    const jwt = (await import('jsonwebtoken')).default;
    const env = (await import('../config/env.js')).env;
    const decoded = jwt.verify(token, env.jwtSecret);
    const User = (await import('../models/index.js')).User;
    return await User.findOne({ id: decoded.sub }).select('-passwordHash').lean();
  } catch (error) {
    return null;
  }
};

router.get('/:resource', async (req, res, next) => {
  try {
    const entry = resourceRegistry[req.params.resource];
    if (!entry) return res.status(404).json({ message: 'Unknown resource.' });

    if (ADMIN_ONLY_RESOURCES.has(req.params.resource)) {
      const user = await decodeUserFromHeader(req);
      if (!user || !['admin', 'editor'].includes(user.role)) {
        return res.status(403).json({ message: 'Insufficient permissions.' });
      }
    }

    if (req.params.resource === 'recipeNotes') {
      const user = await decodeUserFromHeader(req);
      if (!user) return res.status(401).json({ message: 'Authentication required.' });
      const items = await entry.model.find({ userId: user.id }).lean();
      return res.json(items);
    }

    const query = req.params.resource === 'users' ? entry.model.find().select('-passwordHash') : entry.model.find();
    const items = await query.lean();
    res.json(items);
  } catch (error) {
    next(error);
  }
});

router.get('/:resource/:id', async (req, res, next) => {
  try {
    const entry = resourceRegistry[req.params.resource];
    if (!entry) return res.status(404).json({ message: 'Unknown resource.' });
    const item = await entry.model.findOne({ id: req.params.id }).lean();
    if (!item) return res.status(404).json({ message: `${entry.singular} not found.` });
    res.json(item);
  } catch (error) {
    next(error);
  }
});

router.post('/reviews', requireAuth, async (req, res, next) => {
  try {
    const payload = normalizePayload('reviews', {
      ...req.body,
      userId: req.user.id,
    });
    const created = await resourceRegistry.reviews.model.create(payload);
    await syncRecipeMetrics(payload.recipeId);
    res.status(201).json(created.toJSON());
  } catch (error) {
    next(error);
  }
});

router.post('/contactMessages', async (req, res, next) => {
  try {
    const payload = normalizePayload('contactMessages', req.body);
    const created = await resourceRegistry.contactMessages.model.create(payload);
    res.status(201).json(created.toJSON());
  } catch (error) {
    next(error);
  }
});

router.post('/subscribers', async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ message: 'Email is required.' });
    const existing = await resourceRegistry.subscribers.model.findOne({ email }).lean();
    if (existing) {
      return res.status(200).json({ ...existing, alreadySubscribed: true });
    }
    const payload = normalizePayload('subscribers', { ...req.body, email });
    const created = await resourceRegistry.subscribers.model.create(payload);
    res.status(201).json(created.toJSON());
  } catch (error) {
    next(error);
  }
});

router.post('/recipeSubmissions', requireAuth, async (req, res, next) => {
  try {
    const payload = normalizePayload('recipeSubmissions', {
      ...req.body,
      userId: req.user.id,
      submitterName: req.user.name,
    });
    const created = await resourceRegistry.recipeSubmissions.model.create(payload);
    res.status(201).json(created.toJSON());
  } catch (error) {
    next(error);
  }
});

router.post('/recipeNotes', requireAuth, async (req, res, next) => {
  try {
    const recipeId = req.body?.recipeId;
    if (!recipeId) return res.status(400).json({ message: 'recipeId is required.' });
    const userId = req.user.id;
    const existing = await resourceRegistry.recipeNotes.model.findOne({ recipeId, userId }).lean();
    const payload = normalizePayload('recipeNotes', { ...req.body, userId, recipeId }, existing || {});
    const saved = await resourceRegistry.recipeNotes.model.findOneAndUpdate(
      { recipeId, userId },
      payload,
      { new: true, upsert: true },
    ).lean();
    res.status(existing ? 200 : 201).json(saved);
  } catch (error) {
    next(error);
  }
});

router.delete('/recipeNotes/by-recipe/:recipeId', requireAuth, async (req, res, next) => {
  try {
    await resourceRegistry.recipeNotes.model.deleteOne({
      recipeId: req.params.recipeId,
      userId: req.user.id,
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.post('/:resource', requireAuth, requireRole('admin', 'editor'), async (req, res, next) => {
  try {
    const entry = resourceRegistry[req.params.resource];
    const reservedPublic = ['reviews', 'contactMessages', 'subscribers', 'recipeSubmissions', 'recipeNotes'];
    if (!entry || reservedPublic.includes(req.params.resource)) {
      return res.status(404).json({ message: 'Unknown resource.' });
    }
    const payload = normalizePayload(req.params.resource, {
      ...req.body,
      ...(req.params.resource === 'announcements' ? { authorId: req.user.id } : {}),
    });
    const created = await entry.model.create(payload);
    const response =
      req.params.resource === 'users'
        ? await entry.model.findOne({ id: created.id }).select('-passwordHash').lean()
        : created.toJSON();
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

router.put('/settings/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const payload = normalizePayload('settings', { ...req.body, id: req.params.id });
    const setting = await resourceRegistry.settings.model.findOneAndUpdate(
      { id: req.params.id },
      payload,
      { new: true, upsert: true },
    ).lean();
    res.json(setting);
  } catch (error) {
    next(error);
  }
});

router.put('/:resource/:id', requireAuth, requireRole('admin', 'editor'), async (req, res, next) => {
  try {
    const entry = resourceRegistry[req.params.resource];
    if (!entry || req.params.resource === 'settings') return res.status(404).json({ message: 'Unknown resource.' });
    const existing = await entry.model.findOne({ id: req.params.id }).lean();
    if (!existing) return res.status(404).json({ message: `${entry.singular} not found.` });
    const payload = normalizePayload(req.params.resource, { ...req.body, id: req.params.id }, existing);
    await entry.model.findOneAndUpdate({ id: req.params.id }, payload, { new: true });
    if (req.params.resource === 'reviews') {
      await syncRecipeMetrics(payload.recipeId);
    }
    const response =
      req.params.resource === 'users'
        ? await entry.model.findOne({ id: req.params.id }).select('-passwordHash').lean()
        : await entry.model.findOne({ id: req.params.id }).lean();
    res.json(response);
  } catch (error) {
    next(error);
  }
});

router.delete('/:resource/:id', requireAuth, requireRole('admin', 'editor'), async (req, res, next) => {
  try {
    const entry = resourceRegistry[req.params.resource];
    if (!entry) return res.status(404).json({ message: 'Unknown resource.' });
    const existing = await entry.model.findOneAndDelete({ id: req.params.id }).lean();
    if (!existing) return res.status(404).json({ message: `${entry.singular} not found.` });
    if (req.params.resource === 'reviews') {
      await syncRecipeMetrics(existing.recipeId);
    }
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.patch('/reviews/:id/status', requireAuth, requireRole('admin', 'editor'), async (req, res, next) => {
  try {
    const review = await resourceRegistry.reviews.model.findOneAndUpdate(
      { id: req.params.id },
      { status: req.body.status },
      { new: true },
    );
    if (!review) return res.status(404).json({ message: 'Review not found.' });
    await syncRecipeMetrics(review.recipeId);
    res.json(review.toJSON());
  } catch (error) {
    next(error);
  }
});

router.patch('/recipeSubmissions/:id/status', requireAuth, requireRole('admin', 'editor'), async (req, res, next) => {
  try {
    const update = {
      status: req.body.status,
      reviewerNote: req.body.reviewerNote || '',
      reviewedAt: new Date().toISOString(),
    };
    const submission = await resourceRegistry.recipeSubmissions.model.findOneAndUpdate(
      { id: req.params.id },
      update,
      { new: true },
    ).lean();
    if (!submission) return res.status(404).json({ message: 'Submission not found.' });
    res.json(submission);
  } catch (error) {
    next(error);
  }
});

router.patch('/contactMessages/:id/status', requireAuth, requireRole('admin', 'editor'), async (req, res, next) => {
  try {
    const message = await resourceRegistry.contactMessages.model.findOneAndUpdate(
      { id: req.params.id },
      { status: req.body.status },
      { new: true },
    ).lean();
    if (!message) return res.status(404).json({ message: 'Message not found.' });
    res.json(message);
  } catch (error) {
    next(error);
  }
});

router.patch('/users/:id/role', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const user = await resourceRegistry.users.model.findOneAndUpdate(
      { id: req.params.id },
      { role: req.body.role },
      { new: true },
    ).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user.toJSON());
  } catch (error) {
    next(error);
  }
});

export default router;
