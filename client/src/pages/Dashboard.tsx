import { useEffect, useState } from 'react';
import { apolloClient } from '@/graphql/apollo-client';
import { GET_ADMIN_STATS } from '@/graphql/operations';
import type { AdminStatsResponse } from '@/graphql/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Calendar, BarChart3, CreditCard, Bell, ClipboardList, Crown } from 'lucide-react';
import { useFitConnectAuth } from '@/contexts/FitConnectAuthContext';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ title, value, subtitle, icon, color }: StatCardProps) {
  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${color}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-12 w-12 rounded-2xl" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useFitConnectAuth();
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apolloClient
      .query({ query: GET_ADMIN_STATS, fetchPolicy: 'network-only' })
      .then(({ data }) => {
        setStats((data as Record<string, unknown>)?.getAdminStats as AdminStatsResponse);
      })
      .catch(() => {
        // Stats may not be available for non-admin users
      })
      .finally(() => setLoading(false));
  }, []);

  const adminStats = stats?.stats;

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back{user?.name ? `, ${user.name}` : ''}
        </h1>
        <p className="text-muted-foreground mt-1">
          Here is an overview of your FitConnect platform.
        </p>
      </div>

      {/* Stats grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : adminStats ? (
        <>
          {/* User stats row */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Users</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Users"
                value={adminStats.users.totalUsers}
                subtitle={`${adminStats.users.newUsers} new recently`}
                icon={<Users className="h-6 w-6 text-blue-600" />}
                color="bg-blue-50"
              />
              <StatCard
                title="Active Users"
                value={adminStats.users.totalUsers - adminStats.users.notActiveUsers}
                subtitle={`${adminStats.users.notActiveUsers} inactive`}
                icon={<Users className="h-6 w-6 text-emerald-600" />}
                color="bg-emerald-50"
              />
              <StatCard
                title="Pending Users"
                value={adminStats.users.pendingUsers}
                subtitle="Awaiting approval"
                icon={<Users className="h-6 w-6 text-amber-600" />}
                color="bg-amber-50"
              />
              <StatCard
                title="Blocked Users"
                value={adminStats.users.blockedUsers}
                icon={<Users className="h-6 w-6 text-red-600" />}
                color="bg-red-50"
              />
            </div>
          </div>

          {/* Platform stats row */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Platform</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Schedules"
                value={adminStats.schedules}
                icon={<Calendar className="h-6 w-6 text-violet-600" />}
                color="bg-violet-50"
              />
              <StatCard
                title="Active Plans"
                value={adminStats.plans}
                icon={<Crown className="h-6 w-6 text-indigo-600" />}
                color="bg-indigo-50"
              />
              <StatCard
                title="Subscriptions"
                value={adminStats.subscriptions}
                icon={<ClipboardList className="h-6 w-6 text-cyan-600" />}
                color="bg-cyan-50"
              />
              <StatCard
                title="Polls"
                value={adminStats.polls}
                icon={<BarChart3 className="h-6 w-6 text-pink-600" />}
                color="bg-pink-50"
              />
            </div>
          </div>

          {/* Financial stats row */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Financial</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Transactions"
                value={adminStats.transactions}
                icon={<CreditCard className="h-6 w-6 text-teal-600" />}
                color="bg-teal-50"
              />
              <StatCard
                title="Notifications"
                value={adminStats.notifications}
                icon={<Bell className="h-6 w-6 text-orange-600" />}
                color="bg-orange-50"
              />
            </div>
          </div>
        </>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Statistics are not available. You may not have admin permissions to view platform stats.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
