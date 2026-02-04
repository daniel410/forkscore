import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  MoreVertical, 
  Check,
  X,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Star,
  MapPin,
  BadgeCheck,
  Power
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { adminApi } from '../../services/api';

const verifiedOptions = [
  { value: '', label: 'All Verification' },
  { value: 'true', label: 'Verified' },
  { value: 'false', label: 'Not Verified' },
];

const activeOptions = [
  { value: '', label: 'All Status' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

export default function RestaurantsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isVerified, setIsVerified] = useState('');
  const [isActive, setIsActive] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'restaurants', { page, search, isVerified, isActive }],
    queryFn: () => adminApi.listRestaurants({ page, limit: 20, search, isVerified, isActive }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminApi.updateRestaurant(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'restaurants'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast.success('Restaurant updated successfully');
      setOpenMenuId(null);
    },
    onError: () => {
      toast.error('Failed to update restaurant');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteRestaurant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'restaurants'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast.success('Restaurant deleted successfully');
      setOpenMenuId(null);
    },
    onError: () => {
      toast.error('Failed to delete restaurant');
    },
  });

  const restaurants = data?.data?.restaurants || [];
  const pagination = data?.data?.pagination;

  const getPriceLabel = (price: number) => '$'.repeat(price);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Restaurant Management</h1>
        <p className="text-gray-500 mt-1">Manage restaurants, verification, and status</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or city..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={isVerified}
            onChange={(e) => {
              setIsVerified(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {verifiedOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={isActive}
            onChange={(e) => {
              setIsActive(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {activeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Restaurant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cuisine</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {restaurants.map((restaurant: any) => (
                  <tr key={restaurant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <img
                          src={restaurant.imageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100&h=100&fit=crop'}
                          alt={restaurant.name}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{restaurant.name}</p>
                          <p className="text-sm text-gray-500">{getPriceLabel(restaurant.priceRange)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        {restaurant.city}, {restaurant.state}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {restaurant.cuisineType?.slice(0, 2).map((cuisine: string) => (
                          <span key={cuisine} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                            {cuisine}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="font-medium">{restaurant.avgRating?.toFixed(1) || 'N/A'}</span>
                        <span className="text-gray-400 text-sm">({restaurant.totalReviews})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {restaurant.isVerified ? (
                          <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                            <BadgeCheck className="h-4 w-4" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-gray-400 text-sm">
                            <X className="h-4 w-4" />
                            Unverified
                          </span>
                        )}
                        <div>
                          {restaurant.isActive ? (
                            <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                              <Power className="h-4 w-4" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-500 text-sm">
                              <Power className="h-4 w-4" />
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {restaurant.owner ? (
                        <div>
                          <p className="text-gray-900">{restaurant.owner.name}</p>
                          <p className="text-gray-500 text-xs">{restaurant.owner.email}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400">No owner</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === restaurant.id ? null : restaurant.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                          <MoreVertical className="h-5 w-5 text-gray-400" />
                        </button>
                        {openMenuId === restaurant.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                            <button
                              onClick={() => updateMutation.mutate({ id: restaurant.id, data: { isVerified: !restaurant.isVerified } })}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                              <BadgeCheck className="h-4 w-4" />
                              {restaurant.isVerified ? 'Remove Verification' : 'Verify Restaurant'}
                            </button>
                            <button
                              onClick={() => updateMutation.mutate({ id: restaurant.id, data: { isActive: !restaurant.isActive } })}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Power className="h-4 w-4" />
                              {restaurant.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <div className="border-t border-gray-100 my-1" />
                            <button
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this restaurant? This will also delete all menu items and reviews.')) {
                                  deleteMutation.mutate(restaurant.id);
                                }
                              }}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete Restaurant
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} restaurants
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
