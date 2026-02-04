import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  MoreVertical, 
  ChevronLeft,
  ChevronRight,
  Star,
  Check,
  X,
  DollarSign,
  Sparkles
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { adminApi } from '../../services/api';

const availableOptions = [
  { value: '', label: 'All Availability' },
  { value: 'true', label: 'Available' },
  { value: 'false', label: 'Unavailable' },
];

export default function MenuItemsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isAvailable, setIsAvailable] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'menu-items', { page, search, isAvailable }],
    queryFn: () => adminApi.listMenuItems({ page, limit: 20, search, isAvailable }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminApi.updateMenuItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'menu-items'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast.success('Menu item updated successfully');
      setOpenMenuId(null);
    },
    onError: () => {
      toast.error('Failed to update menu item');
    },
  });

  const menuItems = data?.data?.menuItems || [];
  const pagination = data?.data?.pagination;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Menu Item Management</h1>
        <p className="text-gray-500 mt-1">Manage menu items availability across the platform</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by item name..."
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
            value={isAvailable}
            onChange={(e) => {
              setIsAvailable(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {availableOptions.map((opt) => (
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Restaurant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {menuItems.map((item: any) => (
                  <tr key={item.id} className={clsx('hover:bg-gray-50', !item.isAvailable && 'bg-gray-50')}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&h=100&fit=crop'}
                          alt={item.name}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">{item.name}</p>
                            {item.isPopular && (
                              <Sparkles className="h-4 w-4 text-yellow-500" />
                            )}
                          </div>
                          {item.tags?.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {item.tags.slice(0, 2).map((tag: string) => (
                                <span key={tag} className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-900">{item.category?.restaurant?.name || 'Unknown'}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-600">{item.category?.name || 'Unknown'}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-gray-900">
                        <DollarSign className="h-4 w-4" />
                        {item.price?.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="font-medium">{item.avgRating?.toFixed(1) || 'N/A'}</span>
                        <span className="text-gray-400 text-sm">({item.totalReviews})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {item.isAvailable ? (
                          <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                            <Check className="h-4 w-4" />
                            Available
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-500 text-sm">
                            <X className="h-4 w-4" />
                            Unavailable
                          </span>
                        )}
                        {item.isPopular && (
                          <div>
                            <span className="inline-flex items-center gap-1 text-yellow-600 text-sm">
                              <Sparkles className="h-4 w-4" />
                              Popular
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                          <MoreVertical className="h-5 w-5 text-gray-400" />
                        </button>
                        {openMenuId === item.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                            <button
                              onClick={() => updateMutation.mutate({ id: item.id, data: { isAvailable: !item.isAvailable } })}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                              {item.isAvailable ? (
                                <>
                                  <X className="h-4 w-4" />
                                  Mark Unavailable
                                </>
                              ) : (
                                <>
                                  <Check className="h-4 w-4" />
                                  Mark Available
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => updateMutation.mutate({ id: item.id, data: { isPopular: !item.isPopular } })}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Sparkles className="h-4 w-4" />
                              {item.isPopular ? 'Remove Popular' : 'Mark as Popular'}
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
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} items
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
