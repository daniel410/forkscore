import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth.js';
import { Server } from 'socket.io';

const router = Router();

// Validation schemas
const createReviewSchema = z.object({
  menuItemId: z.string(),
  rating: z.number().min(1).max(5),
  tasteRating: z.number().min(1).max(5).optional(),
  qualityRating: z.number().min(1).max(5).optional(),
  valueRating: z.number().min(1).max(5).optional(),
  presentationRating: z.number().min(1).max(5).optional(),
  title: z.string().max(200).optional(),
  content: z.string().min(10).max(5000),
  photoUrls: z.array(z.string().url()).max(5).optional(),
});

const updateReviewSchema = createReviewSchema.omit({ menuItemId: true }).partial();

// Helper function to update menu item ratings
async function updateMenuItemRatings(menuItemId: string) {
  const reviews = await prisma.review.findMany({
    where: { menuItemId, isVisible: true },
    select: {
      rating: true,
      tasteRating: true,
      qualityRating: true,
      valueRating: true,
      presentationRating: true,
    },
  });

  if (reviews.length === 0) {
    await prisma.menuItem.update({
      where: { id: menuItemId },
      data: {
        avgRating: null,
        avgTasteRating: null,
        avgQualityRating: null,
        avgValueRating: null,
        avgPresentationRating: null,
        totalReviews: 0,
      },
    });
    return;
  }

  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  
  const tasteRatings = reviews.filter(r => r.tasteRating).map(r => r.tasteRating!);
  const avgTasteRating = tasteRatings.length > 0 
    ? tasteRatings.reduce((a, b) => a + b, 0) / tasteRatings.length 
    : null;

  const qualityRatings = reviews.filter(r => r.qualityRating).map(r => r.qualityRating!);
  const avgQualityRating = qualityRatings.length > 0 
    ? qualityRatings.reduce((a, b) => a + b, 0) / qualityRatings.length 
    : null;

  const valueRatings = reviews.filter(r => r.valueRating).map(r => r.valueRating!);
  const avgValueRating = valueRatings.length > 0 
    ? valueRatings.reduce((a, b) => a + b, 0) / valueRatings.length 
    : null;

  const presentationRatings = reviews.filter(r => r.presentationRating).map(r => r.presentationRating!);
  const avgPresentationRating = presentationRatings.length > 0 
    ? presentationRatings.reduce((a, b) => a + b, 0) / presentationRatings.length 
    : null;

  await prisma.menuItem.update({
    where: { id: menuItemId },
    data: {
      avgRating: Math.round(avgRating * 10) / 10,
      avgTasteRating: avgTasteRating ? Math.round(avgTasteRating * 10) / 10 : null,
      avgQualityRating: avgQualityRating ? Math.round(avgQualityRating * 10) / 10 : null,
      avgValueRating: avgValueRating ? Math.round(avgValueRating * 10) / 10 : null,
      avgPresentationRating: avgPresentationRating ? Math.round(avgPresentationRating * 10) / 10 : null,
      totalReviews: reviews.length,
    },
  });

  // Also update restaurant ratings
  const menuItem = await prisma.menuItem.findUnique({
    where: { id: menuItemId },
    include: {
      category: {
        include: { restaurant: true },
      },
    },
  });

  if (menuItem) {
    const restaurantItems = await prisma.menuItem.findMany({
      where: {
        category: { restaurantId: menuItem.category.restaurantId },
        avgRating: { not: null },
      },
      select: { avgRating: true, totalReviews: true },
    });

    if (restaurantItems.length > 0) {
      const restaurantAvgRating = restaurantItems.reduce((sum, i) => sum + (i.avgRating ?? 0), 0) / restaurantItems.length;
      const restaurantTotalReviews = restaurantItems.reduce((sum, i) => sum + i.totalReviews, 0);

      await prisma.restaurant.update({
        where: { id: menuItem.category.restaurantId },
        data: {
          avgRating: Math.round(restaurantAvgRating * 10) / 10,
          totalReviews: restaurantTotalReviews,
        },
      });
    }
  }
}

// Get reviews for a menu item
router.get('/item/:menuItemId', optionalAuth, asyncHandler(async (req: AuthRequest, res) => {
  const { page = '1', limit = '20', sortBy = 'helpful' } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = Math.min(parseInt(limit as string), 50);
  const skip = (pageNum - 1) * limitNum;

  const orderBy: any = sortBy === 'helpful' 
    ? { helpfulCount: 'desc' }
    : sortBy === 'newest'
    ? { createdAt: 'desc' }
    : sortBy === 'rating'
    ? { rating: 'desc' }
    : { helpfulCount: 'desc' };

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { 
        menuItemId: req.params.menuItemId,
        isVisible: true,
      },
      orderBy,
      skip,
      take: limitNum,
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true },
        },
        photos: true,
        helpfulVotes: req.user 
          ? { where: { userId: req.user.id }, select: { id: true } }
          : false,
      },
    }),
    prisma.review.count({ 
      where: { menuItemId: req.params.menuItemId, isVisible: true } 
    }),
  ]);

  const reviewsWithUserVote = reviews.map(review => ({
    ...review,
    hasVotedHelpful: req.user ? review.helpfulVotes && review.helpfulVotes.length > 0 : false,
  }));

  res.json({
    success: true,
    data: {
      reviews: reviewsWithUserVote,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    },
  });
}));

// Create review
router.post('/', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const data = createReviewSchema.parse(req.body);

  // Check if menu item exists
  const menuItem = await prisma.menuItem.findUnique({
    where: { id: data.menuItemId },
    include: {
      category: {
        include: { restaurant: true },
      },
    },
  });

  if (!menuItem) {
    throw new AppError('Menu item not found', 404);
  }

  // Check if user already reviewed this item
  const existingReview = await prisma.review.findUnique({
    where: {
      userId_menuItemId: {
        userId: req.user!.id,
        menuItemId: data.menuItemId,
      },
    },
  });

  if (existingReview) {
    throw new AppError('You have already reviewed this item', 400);
  }

  const { photoUrls, ...reviewData } = data;

  // Create review with photos
  const review = await prisma.review.create({
    data: {
      ...reviewData,
      userId: req.user!.id,
      photos: photoUrls ? {
        create: photoUrls.map((url, index) => ({
          url,
          sortOrder: index,
        })),
      } : undefined,
    },
    include: {
      user: {
        select: { id: true, name: true, avatarUrl: true },
      },
      photos: true,
    },
  });

  // Update menu item ratings
  await updateMenuItemRatings(data.menuItemId);

  // Emit real-time event
  const io = req.app.get('io') as Server;
  io.to(`menuItem:${data.menuItemId}`).emit('newReview', {
    review,
    menuItemId: data.menuItemId,
    restaurantId: menuItem.category.restaurantId,
  });

  res.status(201).json({
    success: true,
    data: review,
  });
}));

// Update review
router.patch('/:id', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const review = await prisma.review.findUnique({
    where: { id: req.params.id },
  });

  if (!review) {
    throw new AppError('Review not found', 404);
  }

  if (review.userId !== req.user!.id) {
    throw new AppError('Access denied', 403);
  }

  const data = updateReviewSchema.parse(req.body);
  const { photoUrls, ...updateData } = data;

  // Update review
  const updated = await prisma.review.update({
    where: { id: req.params.id },
    data: updateData,
    include: {
      user: {
        select: { id: true, name: true, avatarUrl: true },
      },
      photos: true,
    },
  });

  // Update ratings
  await updateMenuItemRatings(review.menuItemId);

  res.json({
    success: true,
    data: updated,
  });
}));

// Delete review
router.delete('/:id', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const review = await prisma.review.findUnique({
    where: { id: req.params.id },
  });

  if (!review) {
    throw new AppError('Review not found', 404);
  }

  if (review.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
    throw new AppError('Access denied', 403);
  }

  const menuItemId = review.menuItemId;

  await prisma.review.delete({
    where: { id: req.params.id },
  });

  // Update ratings
  await updateMenuItemRatings(menuItemId);

  res.json({
    success: true,
    message: 'Review deleted successfully',
  });
}));

// Vote helpful
router.post('/:id/helpful', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const review = await prisma.review.findUnique({
    where: { id: req.params.id },
  });

  if (!review) {
    throw new AppError('Review not found', 404);
  }

  if (review.userId === req.user!.id) {
    throw new AppError('Cannot vote on your own review', 400);
  }

  const existingVote = await prisma.helpfulVote.findUnique({
    where: {
      userId_reviewId: {
        userId: req.user!.id,
        reviewId: req.params.id,
      },
    },
  });

  if (existingVote) {
    // Remove vote
    await prisma.helpfulVote.delete({
      where: { id: existingVote.id },
    });

    await prisma.review.update({
      where: { id: req.params.id },
      data: { helpfulCount: { decrement: 1 } },
    });

    res.json({
      success: true,
      data: { voted: false },
    });
  } else {
    // Add vote
    await prisma.helpfulVote.create({
      data: {
        userId: req.user!.id,
        reviewId: req.params.id,
      },
    });

    await prisma.review.update({
      where: { id: req.params.id },
      data: { helpfulCount: { increment: 1 } },
    });

    res.json({
      success: true,
      data: { voted: true },
    });
  }
}));

// Restaurant owner respond to review
router.post('/:id/respond', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const { response } = req.body;

  if (!response || typeof response !== 'string') {
    throw new AppError('Response is required', 400);
  }

  const review = await prisma.review.findUnique({
    where: { id: req.params.id },
    include: {
      menuItem: {
        include: {
          category: {
            include: { restaurant: true },
          },
        },
      },
    },
  });

  if (!review) {
    throw new AppError('Review not found', 404);
  }

  const restaurant = review.menuItem.category.restaurant;

  if (restaurant.ownerId !== req.user!.id && req.user!.role !== 'ADMIN') {
    throw new AppError('Access denied', 403);
  }

  const updated = await prisma.review.update({
    where: { id: req.params.id },
    data: {
      ownerResponse: response,
      ownerResponseAt: new Date(),
    },
  });

  res.json({
    success: true,
    data: updated,
  });
}));

// Flag review (for moderation)
router.post('/:id/flag', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const review = await prisma.review.findUnique({
    where: { id: req.params.id },
  });

  if (!review) {
    throw new AppError('Review not found', 404);
  }

  await prisma.review.update({
    where: { id: req.params.id },
    data: { isFlagged: true },
  });

  res.json({
    success: true,
    message: 'Review flagged for moderation',
  });
}));

export default router;
