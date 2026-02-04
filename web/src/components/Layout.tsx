import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, User, LogOut, LayoutDashboard, Menu, X, Shield } from 'lucide-react';
import { useState } from 'react';

export default function Layout() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-primary-600">ForkScores</span>
            </Link>

            {/* Search bar (desktop) */}
            <div className="hidden md:flex flex-1 max-w-lg mx-8">
              <Link 
                to="/search" 
                className="w-full flex items-center px-4 py-2 border border-gray-300 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500"
              >
                <Search className="w-5 h-5 mr-2" />
                <span>Search dishes, restaurants...</span>
              </Link>
            </div>

            {/* Desktop navigation */}
            <nav className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  {user?.role === 'ADMIN' && (
                    <Link 
                      to="/admin" 
                      className="flex items-center px-3 py-2 text-red-600 hover:text-red-700 font-medium"
                    >
                      <Shield className="w-5 h-5 mr-1" />
                      Admin
                    </Link>
                  )}
                  {(user?.role === 'RESTAURANT_OWNER' || user?.role === 'ADMIN') && (
                    <Link 
                      to="/dashboard" 
                      className="flex items-center px-3 py-2 text-gray-700 hover:text-primary-600"
                    >
                      <LayoutDashboard className="w-5 h-5 mr-1" />
                      Dashboard
                    </Link>
                  )}
                  <Link 
                    to="/profile" 
                    className="flex items-center px-3 py-2 text-gray-700 hover:text-primary-600"
                  >
                    <User className="w-5 h-5 mr-1" />
                    {user?.name}
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center px-3 py-2 text-gray-700 hover:text-primary-600"
                  >
                    <LogOut className="w-5 h-5 mr-1" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="px-4 py-2 text-gray-700 hover:text-primary-600"
                  >
                    Log In
                  </Link>
                  <Link 
                    to="/register" 
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </nav>

            {/* Mobile menu button */}
            <button 
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-4 py-3 space-y-3">
              <Link 
                to="/search" 
                className="flex items-center px-4 py-2 border border-gray-300 rounded-full bg-gray-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Search className="w-5 h-5 mr-2 text-gray-500" />
                <span className="text-gray-500">Search...</span>
              </Link>
              
              {isAuthenticated ? (
                <>
                  {user?.role === 'ADMIN' && (
                    <Link 
                      to="/admin" 
                      className="flex items-center px-3 py-2 text-red-600"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Shield className="w-5 h-5 mr-2" />
                      Admin Panel
                    </Link>
                  )}
                  {(user?.role === 'RESTAURANT_OWNER' || user?.role === 'ADMIN') && (
                    <Link 
                      to="/dashboard" 
                      className="flex items-center px-3 py-2 text-gray-700"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <LayoutDashboard className="w-5 h-5 mr-2" />
                      Dashboard
                    </Link>
                  )}
                  <Link 
                    to="/profile" 
                    className="flex items-center px-3 py-2 text-gray-700"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="w-5 h-5 mr-2" />
                    Profile
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center px-3 py-2 text-gray-700 w-full"
                  >
                    <LogOut className="w-5 h-5 mr-2" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="block px-3 py-2 text-gray-700"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Log In
                  </Link>
                  <Link 
                    to="/register" 
                    className="block px-3 py-2 bg-primary-600 text-white rounded-lg text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">ForkScores</h3>
              <p className="text-gray-400">
                Discover and rate your favorite dishes. Find the best menu items at restaurants near you.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/search" className="hover:text-white">Search</Link></li>
                <li><Link to="/register" className="hover:text-white">Sign Up</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">For Restaurants</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/register" className="hover:text-white">Add Your Restaurant</Link></li>
                <li><Link to="/dashboard" className="hover:text-white">Owner Dashboard</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} ForkScores. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
