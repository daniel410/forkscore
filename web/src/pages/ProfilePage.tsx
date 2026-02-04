import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { userApi } from '../services/api';
import { Link } from 'react-router-dom';
import StarRating from '../components/StarRating';
import { User, Heart, Star, Settings } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();

  const { data: reviewsData } = useQuery({
    queryKey: ['userReviews'],
    queryFn: () => userApi.getReviews({ limit: 5 }),
  });

  const { data: favoritesData } = useQuery({
    queryKey: ['userFavorites'],
    queryFn: () => userApi.getFavorites({ limit: 5 }),
  });

  const reviews = reviewsData?.data?.data?.reviews || [];
  const favorites = favoritesData?.data?.data?.favorites || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
              {user?.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt={user.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-gray-400" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
              <p className="text-gray-500">{user?.email}</p>
              <p className="text-sm text-gray-400 mt-1">
                Member since {new Date(user?.createdAt || '').toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {user?._count?.reviews || 0}
              </div>
              <div className="text-sm text-gray-500">Reviews</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {user?._count?.favorites || 0}
              </div>
              <div className="text-sm text-gray-500">Favorites</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {user?._count?.restaurants || 0}
              </div>
              <div className="text-sm text-gray-500">Restaurants</div>
            </div>
          </div>
        </div>

        {/* Recent reviews */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              Your Reviews
            </h2>
          </div>

          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review: any) => (
                <Link 
                  key={review.id}
                  to={`/menu/${review.menuItemId}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {review.menuItem?.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        at {review.menuItem?.category?.restaurant?.name}
                      </p>
                    </div>
                    <StarRating rating={review.rating} size="sm" />
                  </div>
                  <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                    {review.content}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              You haven't written any reviews yet
            </p>
          )}
        </div>

        {/* Favorites */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary-500" />
              Your Favorites
            </h2>
          </div>

          {favorites.length > 0 ? (
            <div className="space-y-4">
              {favorites.map((item: any) => (
                <Link 
                  key={item.id}
                  to={`/menu/${item.id}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      {item.imageUrl ? (
                        <img 
                          src={item.imageUrl} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-500">
                        {item.category?.restaurant?.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {item.avgRating && (
                          <StarRating rating={item.avgRating} size="sm" />
                        )}
                        <span className="font-medium text-gray-900">
                          ${item.price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              You haven't saved any favorites yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
