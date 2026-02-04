import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'
import RestaurantPage from './pages/RestaurantPage'
import MenuItemPage from './pages/MenuItemPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProfilePage from './pages/ProfilePage'
import DashboardPage from './pages/dashboard/DashboardPage'
import DashboardRestaurantPage from './pages/dashboard/RestaurantPage'
import ProtectedRoute from './components/ProtectedRoute'

// Admin pages
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/DashboardPage'
import AdminUsersPage from './pages/admin/UsersPage'
import AdminRestaurantsPage from './pages/admin/RestaurantsPage'
import AdminReviewsPage from './pages/admin/ReviewsPage'
import AdminMenuItemsPage from './pages/admin/MenuItemsPage'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/restaurant/:id" element={<RestaurantPage />} />
        <Route path="/menu/:id" element={<MenuItemPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute requiredRole="RESTAURANT_OWNER">
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/restaurant/:id" 
          element={
            <ProtectedRoute requiredRole="RESTAURANT_OWNER">
              <DashboardRestaurantPage />
            </ProtectedRoute>
          } 
        />
      </Route>

      {/* Admin Routes */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="restaurants" element={<AdminRestaurantsPage />} />
        <Route path="reviews" element={<AdminReviewsPage />} />
        <Route path="menu-items" element={<AdminMenuItemsPage />} />
      </Route>
    </Routes>
  )
}

export default App
