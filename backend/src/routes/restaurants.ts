import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { authenticate, optionalAuth, requireRole, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Validation schemas
const createRestaurantSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().optional(),
  address: z.string().min(5),
  city: z.string().min(2),
  state: z.string().min(2),
  zipCode: z.string().min(5),
  country: z.string().default('USA'),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  cuisineType: z.array(z.string()).default([]),
  priceRange: z.number().min(1).max(4).default(2),
});

const updateRestaurantSchema = createRestaurantSchema.partial();

// List restaurants (with search/filter)
router.get('/', optionalAuth, asyncHandler(async (req: AuthRequest, res) => {
  const { 
    search, 
    city, 
    cuisine, 
    priceRange,
    minRating,
    page = '1',
    limit = '20',
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = Math.min(parseInt(limit as string), 50);
  const skip = (pageNum - 1) * limitNum;

  const where: any = {
    isActive: true,
  };

  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { description: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  if (city) {
    where.city = { equals: city as string, mode: 'insensitive' };
  }

  if (cuisine) {
    where.cuisineType = { has: cuisine as string };
  }

  if (priceRange) {
    where.priceRange = parseInt(priceRange as string);
  }

  if (minRating) {
    where.avgRating = { gte: parseFloat(minRating as string) };
  }

  const orderBy: any = {};
  if (sortBy === 'rating') {
    orderBy.avgRating = sortOrder;
  } else if (sortBy === 'reviews') {
    orderBy.totalReviews = sortOrder;
  } else {
    orderBy.createdAt = sortOrder;
  }

  const [restaurants, total] = await Promise.all([
    prisma.restaurant.findMany({
      where,
      orderBy,
      skip,
      take: limitNum,
      select: {
        id: true,
        name: true,
        description: true,
        address: true,
        city: true,
        state: true,
        imageUrl: true,
        cuisineType: true,
        priceRange: true,
        avgRating: true,
        totalReviews: true,
        isVerified: true,
      },
    }),
    prisma.restaurant.count({ where }),
  ]);

  res.json({
    success: true,
    data: {
      restaurants,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    },
  });
}));

// Get single restaurant with menu
router.get('/:id', optionalAuth, asyncHandler(async (req: AuthRequest, res) => {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: req.params.id },
    include: {
      categories: {
        orderBy: { sortOrder: 'asc' },
        include: {
          items: {
            where: { isAvailable: true },
            orderBy: [{ isPopular: 'desc' }, { name: 'asc' }],
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              imageUrl: true,
              isPopular: true,
              tags: true,
              avgRating: true,
              avgTasteRating: true,
              avgQualityRating: true,
              avgValueRating: true,
              avgPresentationRating: true,
              totalReviews: true,
            },
          },
        },
      },
      hours: {
        orderBy: { dayOfWeek: 'asc' },
      },
      owner: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!restaurant) {
    throw new AppError('Restaurant not found', 404);
  }

  res.json({
    success: true,
    data: restaurant,
  });
}));

// Create restaurant (requires auth)
router.post('/', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const data = createRestaurantSchema.parse(req.body);

  const restaurant = await prisma.restaurant.create({
    data: {
      ...data,
      ownerId: req.user!.id,
    },
  });

  // Upgrade user to restaurant owner if not already
  await prisma.user.update({
    where: { id: req.user!.id },
    data: { role: 'RESTAURANT_OWNER' },
  });

  res.status(201).json({
    success: true,
    data: restaurant,
  });
}));

// Update restaurant (owner only)
router.patch('/:id', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: req.params.id },
  });

  if (!restaurant) {
    throw new AppError('Restaurant not found', 404);
  }

  if (restaurant.ownerId !== req.user!.id && req.user!.role !== 'ADMIN') {
    throw new AppError('Access denied', 403);
  }

  const data = updateRestaurantSchema.parse(req.body);

  const updated = await prisma.restaurant.update({
    where: { id: req.params.id },
    data,
  });

  res.json({
    success: true,
    data: updated,
  });
}));

// Delete restaurant (owner/admin only)
router.delete('/:id', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: req.params.id },
  });

  if (!restaurant) {
    throw new AppError('Restaurant not found', 404);
  }

  if (restaurant.ownerId !== req.user!.id && req.user!.role !== 'ADMIN') {
    throw new AppError('Access denied', 403);
  }

  // Soft delete
  await prisma.restaurant.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });

  res.json({
    success: true,
    message: 'Restaurant deleted successfully',
  });
}));

// Get restaurant analytics (owner only)
router.get('/:id/analytics', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: req.params.id },
    include: {
      categories: {
        include: {
          items: {
            select: {
              id: true,
              name: true,
              avgRating: true,
              totalReviews: true,
            },
          },
        },
      },
    },
  });

  if (!restaurant) {
    throw new AppError('Restaurant not found', 404);
  }

  if (restaurant.ownerId !== req.user!.id && req.user!.role !== 'ADMIN') {
    throw new AppError('Access denied', 403);
  }

  // Get recent reviews
  const recentReviews = await prisma.review.findMany({
    where: {
      menuItem: {
        category: {
          restaurantId: req.params.id,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      user: { select: { name: true, avatarUrl: true } },
      menuItem: { select: { name: true } },
    },
  });

  // Calculate stats
  const allItems = restaurant.categories.flatMap(c => c.items);
  const topItems = allItems
    .filter(i => i.avgRating !== null)
    .sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0))
    .slice(0, 5);

  res.json({
    success: true,
    data: {
      overview: {
        avgRating: restaurant.avgRating,
        totalReviews: restaurant.totalReviews,
        totalMenuItems: allItems.length,
      },
      topItems,
      recentReviews,
    },
  });
}));

export default router;
