import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// All admin routes require authentication and ADMIN role
router.use(authenticate, requireRole('ADMIN'));

// ==================== DASHBOARD STATS ====================

router.get('/stats', async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalRestaurants,
      verifiedRestaurants,
      activeRestaurants,
      totalMenuItems,
      availableMenuItems,
      totalReviews,
      flaggedReviews,
      hiddenReviews,
      recentUsers,
      recentRestaurants,
      recentReviews,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.restaurant.count(),
      prisma.restaurant.count({ where: { isVerified: true } }),
      prisma.restaurant.count({ where: { isActive: true } }),
      prisma.menuItem.count(),
      prisma.menuItem.count({ where: { isAvailable: true } }),
      prisma.review.count(),
      prisma.review.count({ where: { isFlagged: true } }),
      prisma.review.count({ where: { isVisible: false } }),
      // Recent activity (last 7 days)
      prisma.user.count({
        where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      }),
      prisma.restaurant.count({
        where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      }),
      prisma.review.count({
        where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      }),
    ]);

    // Get user role breakdown
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: { role: true },
    });

    // Get cuisine type breakdown
    const restaurants = await prisma.restaurant.findMany({
      select: { cuisineType: true },
    });
    const cuisineCounts: Record<string, number> = {};
    restaurants.forEach((r) => {
      r.cuisineType.forEach((cuisine) => {
        cuisineCounts[cuisine] = (cuisineCounts[cuisine] || 0) + 1;
      });
    });

    res.json({
      users: {
        total: totalUsers,
        recentWeek: recentUsers,
        byRole: usersByRole.reduce((acc, item) => {
          acc[item.role] = item._count.role;
          return acc;
        }, {} as Record<string, number>),
      },
      restaurants: {
        total: totalRestaurants,
        verified: verifiedRestaurants,
        active: activeRestaurants,
        recentWeek: recentRestaurants,
        byCuisine: cuisineCounts,
      },
      menuItems: {
        total: totalMenuItems,
        available: availableMenuItems,
      },
      reviews: {
        total: totalReviews,
        flagged: flaggedReviews,
        hidden: hiddenReviews,
        recentWeek: recentReviews,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ==================== USER MANAGEMENT ====================

router.get('/users', async (req, res, next) => {
  try {
    const {
      page = '1',
      limit = '20',
      search = '',
      role,
      isVerified,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (isVerified !== undefined) {
      where.isVerified = isVerified === 'true';
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy as string]: sortOrder },
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          role: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              reviews: true,
              restaurants: true,
              favorites: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        role: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            menuItem: {
              select: { name: true },
            },
          },
        },
        restaurants: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            reviews: true,
            restaurants: true,
            favorites: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

router.patch('/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, isVerified, name } = req.body;

    const updateData: any = {};
    if (role !== undefined) updateData.role = role;
    if (isVerified !== undefined) updateData.isVerified = isVerified;
    if (name !== undefined) updateData.name = name;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        updatedAt: true,
      },
    });

    res.json(user);
  } catch (error) {
    next(error);
  }
});

router.delete('/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Don't allow deleting yourself
    if (id === req.user!.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await prisma.user.delete({ where: { id } });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ==================== RESTAURANT MANAGEMENT ====================

router.get('/restaurants', async (req, res, next) => {
  try {
    const {
      page = '1',
      limit = '20',
      search = '',
      isVerified,
      isActive,
      cuisineType,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { city: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (isVerified !== undefined) {
      where.isVerified = isVerified === 'true';
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (cuisineType) {
      where.cuisineType = { has: cuisineType as string };
    }

    const [restaurants, total] = await Promise.all([
      prisma.restaurant.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy as string]: sortOrder },
        select: {
          id: true,
          name: true,
          imageUrl: true,
          city: true,
          state: true,
          cuisineType: true,
          priceRange: true,
          avgRating: true,
          totalReviews: true,
          isVerified: true,
          isActive: true,
          createdAt: true,
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              categories: true,
            },
          },
        },
      }),
      prisma.restaurant.count({ where }),
    ]);

    res.json({
      restaurants,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/restaurants/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isVerified, isActive } = req.body;

    const updateData: any = {};
    if (isVerified !== undefined) updateData.isVerified = isVerified;
    if (isActive !== undefined) updateData.isActive = isActive;

    const restaurant = await prisma.restaurant.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        isVerified: true,
        isActive: true,
        updatedAt: true,
      },
    });

    res.json(restaurant);
  } catch (error) {
    next(error);
  }
});

router.delete('/restaurants/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.restaurant.delete({ where: { id } });

    res.json({ message: 'Restaurant deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ==================== REVIEW MANAGEMENT ====================

router.get('/reviews', async (req, res, next) => {
  try {
    const {
      page = '1',
      limit = '20',
      isFlagged,
      isVisible,
      minRating,
      maxRating,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (isFlagged !== undefined) {
      where.isFlagged = isFlagged === 'true';
    }

    if (isVisible !== undefined) {
      where.isVisible = isVisible === 'true';
    }

    if (minRating) {
      where.rating = { ...where.rating, gte: parseFloat(minRating as string) };
    }

    if (maxRating) {
      where.rating = { ...where.rating, lte: parseFloat(maxRating as string) };
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy as string]: sortOrder },
        select: {
          id: true,
          rating: true,
          title: true,
          content: true,
          isFlagged: true,
          isVisible: true,
          helpfulCount: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
          menuItem: {
            select: {
              id: true,
              name: true,
              category: {
                select: {
                  restaurant: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.review.count({ where }),
    ]);

    res.json({
      reviews,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/reviews/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isVisible, isFlagged } = req.body;

    const updateData: any = {};
    if (isVisible !== undefined) updateData.isVisible = isVisible;
    if (isFlagged !== undefined) updateData.isFlagged = isFlagged;

    const review = await prisma.review.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        isVisible: true,
        isFlagged: true,
        updatedAt: true,
      },
    });

    res.json(review);
  } catch (error) {
    next(error);
  }
});

router.delete('/reviews/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.review.delete({ where: { id } });

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ==================== MENU ITEM MANAGEMENT ====================

router.get('/menu-items', async (req, res, next) => {
  try {
    const {
      page = '1',
      limit = '20',
      search = '',
      isAvailable,
      restaurantId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (search) {
      where.name = { contains: search as string, mode: 'insensitive' };
    }

    if (isAvailable !== undefined) {
      where.isAvailable = isAvailable === 'true';
    }

    if (restaurantId) {
      where.category = { restaurantId: restaurantId as string };
    }

    const [menuItems, total] = await Promise.all([
      prisma.menuItem.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy as string]: sortOrder },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          imageUrl: true,
          isAvailable: true,
          isPopular: true,
          avgRating: true,
          totalReviews: true,
          tags: true,
          createdAt: true,
          category: {
            select: {
              id: true,
              name: true,
              restaurant: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.menuItem.count({ where }),
    ]);

    res.json({
      menuItems,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/menu-items/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isAvailable, isPopular } = req.body;

    const updateData: any = {};
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;
    if (isPopular !== undefined) updateData.isPopular = isPopular;

    const menuItem = await prisma.menuItem.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        isAvailable: true,
        isPopular: true,
        updatedAt: true,
      },
    });

    res.json(menuItem);
  } catch (error) {
    next(error);
  }
});

export default router;
