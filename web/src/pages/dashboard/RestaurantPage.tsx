import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { restaurantApi, menuApi, reviewApi } from '../../services/api';
import StarRating from '../../components/StarRating';
import { ChevronLeft, Plus, Pencil, Trash2, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

interface CategoryFormData {
  name: string;
  description: string;
}

interface MenuItemFormData {
  name: string;
  description: string;
  price: number;
  tags: string;
  isPopular: boolean;
}

export default function DashboardRestaurantPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showItemForm, setShowItemForm] = useState<string | null>(null);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [response, setResponse] = useState('');

  const categoryForm = useForm<CategoryFormData>();
  const itemForm = useForm<MenuItemFormData>();

  // Fetch restaurant data
  const { data: restaurantData, isLoading: restaurantLoading } = useQuery({
    queryKey: ['restaurant', id],
    queryFn: () => restaurantApi.get(id!),
    enabled: !!id,
  });

  // Fetch analytics
  const { data: analyticsData } = useQuery({
    queryKey: ['restaurantAnalytics', id],
    queryFn: () => restaurantApi.getAnalytics(id!),
    enabled: !!id,
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: (data: CategoryFormData) => menuApi.createCategory({
      restaurantId: id!,
      ...data,
    }),
    onSuccess: () => {
      toast.success('Category added!');
      setShowCategoryForm(false);
      categoryForm.reset();
      queryClient.invalidateQueries({ queryKey: ['restaurant', id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to add category');
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: (categoryId: string) => menuApi.deleteCategory(categoryId),
    onSuccess: () => {
      toast.success('Category deleted');
      queryClient.invalidateQueries({ queryKey: ['restaurant', id] });
    },
  });

  // Create menu item mutation
  const createItemMutation = useMutation({
    mutationFn: ({ categoryId, data }: { categoryId: string; data: MenuItemFormData }) => 
      menuApi.createItem({
        categoryId,
        name: data.name,
        description: data.description,
        price: Number(data.price),
        tags: data.tags ? data.tags.split(',').map(s => s.trim()) : [],
        isPopular: data.isPopular,
      }),
    onSuccess: () => {
      toast.success('Menu item added!');
      setShowItemForm(null);
      itemForm.reset();
      queryClient.invalidateQueries({ queryKey: ['restaurant', id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to add item');
    },
  });

  // Delete menu item mutation
  const deleteItemMutation = useMutation({
    mutationFn: (itemId: string) => menuApi.deleteItem(itemId),
    onSuccess: () => {
      toast.success('Item deleted');
      queryClient.invalidateQueries({ queryKey: ['restaurant', id] });
    },
  });

  // Respond to review mutation
  const respondMutation = useMutation({
    mutationFn: ({ reviewId, response }: { reviewId: string; response: string }) =>
      reviewApi.respond(reviewId, response),
    onSuccess: () => {
      toast.success('Response posted!');
      setRespondingTo(null);
      setResponse('');
      queryClient.invalidateQueries({ queryKey: ['restaurantAnalytics', id] });
    },
  });

  const restaurant = restaurantData?.data?.data;
  const analytics = analyticsData?.data?.data;

  if (restaurantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Restaurant not found</h2>
          <Link to="/dashboard" className="text-primary-600 hover:text-primary-700">
            Go back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/dashboard" 
            className="flex items-center text-gray-500 hover:text-gray-700 mb-4"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{restaurant.name}</h1>
          <p className="text-gray-500">{restaurant.city}, {restaurant.state}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content - Menu management */}
          <div className="lg:col-span-2 space-y-6">
            {/* Add category button */}
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Menu Categories</h2>
              <button
                onClick={() => setShowCategoryForm(!showCategoryForm)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Plus className="w-4 h-4" />
                Add Category
              </button>
            </div>

            {/* Add category form */}
            {showCategoryForm && (
              <form 
                onSubmit={categoryForm.handleSubmit((data) => createCategoryMutation.mutate(data))}
                className="bg-white rounded-lg shadow-sm p-4"
              >
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Category name (e.g., Appetizers)"
                    {...categoryForm.register('name', { required: true })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    {...categoryForm.register('description')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={createCategoryMutation.isPending}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      Add Category
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCategoryForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Categories and items */}
            {restaurant.categories && restaurant.categories.length > 0 ? (
              <div className="space-y-6">
                {restaurant.categories.map((category: any) => (
                  <div key={category.id} className="bg-white rounded-lg shadow-sm">
                    <div className="p-4 border-b flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{category.name}</h3>
                        {category.description && (
                          <p className="text-sm text-gray-500">{category.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowItemForm(showItemForm === category.id ? null : category.id)}
                          className="p-2 text-gray-500 hover:text-primary-600"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Delete this category and all its items?')) {
                              deleteCategoryMutation.mutate(category.id);
                            }
                          }}
                          className="p-2 text-gray-500 hover:text-red-600"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Add item form */}
                    {showItemForm === category.id && (
                      <form 
                        onSubmit={itemForm.handleSubmit((data) => 
                          createItemMutation.mutate({ categoryId: category.id, data })
                        )}
                        className="p-4 bg-gray-50 border-b"
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <input
                            type="text"
                            placeholder="Item name"
                            {...itemForm.register('name', { required: true })}
                            className="px-3 py-2 border border-gray-300 rounded-lg"
                          />
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Price"
                            {...itemForm.register('price', { required: true })}
                            className="px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Description"
                          {...itemForm.register('description')}
                          className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                        <input
                          type="text"
                          placeholder="Tags (comma separated)"
                          {...itemForm.register('tags')}
                          className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                        <div className="mt-2 flex items-center gap-4">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              {...itemForm.register('isPopular')}
                            />
                            <span className="text-sm text-gray-600">Popular item</span>
                          </label>
                          <div className="flex-1" />
                          <button
                            type="submit"
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm"
                          >
                            Add Item
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowItemForm(null)}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Items list */}
                    <div className="divide-y">
                      {category.items && category.items.length > 0 ? (
                        category.items.map((item: any) => (
                          <div key={item.id} className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                {item.imageUrl ? (
                                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                    No img
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-gray-900">{item.name}</h4>
                                  {item.isPopular && (
                                    <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                                      Popular
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500">${item.price.toFixed(2)}</p>
                                {item.avgRating && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <StarRating rating={item.avgRating} size="sm" />
                                    <span className="text-xs text-gray-500">
                                      ({item.totalReviews})
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                if (confirm('Delete this menu item?')) {
                                  deleteItemMutation.mutate(item.id);
                                }
                              }}
                              className="p-2 text-gray-400 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          No items in this category
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <p className="text-gray-500">No menu categories yet. Add your first category to get started.</p>
              </div>
            )}
          </div>

          {/* Sidebar - Analytics and recent reviews */}
          <div className="space-y-6">
            {/* Overview stats */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Overview</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Rating</span>
                  <span className="font-medium">
                    {analytics?.overview?.avgRating?.toFixed(1) || '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Reviews</span>
                  <span className="font-medium">
                    {analytics?.overview?.totalReviews || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Menu Items</span>
                  <span className="font-medium">
                    {analytics?.overview?.totalMenuItems || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Top items */}
            {analytics?.topItems && analytics.topItems.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Top Rated Items</h3>
                <div className="space-y-3">
                  {analytics.topItems.map((item: any, i: number) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <span className="text-gray-700 truncate flex-1">
                        {i + 1}. {item.name}
                      </span>
                      <div className="flex items-center gap-1 ml-2">
                        <StarRating rating={item.avgRating} size="sm" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent reviews */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Recent Reviews</h3>
              {analytics?.recentReviews && analytics.recentReviews.length > 0 ? (
                <div className="space-y-4">
                  {analytics.recentReviews.map((review: any) => (
                    <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          {review.user?.name}
                        </span>
                        <StarRating rating={review.rating} size="sm" />
                      </div>
                      <p className="text-sm text-gray-500 mb-1">
                        on {review.menuItem?.name}
                      </p>
                      <p className="text-sm text-gray-600 line-clamp-2">{review.content}</p>
                      
                      {/* Response section */}
                      {review.ownerResponse ? (
                        <div className="mt-2 pl-3 border-l-2 border-primary-200">
                          <p className="text-xs text-primary-600 font-medium">Your response:</p>
                          <p className="text-sm text-gray-600">{review.ownerResponse}</p>
                        </div>
                      ) : (
                        <div className="mt-2">
                          {respondingTo === review.id ? (
                            <div className="space-y-2">
                              <textarea
                                value={response}
                                onChange={(e) => setResponse(e.target.value)}
                                placeholder="Write your response..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                rows={2}
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => respondMutation.mutate({ 
                                    reviewId: review.id, 
                                    response 
                                  })}
                                  disabled={!response.trim()}
                                  className="px-3 py-1 bg-primary-600 text-white text-sm rounded-lg"
                                >
                                  Post
                                </button>
                                <button
                                  onClick={() => {
                                    setRespondingTo(null);
                                    setResponse('');
                                  }}
                                  className="px-3 py-1 border border-gray-300 text-sm rounded-lg"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setRespondingTo(review.id)}
                              className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
                            >
                              <MessageSquare className="w-4 h-4" />
                              Respond
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No reviews yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
