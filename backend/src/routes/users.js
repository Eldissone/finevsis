import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { buildAuthResponse, sanitizeUser, signAuthToken } from '../services/authService.js';
import { normalizeOptionalString } from '../utils/locationFilters.js';

const router = Router();

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function normalizeProfilePayload(body) {
  const payload = {};

  if (Object.prototype.hasOwnProperty.call(body, 'name')) {
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) throw badRequest('name is required');
    payload.name = name;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'bio')) {
    payload.bio = normalizeOptionalString(body.bio);
  }

  if (Object.prototype.hasOwnProperty.call(body, 'country')) {
    payload.country = normalizeOptionalString(body.country);
  }

  if (Object.prototype.hasOwnProperty.call(body, 'city')) {
    payload.city = normalizeOptionalString(body.city);
  }

  if (Object.prototype.hasOwnProperty.call(body, 'avatarUrl')) {
    payload.avatarUrl = normalizeOptionalString(body.avatarUrl);
  }

  return payload;
}

router.post('/register', async (req, res, next) => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const email = normalizeEmail(req.body.email);
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!name) throw badRequest('name is required');
    if (!email) throw badRequest('email is required');
    if (password.length < 6) throw badRequest('password must be at least 6 characters');

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        country: normalizeOptionalString(req.body.country),
        city: normalizeOptionalString(req.body.city),
      },
    });

    const token = signAuthToken(user);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json(buildAuthResponse(user));
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!email || !password) throw badRequest('email and password are required');

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      const error = new Error('Credenciais invalidas');
      error.status = 401;
      throw error;
    }

    const token = signAuthToken(user);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json(buildAuthResponse(user));
  } catch (error) {
    next(error);
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  });
  res.json({ message: 'Logout successful' });
});

router.get('/me', requireAuth, async (req, res) => {
  res.json(req.user);
});

router.put('/me', requireAuth, async (req, res, next) => {
  try {
    const data = normalizeProfilePayload(req.body);
    if (Object.keys(data).length === 0) {
      return res.json(req.user);
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data,
    });

    res.json(sanitizeUser(updatedUser));
  } catch (error) {
    next(error);
  }
});

export default router;
