import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { menuApi, reviewApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import StarRating from '../components/StarRating';
import { Heart, ThumbsUp, Flag, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';
import { Review } from '../types';

interface ReviewFormData {
  rating: number;
  tasteRating: number;
  qualityRating: number;
  valueRating: number;
  presentationRating: number;
  title: string;
  content: string;
}

export default function MenuItemPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const { socket, subscribeToMenuItem, unsubscribeFromMenuItem } = useSocket();
  const queryClient = useQueryClient();

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [ratings, setRatings] = useState({
    rating: 0,
    tasteRating: 0,
    qualityRating: 0,
    valueRating: 0,
    presentationRating: 0,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ReviewFormData>();

  // Subscribe to real-time updates
  useEffect(() => {
    if (id) {
      subscribeToMenuItem(id);
      
      socket?.on('newReview', (data) => {
        queryClient.invalidateQueries({ queryKey: ['menuItem', id] });
        queryClient.invalidateQueries({ queryKey: ['reviews', id] });
      });

      socket?.on('ratingUpdate', (data) => {
        queryClient.invalidateQueries({ queryKey: ['menuItem', id] });
      });
    }

    return () => {
      if (id) {
        unsubscribeFromMenuItem(id);
      }
    };
  }, [id, socket]);

  // Fetch menu item
  const { data: itemData, isLoading: itemLoading } = useQuery({
    queryKey: ['menuItem', id],
    queryFn: () => menuApi.getItem(id!),
    enabled: !!id,
  });

  // Fetch reviews
  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => reviewApi.listByMenuItem(id!),
    enabled: !!id,
  });

  // Toggle favorite mutation
  const favoriteMutation = useMutation({
    mutationFn: () => menuApi.toggleFavorite(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuItem', id] });
    },
  });

  // Create review mutation
  const createReviewMutation = useMutation({
    mutationFn: (data: ReviewFormData) => reviewApi.create({
      menuItemId: id!,
      ...data,
      ...ratings,
    }),
    onSuccess: () => {
      toast.success('Review submitted!');
      setShowReviewForm(false);
      reset();
      setRatings({
        rating: 0,
        tasteRating: 0,
        qualityRating: 0,
        valueRating: 0,
        presentationRating: 0,
      });
      queryClient.invalidateQueries({ queryKey: ['reviews', id] });
      queryClient.invalidateQueries({ queryKey: ['menuItem', id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to submit review');
    },
  });

  // Toggle helpful mutation
  const helpfulMutation = useMutation({
    mutationFn: (reviewId: string) => reviewApi.toggleHelpful(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', id] });
    },
  });

  const item = itemData?.data?.data;
  const reviews = reviewsData?.data?.data?.reviews || [];

  if (itemLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Menu item not found</h2>
          <Link to="/" className="text-primary-600 hover:text-primary-700">
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  const restaurant = item.category?.restaurant;

  const onSubmitReview = (data: ReviewFormData) => {
    if (ratings.rating === 0) {
      toast.error('Please select an overall rating');
      return;
    }
    createReviewMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-gray-700">Home</Link>
            <ChevronRight className="w-4 h-4" />
            {restaurant && (
              <>
                <Link to={`/restaurant/${restaurant.id}`} className="hover:text-gray-700">
                  {restaurant.name}
                </Link>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
            <span className="text-gray-900">{item.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Item details */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="aspect-video bg-gray-200">
                {item.imageUrl ? (
                  <img 
                    src={item.imageUrl} 
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No image
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{item.name}</h1>
                    {restaurant && (
                      <Link 
                        to={`/restaurant/${restaurant.id}`}
                        className="text-gray-500 hover:text-primary-600"
                      >
                        at {restaurant.name}
                      </Link>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    ${item.price.toFixed(2)}
                  </div>
                </div>

                <p className="text-gray-600 mt-4">{item.description}</p>

                {/* Tags */}
                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {item.tags.map(tag => (
                      <span 
                        key={tag}
                        className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Favorite button */}
                {isAuthenticated && (
                  <button
                    onClick={() => favoriteMutation.mutate()}
                    disabled={favoriteMutation.isPending}
                    className={clsx(
                      'mt-4 flex items-center gap-2 px-4 py-2 rounded-lg border',
                      item.isFavorited 
                        ? 'border-primary-500 text-primary-600 bg-primary-50'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    <Heart className={clsx('w-5 h-5', item.isFavorited && 'fill-current')} />
                    {item.isFavorited ? 'Saved' : 'Save'}
                  </button>
                )}
              </div>
            </div>

            {/* Reviews section */}
            <div className="bg-white rounded-lg shadow-sm mt-6 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Reviews</h2>
                {isAuthenticated && !showReviewForm && (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Write a Review
                  </button>
                )}
              </div>

              {/* Review form */}
              {showReviewForm && (
                <form onSubmit={handleSubmit(onSubmitReview)} className="mb-8 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-4">Your Review</h3>
                  
                  {/* Ratings */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Overall Rating *</span>
                      <StarRating 
                        rating={ratings.rating}
                        interactive
                        onChange={(r) => setRatings(prev => ({ ...prev, rating: r }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-sm">Taste</span>
                      <StarRating 
                        rating={ratings.tasteRating}
                        size="sm"
                        interactive
                        onChange={(r) => setRatings(prev => ({ ...prev, tasteRating: r }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-sm">Quality</span>
                      <StarRating 
                        rating={ratings.qualityRating}
                        size="sm"
                        interactive
                        onChange={(r) => setRatings(prev => ({ ...prev, qualityRating: r }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-sm">Value</span>
                      <StarRating 
                        rating={ratings.valueRating}
                        size="sm"
                        interactive
                        onChange={(r) => setRatings(prev => ({ ...prev, valueRating: r }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-sm">Presentation</span>
                      <StarRating 
                        rating={ratings.presentationRating}
                        size="sm"
                        interactive
                        onChange={(r) => setRatings(prev => ({ ...prev, presentationRating: r }))}
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="Review title (optional)"
                      {...register('title')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div className="mb-4">
                    <textarea
                      placeholder="Write your review..."
                      rows={4}
                      {...register('content', { 
                        required: 'Review content is required',
                        minLength: { value: 10, message: 'Review must be at least 10 characters' },
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                    {errors.content && (
                      <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={createReviewMutation.isPending}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                    >
                      {createReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowReviewForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Reviews list */}
              {reviewsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((review: Review) => (
                    <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            {review.user?.avatarUrl ? (
                              <img 
                                src={review.user.avatarUrl} 
                                alt={review.user.name}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-gray-500 font-medium">
                                {review.user?.name?.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{review.user?.name}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <StarRating rating={review.rating} size="sm" />
                      </div>

                      {review.title && (
                        <h4 className="font-medium text-gray-900 mt-3">{review.title}</h4>
                      )}
                      <p className="text-gray-600 mt-2">{review.content}</p>

                      {/* Detailed ratings */}
                      <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                        {review.tasteRating && (
                          <span>Taste: {review.tasteRating}/5</span>
                        )}
                        {review.qualityRating && (
                          <span>Quality: {review.qualityRating}/5</span>
                        )}
                        {review.valueRating && (
                          <span>Value: {review.valueRating}/5</span>
                        )}
                        {review.presentationRating && (
                          <span>Presentation: {review.presentationRating}/5</span>
                        )}
                      </div>

                      {/* Owner response */}
                      {review.ownerResponse && (
                        <div className="mt-3 pl-4 border-l-2 border-primary-200 bg-primary-50 p-3 rounded-r-lg">
                          <p className="text-sm font-medium text-primary-700">Owner Response</p>
                          <p className="text-sm text-gray-600 mt-1">{review.ownerResponse}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-4 mt-3">
                        <button
                          onClick={() => helpfulMutation.mutate(review.id)}
                          disabled={!isAuthenticated || review.user?.id === user?.id}
                          className={clsx(
                            'flex items-center gap-1 text-sm',
                            review.hasVotedHelpful 
                              ? 'text-primary-600' 
                              : 'text-gray-500 hover:text-gray-700',
                            (!isAuthenticated || review.user?.id === user?.id) && 'opacity-50 cursor-not-allowed'
                          )}
                        >
                          <ThumbsUp className="w-4 h-4" />
                          Helpful ({review.helpfulCount})
                        </button>
                        {isAuthenticated && review.user?.id !== user?.id && (
                          <button
                            onClick={() => {
                              reviewApi.flag(review.id);
                              toast.success('Review flagged for moderation');
                            }}
                            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                          >
                            <Flag className="w-4 h-4" />
                            Report
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No reviews yet. Be the first to review this dish!
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Ratings breakdown */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Rating Summary</h3>
              
              {item.avgRating ? (
                <>
                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold text-gray-900">
                      {item.avgRating.toFixed(1)}
                    </div>
                    <StarRating rating={item.avgRating} size="lg" />
                    <p className="text-gray-500 mt-1">
                      {item.totalReviews} {item.totalReviews === 1 ? 'review' : 'reviews'}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {item.avgTasteRating && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Taste</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary-500 rounded-full"
                              style={{ width: `${(item.avgTasteRating / 5) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-900 w-8">
                            {item.avgTasteRating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    )}
                    {item.avgQualityRating && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Quality</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary-500 rounded-full"
                              style={{ width: `${(item.avgQualityRating / 5) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-900 w-8">
                            {item.avgQualityRating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    )}
                    {item.avgValueRating && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Value</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary-500 rounded-full"
                              style={{ width: `${(item.avgValueRating / 5) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-900 w-8">
                            {item.avgValueRating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    )}
                    {item.avgPresentationRating && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Presentation</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary-500 rounded-full"
                              style={{ width: `${(item.avgPresentationRating / 5) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-900 w-8">
                            {item.avgPresentationRating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No ratings yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
