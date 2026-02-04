import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { restaurantApi, menuApi } from '../services/api';
import MenuItemCard from '../components/MenuItemCard';
import RestaurantCard from '../components/RestaurantCard';
import { Search, Filter, X } from 'lucide-react';
import { clsx } from 'clsx';

type SearchType = 'dishes' | 'restaurants';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchType, setSearchType] = useState<SearchType>(
    (searchParams.get('type') as SearchType) || 'dishes'
  );
  const [showFilters, setShowFilters] = useState(false);

  const query = searchParams.get('q') || '';
  const cuisine = searchParams.get('cuisine') || '';
  const minRating = searchParams.get('minRating') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const sortBy = searchParams.get('sortBy') || 'rating';
  const page = parseInt(searchParams.get('page') || '1');

  // Search dishes
  const { data: dishesData, isLoading: dishesLoading } = useQuery({
    queryKey: ['searchDishes', query, minRating, maxPrice, sortBy, page],
    queryFn: () => menuApi.listItems({
      search: query || undefined,
      minRating: minRating ? parseFloat(minRating) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      sortBy,
      page,
      limit: 20,
    }),
    enabled: searchType === 'dishes',
  });

  // Search restaurants
  const { data: restaurantsData, isLoading: restaurantsLoading } = useQuery({
    queryKey: ['searchRestaurants', query, cuisine, minRating, sortBy, page],
    queryFn: () => restaurantApi.list({
      search: query || undefined,
      cuisine: cuisine || undefined,
      minRating: minRating ? parseFloat(minRating) : undefined,
      sortBy,
      page,
      limit: 20,
    }),
    enabled: searchType === 'restaurants',
  });

  const dishes = dishesData?.data?.data?.items || [];
  const restaurants = restaurantsData?.data?.data?.restaurants || [];
  const pagination = searchType === 'dishes' 
    ? dishesData?.data?.data?.pagination 
    : restaurantsData?.data?.data?.pagination;

  const isLoading = searchType === 'dishes' ? dishesLoading : restaurantsLoading;

  const updateSearch = (params: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateSearch({ q: formData.get('query') as string });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white border-b sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="query"
                defaultValue={query}
                placeholder={`Search ${searchType}...`}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={clsx(
                'px-4 py-2 border rounded-lg flex items-center gap-2',
                showFilters ? 'border-primary-500 text-primary-600' : 'border-gray-300 text-gray-700'
              )}
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </form>

          {/* Search type tabs */}
          <div className="flex gap-4 mt-4">
            <button
              onClick={() => {
                setSearchType('dishes');
                updateSearch({ type: 'dishes' });
              }}
              className={clsx(
                'px-4 py-2 rounded-lg font-medium',
                searchType === 'dishes' 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              Dishes
            </button>
            <button
              onClick={() => {
                setSearchType('restaurants');
                updateSearch({ type: 'restaurants' });
              }}
              className={clsx(
                'px-4 py-2 rounded-lg font-medium',
                searchType === 'restaurants' 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              Restaurants
            </button>
          </div>

          {/* Filters panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Rating
                  </label>
                  <select
                    value={minRating}
                    onChange={(e) => updateSearch({ minRating: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Any rating</option>
                    <option value="4">4+ stars</option>
                    <option value="3">3+ stars</option>
                    <option value="2">2+ stars</option>
                  </select>
                </div>

                {searchType === 'dishes' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Price
                    </label>
                    <select
                      value={maxPrice}
                      onChange={(e) => updateSearch({ maxPrice: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Any price</option>
                      <option value="10">Under $10</option>
                      <option value="20">Under $20</option>
                      <option value="30">Under $30</option>
                      <option value="50">Under $50</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => updateSearch({ sortBy: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="rating">Highest Rated</option>
                    <option value="reviews">Most Reviews</option>
                    {searchType === 'dishes' && <option value="price">Lowest Price</option>}
                    <option value="newest">Newest</option>
                  </select>
                </div>
              </div>

              {(minRating || maxPrice) && (
                <button
                  onClick={() => updateSearch({ minRating: '', maxPrice: '', cuisine: '' })}
                  className="mt-4 text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <>
            {/* Results count */}
            <p className="text-gray-600 mb-6">
              {pagination?.total || 0} {searchType} found
              {query && ` for "${query}"`}
            </p>

            {/* Results grid */}
            {searchType === 'dishes' ? (
              dishes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {dishes.map((item: any) => (
                    <MenuItemCard 
                      key={item.id} 
                      item={item}
                      restaurantName={item.category?.restaurant?.name}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No dishes found. Try adjusting your search or filters.
                </div>
              )
            ) : (
              restaurants.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {restaurants.map((restaurant: any) => (
                    <RestaurantCard key={restaurant.id} restaurant={restaurant} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No restaurants found. Try adjusting your search or filters.
                </div>
              )
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                {Array.from({ length: pagination.totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => {
                      const params = new URLSearchParams(searchParams);
                      params.set('page', String(i + 1));
                      setSearchParams(params);
                    }}
                    className={clsx(
                      'px-4 py-2 rounded-lg',
                      page === i + 1
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
