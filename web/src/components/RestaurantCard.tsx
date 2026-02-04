import { Link } from 'react-router-dom';
import { Restaurant } from '../types';
import StarRating from './StarRating';
import { MapPin } from 'lucide-react';

interface RestaurantCardProps {
  restaurant: Restaurant;
}

const priceRangeLabels = ['', '$', '$$', '$$$', '$$$$'];

export default function RestaurantCard({ restaurant }: RestaurantCardProps) {
  return (
    <Link 
      to={`/restaurant/${restaurant.id}`}
      className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      {/* Image */}
      <div className="aspect-video bg-gray-200 relative">
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
        {restaurant.isVerified && (
          <span className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full">
            Verified
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-gray-900 truncate flex-1">{restaurant.name}</h3>
          <span className="text-gray-500 font-medium ml-2">
            {priceRangeLabels[restaurant.priceRange]}
          </span>
        </div>
        
        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
          <MapPin className="w-4 h-4" />
          <span>{restaurant.city}, {restaurant.state}</span>
        </div>

        {restaurant.cuisineType.length > 0 && (
          <p className="text-sm text-gray-600 mt-1">
            {restaurant.cuisineType.slice(0, 3).join(' • ')}
          </p>
        )}

        <div className="mt-2 flex items-center gap-2">
          {restaurant.avgRating ? (
            <>
              <StarRating rating={restaurant.avgRating} size="sm" />
              <span className="text-sm text-gray-500">
                ({restaurant.totalReviews} reviews)
              </span>
            </>
          ) : (
            <span className="text-sm text-gray-400">No reviews yet</span>
          )}
        </div>
      </div>
    </Link>
  );
}
