import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { restaurantApi } from '../services/api';
import StarRating from '../components/StarRating';
import MenuItemCard from '../components/MenuItemCard';
import { MapPin, Phone, Globe, Clock } from 'lucide-react';

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const priceRangeLabels = ['', '$', '$$', '$$$', '$$$$'];

export default function RestaurantPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['restaurant', id],
    queryFn: () => restaurantApi.get(id!),
    enabled: !!id,
  });

  const restaurant = data?.data?.data;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Restaurant not found</h2>
          <Link to="/" className="text-primary-600 hover:text-primary-700">
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Image */}
            <div className="w-full md:w-1/3">
              <div className="aspect-video md:aspect-square bg-gray-200 rounded-lg overflow-hidden">
                {restaurant.imageUrl ? (
                  <img 
                    src={restaurant.imageUrl} 
                    alt={restaurant.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No image
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{restaurant.name}</h1>
                  {restaurant.cuisineType.length > 0 && (
                    <p className="text-lg text-gray-600 mt-1">
                      {restaurant.cuisineType.join(' • ')} • {priceRangeLabels[restaurant.priceRange]}
                    </p>
                  )}
                </div>
                {restaurant.isVerified && (
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    Verified
                  </span>
                )}
              </div>

              {/* Rating */}
              <div className="flex items-center gap-3 mt-4">
                {restaurant.avgRating ? (
                  <>
                    <StarRating rating={restaurant.avgRating} size="lg" showValue />
                    <span className="text-gray-500">
                      ({restaurant.totalReviews} reviews)
                    </span>
                  </>
                ) : (
                  <span className="text-gray-400">No reviews yet</span>
                )}
              </div>

              {/* Description */}
              {restaurant.description && (
                <p className="text-gray-600 mt-4">{restaurant.description}</p>
              )}

              {/* Contact info */}
              <div className="mt-6 space-y-2">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span>
                    {restaurant.address}, {restaurant.city}, {restaurant.state} {restaurant.zipCode}
                  </span>
                </div>
                {restaurant.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <a href={`tel:${restaurant.phone}`} className="hover:text-primary-600">
                      {restaurant.phone}
                    </a>
                  </div>
                )}
                {restaurant.website && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Globe className="w-5 h-5 text-gray-400" />
                    <a 
                      href={restaurant.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-primary-600"
                    >
                      {restaurant.website}
                    </a>
                  </div>
                )}
              </div>

              {/* Hours */}
              {restaurant.hours && restaurant.hours.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-gray-400" />
                    Hours
                  </h3>
                  <div className="grid grid-cols-2 gap-1 text-sm">
                    {restaurant.hours.map((hour: any) => (
                      <div key={hour.dayOfWeek} className="flex justify-between">
                        <span className="text-gray-600">{dayNames[hour.dayOfWeek]}</span>
                        <span className="text-gray-900">
                          {hour.isClosed ? 'Closed' : `${hour.openTime} - ${hour.closeTime}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Menu</h2>

        {restaurant.categories && restaurant.categories.length > 0 ? (
          <div className="space-y-8">
            {restaurant.categories.map((category: any) => (
              <div key={category.id}>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="text-gray-600 mb-4">{category.description}</p>
                )}
                
                {category.items && category.items.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {category.items.map((item: any) => (
                      <MenuItemCard 
                        key={item.id} 
                        item={item}
                        showRestaurant={false}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">No items in this category</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No menu items available yet
          </div>
        )}
      </div>
    </div>
  );
}
