// User types
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  role: 'USER' | 'RESTAURANT_OWNER' | 'ADMIN';
  isVerified: boolean;
  createdAt: string;
  _count?: {
    reviews: number;
    favorites: number;
    restaurants: number;
  };
}

// Restaurant types
export interface Restaurant {
  id: string;
  name: string;
  description?: string | null;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  website?: string | null;
  imageUrl?: string | null;
  cuisineType: string[];
  priceRange: number;
  isVerified: boolean;
  isActive: boolean;
  avgRating?: number | null;
  totalReviews: number;
  createdAt: string;
  categories?: MenuCategory[];
  hours?: RestaurantHours[];
  owner?: { id: string; name: string };
}

export interface RestaurantHours {
  id: string;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

// Menu types
export interface MenuCategory {
  id: string;
  restaurantId: string;
  name: string;
  description?: string | null;
  sortOrder: number;
  items?: MenuItem[];
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  isAvailable: boolean;
  isPopular: boolean;
  tags: string[];
  avgRating?: number | null;
  avgTasteRating?: number | null;
  avgQualityRating?: number | null;
  avgValueRating?: number | null;
  avgPresentationRating?: number | null;
  totalReviews: number;
  category?: MenuCategory & { restaurant?: Restaurant };
  isFavorited?: boolean;
}

// Review types
export interface Review {
  id: string;
  userId: string;
  menuItemId: string;
  rating: number;
  tasteRating?: number | null;
  qualityRating?: number | null;
  valueRating?: number | null;
  presentationRating?: number | null;
  title?: string | null;
  content: string;
  photos?: ReviewPhoto[];
  helpfulCount: number;
  ownerResponse?: string | null;
  ownerResponseAt?: string | null;
  isVisible: boolean;
  isFlagged: boolean;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string; avatarUrl?: string | null };
  menuItem?: MenuItem;
  hasVotedHelpful?: boolean;
}

export interface ReviewPhoto {
  id: string;
  url: string;
  caption?: string | null;
  sortOrder: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
