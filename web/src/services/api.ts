import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('accessToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }

          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, clear tokens
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data: { email: string; password: string; name: string }) =>
    api.post('/auth/register', data),
  
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  
  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),
  
  getMe: () =>
    api.get('/auth/me'),
  
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
};

// Restaurant API
export const restaurantApi = {
  list: (params?: {
    search?: string;
    city?: string;
    cuisine?: string;
    priceRange?: number;
    minRating?: number;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }) => api.get('/restaurants', { params }),
  
  get: (id: string) =>
    api.get(`/restaurants/${id}`),
  
  create: (data: {
    name: string;
    description?: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    phone?: string;
    website?: string;
    cuisineType?: string[];
    priceRange?: number;
  }) => api.post('/restaurants', data),
  
  update: (id: string, data: Partial<Parameters<typeof restaurantApi.create>[0]>) =>
    api.patch(`/restaurants/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/restaurants/${id}`),
  
  getAnalytics: (id: string) =>
    api.get(`/restaurants/${id}/analytics`),
};

// Menu API
export const menuApi = {
  listItems: (params?: {
    search?: string;
    restaurant?: string;
    tags?: string;
    minRating?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }) => api.get('/menus/items', { params }),
  
  getItem: (id: string) =>
    api.get(`/menus/items/${id}`),
  
  createCategory: (data: {
    restaurantId: string;
    name: string;
    description?: string;
    sortOrder?: number;
  }) => api.post('/menus/categories', data),
  
  updateCategory: (id: string, data: { name?: string; description?: string; sortOrder?: number }) =>
    api.patch(`/menus/categories/${id}`, data),
  
  deleteCategory: (id: string) =>
    api.delete(`/menus/categories/${id}`),
  
  createItem: (data: {
    categoryId: string;
    name: string;
    description?: string;
    price: number;
    imageUrl?: string;
    isAvailable?: boolean;
    isPopular?: boolean;
    tags?: string[];
  }) => api.post('/menus/items', data),
  
  updateItem: (id: string, data: Partial<Omit<Parameters<typeof menuApi.createItem>[0], 'categoryId'>>) =>
    api.patch(`/menus/items/${id}`, data),
  
  deleteItem: (id: string) =>
    api.delete(`/menus/items/${id}`),
  
  toggleFavorite: (id: string) =>
    api.post(`/menus/items/${id}/favorite`),
};

// Review API
export const reviewApi = {
  listByMenuItem: (menuItemId: string, params?: {
    page?: number;
    limit?: number;
    sortBy?: 'helpful' | 'newest' | 'rating';
  }) => api.get(`/reviews/item/${menuItemId}`, { params }),
  
  create: (data: {
    menuItemId: string;
    rating: number;
    tasteRating?: number;
    qualityRating?: number;
    valueRating?: number;
    presentationRating?: number;
    title?: string;
    content: string;
    photoUrls?: string[];
  }) => api.post('/reviews', data),
  
  update: (id: string, data: Partial<Omit<Parameters<typeof reviewApi.create>[0], 'menuItemId'>>) =>
    api.patch(`/reviews/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/reviews/${id}`),
  
  toggleHelpful: (id: string) =>
    api.post(`/reviews/${id}/helpful`),
  
  respond: (id: string, response: string) =>
    api.post(`/reviews/${id}/respond`, { response }),
  
  flag: (id: string) =>
    api.post(`/reviews/${id}/flag`),
};

// User API
export const userApi = {
  getProfile: () =>
    api.get('/users/profile'),
  
  updateProfile: (data: { name?: string; avatarUrl?: string | null }) =>
    api.patch('/users/profile', data),
  
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/users/change-password', data),
  
  getReviews: (params?: { page?: number; limit?: number }) =>
    api.get('/users/reviews', { params }),
  
  getFavorites: (params?: { page?: number; limit?: number }) =>
    api.get('/users/favorites', { params }),
  
  getRestaurants: () =>
    api.get('/users/restaurants'),
  
  deleteAccount: () =>
    api.delete('/users/account'),
};

// Upload API
export const uploadApi = {
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/uploads/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  uploadImages: (files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    return api.post('/uploads/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Admin API
export const adminApi = {
  // Dashboard stats
  getStats: () => api.get('/admin/stats'),

  // User management
  listUsers: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isVerified?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => api.get('/admin/users', { params }),

  getUser: (id: string) => api.get(`/admin/users/${id}`),

  updateUser: (id: string, data: { role?: string; isVerified?: boolean; name?: string }) =>
    api.patch(`/admin/users/${id}`, data),

  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),

  // Restaurant management
  listRestaurants: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    isVerified?: string;
    isActive?: string;
    cuisineType?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => api.get('/admin/restaurants', { params }),

  updateRestaurant: (id: string, data: { isVerified?: boolean; isActive?: boolean }) =>
    api.patch(`/admin/restaurants/${id}`, data),

  deleteRestaurant: (id: string) => api.delete(`/admin/restaurants/${id}`),

  // Review management
  listReviews: (params?: {
    page?: number;
    limit?: number;
    isFlagged?: string;
    isVisible?: string;
    minRating?: number;
    maxRating?: number;
    sortBy?: string;
    sortOrder?: string;
  }) => api.get('/admin/reviews', { params }),

  updateReview: (id: string, data: { isVisible?: boolean; isFlagged?: boolean }) =>
    api.patch(`/admin/reviews/${id}`, data),

  deleteReview: (id: string) => api.delete(`/admin/reviews/${id}`),

  // Menu item management
  listMenuItems: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    isAvailable?: string;
    restaurantId?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => api.get('/admin/menu-items', { params }),

  updateMenuItem: (id: string, data: { isAvailable?: boolean; isPopular?: boolean }) =>
    api.patch(`/admin/menu-items/${id}`, data),
};
