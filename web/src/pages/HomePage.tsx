import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { restaurantApi, menuApi } from '../services/api';
import { Search, TrendingUp, Utensils, MapPin } from 'lucide-react';
import RestaurantCard from '../components/RestaurantCard';
import MenuItemCard from '../components/MenuItemCard';

export default function HomePage() {
  const navigate = useNavigate();

  // Fetch top-rated menu items
  const { data: topItemsData } = useQuery({
    queryKey: ['topMenuItems'],
    queryFn: () => menuApi.listItems({ sortBy: 'rating', sortOrder: 'desc', limit: 8 }),
  });

  // Fetch popular restaurants
  const { data: restaurantsData } = useQuery({
    queryKey: ['popularRestaurants'],
    queryFn: () => restaurantApi.list({ sortBy: 'reviews', sortOrder: 'desc', limit: 4 }),
  });

  const topItems = topItemsData?.data?.data?.items || [];
  const restaurants = restaurantsData?.data?.data?.restaurants || [];

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get('query') as string;
    if (query) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Find & Rate Your Favorite Dishes
          </h1>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Discover the best menu items at restaurants near you. Read reviews for specific dishes, not just restaurants.
          </p>
          
          {/* Search bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="flex bg-white rounded-full shadow-lg overflow-hidden">
              <input 
                type="text"
                name="query"
                placeholder="Search for dishes, cuisines, or restaurants..."
                className="flex-1 px-6 py-4 text-gray-900 focus:outline-none"
              />
              <button 
                type="submit"
                className="px-6 py-4 bg-primary-600 hover:bg-primary-700 text-white"
              >
                <Search className="w-6 h-6" />
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Utensils className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Rate Menu Items</h3>
              <p className="text-gray-600">
                Review individual dishes with detailed ratings for taste, quality, value, and presentation.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Discover Top Dishes</h3>
              <p className="text-gray-600">
                Find the highest-rated dishes in your area based on real user reviews.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Restaurant Owners</h3>
              <p className="text-gray-600">
                Manage your menu, respond to reviews, and track analytics with our owner dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Top Rated Dishes */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Top Rated Dishes</h2>
            <Link to="/search?sortBy=rating" className="text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </div>
          
          {topItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {topItems.map((item: any) => (
                <MenuItemCard 
                  key={item.id} 
                  item={item}
                  restaurantName={item.category?.restaurant?.name}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No dishes found yet. Be the first to add a review!
            </div>
          )}
        </div>
      </section>

      {/* Popular Restaurants */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Popular Restaurants</h2>
            <Link to="/search?type=restaurants" className="text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </div>
          
          {restaurants.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {restaurants.map((restaurant: any) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No restaurants found yet. Add yours today!
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Own a Restaurant?</h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Add your restaurant to ForkScores and let customers discover your best dishes.
          </p>
          <Link 
            to="/register"
            className="inline-block px-8 py-3 bg-white text-primary-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            Get Started for Free
          </Link>
        </div>
      </section>
    </div>
  );
}
