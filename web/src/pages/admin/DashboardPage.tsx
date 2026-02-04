import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  Store, 
  UtensilsCrossed, 
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { adminApi } from '../../services/api';

interface StatsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ElementType;
  trend?: string;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

function StatsCard({ title, value, subtitle, icon: Icon, trend, color }: StatsCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              {trend}
            </p>
          )}
        </div>
        <div className={`p-4 rounded-xl ${colorClasses[color]}`}>
          <Icon className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => adminApi.getStats(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const data = stats?.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your platform statistics</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Users"
          value={data?.users?.total || 0}
          subtitle={`${data?.users?.byRole?.ADMIN || 0} admins, ${data?.users?.byRole?.RESTAURANT_OWNER || 0} owners`}
          trend={data?.users?.recentWeek ? `+${data.users.recentWeek} this week` : undefined}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Restaurants"
          value={data?.restaurants?.total || 0}
          subtitle={`${data?.restaurants?.verified || 0} verified, ${data?.restaurants?.active || 0} active`}
          trend={data?.restaurants?.recentWeek ? `+${data.restaurants.recentWeek} this week` : undefined}
          icon={Store}
          color="green"
        />
        <StatsCard
          title="Menu Items"
          value={data?.menuItems?.total || 0}
          subtitle={`${data?.menuItems?.available || 0} available`}
          icon={UtensilsCrossed}
          color="purple"
        />
        <StatsCard
          title="Reviews"
          value={data?.reviews?.total || 0}
          subtitle={`${data?.reviews?.flagged || 0} flagged, ${data?.reviews?.hidden || 0} hidden`}
          trend={data?.reviews?.recentWeek ? `+${data.reviews.recentWeek} this week` : undefined}
          icon={MessageSquare}
          color="yellow"
        />
      </div>

      {/* Quick Actions / Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Overview</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-gray-900">Flagged Reviews</p>
                  <p className="text-sm text-gray-500">Require moderation</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-yellow-600">{data?.reviews?.flagged || 0}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">Unverified Restaurants</p>
                  <p className="text-sm text-gray-500">Pending verification</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-blue-600">
                {(data?.restaurants?.total || 0) - (data?.restaurants?.verified || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">Active Restaurants</p>
                  <p className="text-sm text-gray-500">Currently operating</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-green-600">{data?.restaurants?.active || 0}</span>
            </div>
          </div>
        </div>

        {/* Cuisine Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Cuisine Distribution</h2>
          <div className="space-y-3">
            {data?.restaurants?.byCuisine && Object.entries(data.restaurants.byCuisine)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .slice(0, 6)
              .map(([cuisine, count]) => {
                const percentage = ((count as number) / (data?.restaurants?.total || 1)) * 100;
                return (
                  <div key={cuisine}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{cuisine}</span>
                      <span className="text-gray-500">{count as number} ({percentage.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* User Role Distribution */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">User Roles</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-3xl font-bold text-gray-900">{data?.users?.byRole?.USER || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Regular Users</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-3xl font-bold text-gray-900">{data?.users?.byRole?.RESTAURANT_OWNER || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Restaurant Owners</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-3xl font-bold text-gray-900">{data?.users?.byRole?.ADMIN || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Administrators</p>
          </div>
        </div>
      </div>
    </div>
  );
}
