import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

const router = Router();

// Update profile schema
const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  avatarUrl: z.string().url().optional().nullable(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8),
});

// Get user profile
router.get('/profile', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      role: true,
      isVerified: true,
      createdAt: true,
      _count: {
        select: {
          reviews: true,
          favorites: true,
          restaurants: true,
        },
      },
    },
  });

  res.json({
    success: true,
    data: user,
  });
}));

// Update profile
router.patch('/profile', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const data = updateProfileSchema.parse(req.body);

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      role: true,
    },
  });

  res.json({
    success: true,
    data: user,
  });
}));

// Change password
router.post('/change-password', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const data = changePasswordSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
  });

  if (!user || !user.passwordHash) {
    throw new AppError('Password change not available for OAuth accounts', 400);
  }

  const isValid = await bcrypt.compare(data.currentPassword, user.passwordHash);
  
  if (!isValid) {
    throw new AppError('Current password is incorrect', 400);
  }

  const passwordHash = await bcrypt.hash(data.newPassword, 12);

  await prisma.user.update({
    where: { id: req.user!.id },
    data: { passwordHash },
  });

  // Invalidate all refresh tokens
  await prisma.refreshToken.deleteMany({
    where: { userId: req.user!.id },
  });

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
}));

// Get user's reviews
router.get('/reviews', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const { page = '1', limit = '20' } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = Math.min(parseInt(limit as string), 50);
  const skip = (pageNum - 1) * limitNum;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
      include: {
        menuItem: {
          include: {
            category: {
              include: {
                restaurant: {
                  select: {
                    id: true,
                    name: true,
                    city: true,
                    state: true,
                  },
                },
              },
            },
          },
        },
        photos: true,
      },
    }),
    prisma.review.count({ where: { userId: req.user!.id } }),
  ]);

  res.json({
    success: true,
    data: {
      reviews,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    },
  });
}));

// Get user's favorites
router.get('/favorites', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const { page = '1', limit = '20' } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = Math.min(parseInt(limit as string), 50);
  const skip = (pageNum - 1) * limitNum;

  const [favorites, total] = await Promise.all([
    prisma.favorite.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
      include: {
        menuItem: {
          include: {
            category: {
              include: {
                restaurant: {
                  select: {
                    id: true,
                    name: true,
                    city: true,
                    state: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.favorite.count({ where: { userId: req.user!.id } }),
  ]);

  res.json({
    success: true,
    data: {
      favorites: favorites.map(f => f.menuItem),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    },
  });
}));

// Get user's restaurants (for restaurant owners)
router.get('/restaurants', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const restaurants = await prisma.restaurant.findMany({
    where: { 
      ownerId: req.user!.id,
      isActive: true,
    },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          categories: true,
        },
      },
    },
  });

  res.json({
    success: true,
    data: restaurants,
  });
}));

// Delete account
router.delete('/account', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  // Soft delete - anonymize user data
  await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      email: `deleted_${req.user!.id}@deleted.local`,
      name: 'Deleted User',
      passwordHash: null,
      avatarUrl: null,
    },
  });

  // Delete refresh tokens
  await prisma.refreshToken.deleteMany({
    where: { userId: req.user!.id },
  });

  // Delete OAuth accounts
  await prisma.oAuthAccount.deleteMany({
    where: { userId: req.user!.id },
  });

  res.json({
    success: true,
    message: 'Account deleted successfully',
  });
}));

export default router;
