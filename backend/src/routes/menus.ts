import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Validation schemas
const createCategorySchema = z.object({
  restaurantId: z.string(),
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  sortOrder: z.number().default(0),
});

const createMenuItemSchema = z.object({
  categoryId: z.string(),
  name: z.string().min(2).max(200),
  description: z.string().optional(),
  price: z.number().positive(),
  imageUrl: z.string().url().optional(),
  isAvailable: z.boolean().default(true),
  isPopular: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});

const updateMenuItemSchema = createMenuItemSchema.partial().omit({ categoryId: true });

// Get menu items (search across all restaurants)
router.get('/items', optionalAuth, asyncHandler(async (req: AuthRequest, res) => {
  const { 
    search, 
    restaurant,
    tags,
    minRating,
    maxPrice,
    page = '1',
    limit = '20',
    sortBy = 'rating',
    sortOrder = 'desc'
  } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = Math.min(parseInt(limit as string), 50);
  const skip = (pageNum - 1) * limitNum;

  const where: any = {
    isAvailable: true,
    category: {
      restaurant: {
        isActive: true,
      },
    },
  };

  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { description: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  if (restaurant) {
    where.category = {
      ...where.category,
      restaurantId: restaurant as string,
    };
  }

  if (tags) {
    const tagList = (tags as string).split(',');
    where.tags = { hasSome: tagList };
  }

  if (minRating) {
    where.avgRating = { gte: parseFloat(minRating as string) };
  }

  if (maxPrice) {
    where.price = { lte: parseFloat(maxPrice as string) };
  }

  const orderBy: any = {};
  if (sortBy === 'rating') {
    orderBy.avgRating = sortOrder === 'asc' ? 'asc' : 'desc';
  } else if (sortBy === 'price') {
    orderBy.price = sortOrder;
  } else if (sortBy === 'reviews') {
    orderBy.totalReviews = sortOrder;
  } else {
    orderBy.createdAt = sortOrder;
  }

  const [items, total] = await Promise.all([
    prisma.menuItem.findMany({
      where,
      orderBy,
      skip,
      take: limitNum,
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
    }),
    prisma.menuItem.count({ where }),
  ]);

  res.json({
    success: true,
    data: {
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    },
  });
}));

// Get single menu item with reviews
router.get('/items/:id', optionalAuth, asyncHandler(async (req: AuthRequest, res) => {
  const item = await prisma.menuItem.findUnique({
    where: { id: req.params.id },
    include: {
      category: {
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              state: true,
              cuisineType: true,
              priceRange: true,
            },
          },
        },
      },
      reviews: {
        where: { isVisible: true },
        orderBy: [{ helpfulCount: 'desc' }, { createdAt: 'desc' }],
        take: 10,
        include: {
          user: {
            select: { id: true, name: true, avatarUrl: true },
          },
          photos: true,
        },
      },
      favorites: req.user 
        ? { where: { userId: req.user.id }, select: { id: true } }
        : false,
    },
  });

  if (!item) {
    throw new AppError('Menu item not found', 404);
  }

  const isFavorited = req.user ? item.favorites && item.favorites.length > 0 : false;

  res.json({
    success: true,
    data: {
      ...item,
      isFavorited,
    },
  });
}));

// Create category (restaurant owner)
router.post('/categories', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const data = createCategorySchema.parse(req.body);

  // Verify ownership
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: data.restaurantId },
  });

  if (!restaurant) {
    throw new AppError('Restaurant not found', 404);
  }

  if (restaurant.ownerId !== req.user!.id && req.user!.role !== 'ADMIN') {
    throw new AppError('Access denied', 403);
  }

  const category = await prisma.menuCategory.create({
    data,
  });

  res.status(201).json({
    success: true,
    data: category,
  });
}));

// Update category
router.patch('/categories/:id', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const category = await prisma.menuCategory.findUnique({
    where: { id: req.params.id },
    include: { restaurant: true },
  });

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  if (category.restaurant.ownerId !== req.user!.id && req.user!.role !== 'ADMIN') {
    throw new AppError('Access denied', 403);
  }

  const updated = await prisma.menuCategory.update({
    where: { id: req.params.id },
    data: req.body,
  });

  res.json({
    success: true,
    data: updated,
  });
}));

// Delete category
router.delete('/categories/:id', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const category = await prisma.menuCategory.findUnique({
    where: { id: req.params.id },
    include: { restaurant: true },
  });

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  if (category.restaurant.ownerId !== req.user!.id && req.user!.role !== 'ADMIN') {
    throw new AppError('Access denied', 403);
  }

  await prisma.menuCategory.delete({
    where: { id: req.params.id },
  });

  res.json({
    success: true,
    message: 'Category deleted successfully',
  });
}));

// Create menu item
router.post('/items', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const data = createMenuItemSchema.parse(req.body);

  // Verify ownership
  const category = await prisma.menuCategory.findUnique({
    where: { id: data.categoryId },
    include: { restaurant: true },
  });

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  if (category.restaurant.ownerId !== req.user!.id && req.user!.role !== 'ADMIN') {
    throw new AppError('Access denied', 403);
  }

  const item = await prisma.menuItem.create({
    data,
  });

  res.status(201).json({
    success: true,
    data: item,
  });
}));

// Update menu item
router.patch('/items/:id', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const item = await prisma.menuItem.findUnique({
    where: { id: req.params.id },
    include: {
      category: {
        include: { restaurant: true },
      },
    },
  });

  if (!item) {
    throw new AppError('Menu item not found', 404);
  }

  if (item.category.restaurant.ownerId !== req.user!.id && req.user!.role !== 'ADMIN') {
    throw new AppError('Access denied', 403);
  }

  const data = updateMenuItemSchema.parse(req.body);

  const updated = await prisma.menuItem.update({
    where: { id: req.params.id },
    data,
  });

  res.json({
    success: true,
    data: updated,
  });
}));

// Delete menu item
router.delete('/items/:id', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const item = await prisma.menuItem.findUnique({
    where: { id: req.params.id },
    include: {
      category: {
        include: { restaurant: true },
      },
    },
  });

  if (!item) {
    throw new AppError('Menu item not found', 404);
  }

  if (item.category.restaurant.ownerId !== req.user!.id && req.user!.role !== 'ADMIN') {
    throw new AppError('Access denied', 403);
  }

  await prisma.menuItem.delete({
    where: { id: req.params.id },
  });

  res.json({
    success: true,
    message: 'Menu item deleted successfully',
  });
}));

// Toggle favorite
router.post('/items/:id/favorite', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const item = await prisma.menuItem.findUnique({
    where: { id: req.params.id },
  });

  if (!item) {
    throw new AppError('Menu item not found', 404);
  }

  const existingFavorite = await prisma.favorite.findUnique({
    where: {
      userId_menuItemId: {
        userId: req.user!.id,
        menuItemId: req.params.id,
      },
    },
  });

  if (existingFavorite) {
    await prisma.favorite.delete({
      where: { id: existingFavorite.id },
    });

    res.json({
      success: true,
      data: { isFavorited: false },
    });
  } else {
    await prisma.favorite.create({
      data: {
        userId: req.user!.id,
        menuItemId: req.params.id,
      },
    });

    res.json({
      success: true,
      data: { isFavorited: true },
    });
  }
}));

export default router;
