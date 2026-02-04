import { Link } from 'react-router-dom';
import { MenuItem } from '../types';
import StarRating from './StarRating';
import { Heart } from 'lucide-react';
import { clsx } from 'clsx';

interface MenuItemCardProps {
  item: MenuItem;
  restaurantName?: string;
  showRestaurant?: boolean;
}

export default function MenuItemCard({ item, restaurantName, showRestaurant = true }: MenuItemCardProps) {
  return (
    <Link 
      to={`/menu/${item.id}`}
      className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      {/* Image */}
      <div className="aspect-video bg-gray-200 relative">
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
        {item.isPopular && (
          <span className="absolute top-2 left-2 bg-primary-600 text-white text-xs px-2 py-1 rounded-full">
            Popular
          </span>
        )}
        {item.isFavorited && (
          <Heart className="absolute top-2 right-2 w-5 h-5 text-primary-600 fill-primary-600" />
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
        
        {showRestaurant && restaurantName && (
          <p className="text-sm text-gray-500 truncate">{restaurantName}</p>
        )}

        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
          {item.description || 'No description available'}
        </p>

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {item.avgRating ? (
              <>
                <StarRating rating={item.avgRating} size="sm" />
                <span className="text-sm text-gray-500">
                  ({item.totalReviews})
                </span>
              </>
            ) : (
              <span className="text-sm text-gray-400">No reviews yet</span>
            )}
          </div>
          <span className="font-semibold text-gray-900">
            ${item.price.toFixed(2)}
          </span>
        </div>

        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {item.tags.slice(0, 3).map(tag => (
              <span 
                key={tag}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
