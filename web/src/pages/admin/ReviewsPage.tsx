import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  MoreVertical, 
  Trash2,
  ChevronLeft,
  ChevronRight,
  Star,
  Flag,
  Eye,
  EyeOff,
  AlertTriangle
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { adminApi } from '../../services/api';

const flaggedOptions = [
  { value: '', label: 'All Reviews' },
  { value: 'true', label: 'Flagged Only' },
  { value: 'false', label: 'Not Flagged' },
];

const visibleOptions = [
  { value: '', label: 'All Visibility' },
  { value: 'true', label: 'Visible' },
  { value: 'false', label: 'Hidden' },
];

export default function ReviewsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [isFlagged, setIsFlagged] = useState('');
  const [isVisible, setIsVisible] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'reviews', { page, isFlagged, isVisible }],
    queryFn: () => adminApi.listReviews({ page, limit: 20, isFlagged, isVisible }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminApi.updateReview(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast.success('Review updated successfully');
      setOpenMenuId(null);
    },
    onError: () => {
      toast.error('Failed to update review');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast.success('Review deleted successfully');
      setOpenMenuId(null);
    },
    onError: () => {
      toast.error('Failed to delete review');
    },
  });

  const reviews = data?.data?.reviews || [];
  const pagination = data?.data?.pagination;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Review Moderation</h1>
        <p className="text-gray-500 mt-1">Moderate reviews, handle flags, and manage visibility</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="flex flex-wrap gap-4">
          <select
            value={isFlagged}
            onChange={(e) => {
              setIsFlagged(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {flaggedOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={isVisible}
            onChange={(e) => {
              setIsVisible(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {visibleOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No reviews found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {reviews.map((review: any) => (
              <div key={review.id} className={clsx('p-6', !review.isVisible && 'bg-gray-50')}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <img
                      src={review.user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.user?.name || 'U')}&background=dc2626&color=fff`}
                      alt={review.user?.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-medium text-gray-900">{review.user?.name}</span>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="font-medium">{review.rating}</span>
                        </div>
                        {review.isFlagged && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">
                            <Flag className="h-3 w-3" />
                            Flagged
                          </span>
                        )}
                        {!review.isVisible && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full text-xs">
                            <EyeOff className="h-3 w-3" />
                            Hidden
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        on <span className="font-medium">{review.menuItem?.name}</span>
                        {review.menuItem?.category?.restaurant && (
                          <> at <span className="font-medium">{review.menuItem.category.restaurant.name}</span></>
                        )}
                      </p>
                      {review.title && (
                        <p className="font-medium text-gray-900 mt-2">{review.title}</p>
                      )}
                      <p className={clsx('text-gray-600 mt-1', expandedReviewId !== review.id && 'line-clamp-2')}>
                        {review.content}
                      </p>
                      {review.content.length > 150 && (
                        <button
                          onClick={() => setExpandedReviewId(expandedReviewId === review.id ? null : review.id)}
                          className="text-primary-600 text-sm mt-1 hover:underline"
                        >
                          {expandedReviewId === review.id ? 'Show less' : 'Show more'}
                        </button>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(review.createdAt).toLocaleString()} • {review.helpfulCount} helpful votes
                      </p>
                    </div>
                  </div>
                  <div className="relative ml-4">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === review.id ? null : review.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <MoreVertical className="h-5 w-5 text-gray-400" />
                    </button>
                    {openMenuId === review.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                        <button
                          onClick={() => updateMutation.mutate({ id: review.id, data: { isVisible: !review.isVisible } })}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          {review.isVisible ? (
                            <>
                              <EyeOff className="h-4 w-4" />
                              Hide Review
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4" />
                              Show Review
                            </>
                          )}
                        </button>
                        {review.isFlagged && (
                          <button
                            onClick={() => updateMutation.mutate({ id: review.id, data: { isFlagged: false } })}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Flag className="h-4 w-4" />
                            Remove Flag
                          </button>
                        )}
                        <div className="border-t border-gray-100 my-1" />
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this review?')) {
                              deleteMutation.mutate(review.id);
                            }
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete Review
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} reviews
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === pagination.totalPages}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
