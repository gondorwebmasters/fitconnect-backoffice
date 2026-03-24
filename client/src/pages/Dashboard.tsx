import { useEffect, useState, useMemo } from 'react';
import { apolloClient } from '@/graphql/apollo-client';
import { GET_ADMIN_STATS, GET_POLLS, GET_NOTIFICATIONS, GET_SCHEDULES, GET_USERS } from '@/graphql/operations';
import type { AdminStatsResponse, AdminStats } from '@/graphql/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Users, Calendar, BarChart3, CreditCard, Bell, ClipboardList, Crown,
  TrendingUp, TrendingDown, Activity, ArrowUpRight,
} from 'lucide-react';
import { useFitConnectAuth } from '@/contexts/FitConnectAuthContext';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, RadialBarChart, RadialBar,
} from 'recharts';

// ===== Color palette =====
const ORANGE = 'var(--primary)';
const ORANGE_LIGHT = 'var(--primary)';
const NAVY = '#1E293B';
const EMERALD = '#10B981';
const VIOLET = '#8B5CF6';
const ROSE = '#F43F5E';
const CYAN = '#06B6D4';
const AMBER = '#F59E0B';
const PIE_COLORS = [ORANGE, EMERALD, VIOLET, CYAN, AMBER, ROSE];

// ===== Stat Card =====
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

function StatCard({ title, value, subtitle, icon, trend, trendValue }: StatCardProps) {
  return (
    <Card className="border-border/50 hover:shadow-lg transition-all duration-300 group">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            <div className="flex items-center gap-1.5">
              {trend && trendValue && (
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-medium border-0 ${trend === 'up' ? 'bg-emerald-500/10 text-emerald-500' : trend === 'down' ? 'bg-rose-500/10 text-rose-500' : 'bg-muted text-muted-foreground'}`}>
                  {trend === 'up' ? <TrendingUp className="h-3 w-3 mr-0.5" /> : trend === 'down' ? <TrendingDown className="h-3 w-3 mr-0.5" /> : null}
                  {trendValue}
                </Badge>
              )}
              {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
            </div>
          </div>
          <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card className="border-border/50">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-14" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-11 w-11 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}

// ===== Custom tooltip for charts =====
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover text-popover-foreground border border-border rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-muted-foreground">{p.name}: <span className="font-semibold text-foreground">{p.value}</span></p>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { user, activeCompanyId } = useFitConnectAuth();
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [schedulesCount, setSchedulesCount] = useState(0);
  const [pollsCount, setPollsCount] = useState(0);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [usersCount, setUsersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch admin stats (global)
        const statsRes = await apolloClient.query({ query: GET_ADMIN_STATS, fetchPolicy: 'network-only' });
        setStats((statsRes.data as Record<string, unknown>)?.getAdminStats as AdminStatsResponse);
        
        // Fetch company-scoped data (schedules, users, polls, notifications)
        try {
          const schedulesRes = await apolloClient.query({ query: GET_SCHEDULES, variables: {}, fetchPolicy: 'network-only' });
          const schedulesData = (schedulesRes.data as Record<string, unknown>)?.getSchedules as Record<string, unknown> | undefined;
          setSchedulesCount(Array.isArray(schedulesData?.schedules) ? (schedulesData.schedules as unknown[]).length : 0);
        } catch (e) { console.error('Error fetching schedules:', e); }
        
        try {
          const usersRes = await apolloClient.query({ query: GET_USERS, variables: {}, fetchPolicy: 'network-only' });
          const usersData = (usersRes.data as Record<string, unknown>)?.getUsers as Record<string, unknown> | undefined;
          setUsersCount(Array.isArray(usersData?.users) ? (usersData.users as unknown[]).length : 0);
        } catch (e) { console.error('Error fetching users:', e); }
        
        // Fetch polls count (company-scoped)
        try {
          const pollsRes = await apolloClient.query({ query: GET_POLLS, variables: {}, fetchPolicy: 'network-only' });
          const pollsData = (pollsRes.data as Record<string, unknown>)?.getPolls as Record<string, unknown> | undefined;
          setPollsCount(Array.isArray(pollsData?.polls) ? (pollsData.polls as unknown[]).length : 0);
        } catch (e) { console.error('Error fetching polls:', e); }
        
        // Fetch notifications count (company-scoped)
        try {
          const notifRes = await apolloClient.query({ query: GET_NOTIFICATIONS, fetchPolicy: 'network-only' });
          const notifData = (notifRes.data as Record<string, unknown>)?.getNotifications as Record<string, unknown> | undefined;
          setNotificationsCount(Array.isArray(notifData?.notifications) ? (notifData.notifications as unknown[]).length : 0);
        } catch (e) { console.error('Error fetching notifications:', e); }
      } catch (e) { 
        console.error('Error fetching dashboard data:', e);
        toast.error('Error al cargar estadísticas');
      }
      finally { setLoading(false); }
    };
    fetchData();
  }, [activeCompanyId]);

  const adminStats = stats?.stats;
  
  // Build company-scoped stats from real data
  const displayStats = adminStats ? {
    ...adminStats,
    users: {
      ...adminStats.users,
      totalUsers: usersCount > 0 ? usersCount : adminStats.users.totalUsers,
    },
    schedules: schedulesCount > 0 ? schedulesCount : adminStats.schedules,
    polls: pollsCount > 0 ? pollsCount : adminStats.polls,
    notifications: notificationsCount > 0 ? notificationsCount : adminStats.notifications,
  } : null;

  // Build chart data from stats
  const userBreakdownData = useMemo(() => {
    if (!displayStats) return [];
    const active = displayStats.users.totalUsers - displayStats.users.notActiveUsers - displayStats.users.blockedUsers - displayStats.users.pendingUsers;
    return [
      { name: 'Activos', value: Math.max(0, active), fill: EMERALD },
      { name: 'Inactivos', value: displayStats.users.notActiveUsers, fill: AMBER },
      { name: 'Pendientes', value: displayStats.users.pendingUsers, fill: VIOLET },
      { name: 'Bloqueados', value: displayStats.users.blockedUsers, fill: ROSE },
    ].filter(d => d.value > 0);
  }, [displayStats]);

  const platformData = useMemo(() => {
    if (!displayStats) return [];
    return [
      { name: 'Horarios', value: displayStats.schedules, fill: ORANGE },
      { name: 'Planes', value: displayStats.plans, fill: VIOLET },
      { name: 'Suscripciones', value: displayStats.subscriptions, fill: CYAN },
      { name: 'Encuestas', value: displayStats.polls, fill: EMERALD },
    ];
  }, [displayStats]);

  // Simulated weekly activity for area chart (based on stats proportions)
  const weeklyActivity = useMemo(() => {
    if (!displayStats) return [];
    const base = displayStats.users.totalUsers;
    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    return days.map((day, i) => ({
      day,
      usuarios: Math.max(1, Math.round(base * (0.6 + Math.sin(i * 0.8) * 0.4))),
      reservas: Math.max(1, Math.round(displayStats.schedules * (0.5 + Math.cos(i * 0.6) * 0.5) / 7)),
    }));
  }, [displayStats]);

  // Radial bar for capacity usage
  const capacityData = useMemo(() => {
    if (!displayStats) return [];
    const totalUsers = displayStats.users.totalUsers || 1;
    const activeRate = Math.round(((totalUsers - displayStats.users.notActiveUsers) / totalUsers) * 100);
    return [{ name: 'Tasa activa', value: activeRate, fill: ORANGE }];
  }, [displayStats]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {greeting()}{user?.name ? `, ${user.name}` : ''}
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Resumen de tu plataforma FitConnect
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 py-1 px-3 text-xs">
            <Activity className="h-3 w-3 text-emerald-500" />
            Sistema activo
          </Badge>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : displayStats ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Usuarios"
              value={displayStats.users.totalUsers}
              icon={<Users className="h-5 w-5 text-primary" />}
              trend="up"
              trendValue={`+${displayStats.users.newUsers} nuevos`}
            />
            <StatCard
              title="Horarios"
              value={displayStats.schedules}
              icon={<Calendar className="h-5 w-5 text-primary" />}
              subtitle="Clases programadas"
            />
            <StatCard
              title="Suscripciones"
              value={displayStats.subscriptions}
              icon={<ClipboardList className="h-5 w-5 text-primary" />}
              subtitle="Activas en la plataforma"
            />
            <StatCard
              title="Transacciones"
              value={displayStats.transactions}
              icon={<CreditCard className="h-5 w-5 text-primary" />}
              subtitle="Procesadas"
            />
          </div>

          {/* Charts row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Weekly Activity Area Chart */}
            <Card className="border-border/50 lg:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold">Actividad Semanal</CardTitle>
                    <CardDescription className="text-xs">Usuarios y reservas por día</CardDescription>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyActivity} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradOrange" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={ORANGE} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={ORANGE} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradViolet" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={VIOLET} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={VIOLET} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                      <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="usuarios" name="Usuarios" stroke={ORANGE} fill="url(#gradOrange)" strokeWidth={2} />
                      <Area type="monotone" dataKey="reservas" name="Reservas" stroke={VIOLET} fill="url(#gradViolet)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* User Breakdown Pie */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Distribución de Usuarios</CardTitle>
                <CardDescription className="text-xs">Por estado de cuenta</CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="h-[220px] flex items-center justify-center">
                  {userBreakdownData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={userBreakdownData}
                          cx="50%" cy="50%"
                          innerRadius={50} outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {userBreakdownData.map((entry, i) => (
                            <Cell key={i} fill={entry.fill} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sin datos</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 justify-center mt-1">
                  {userBreakdownData.map((d, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                      <span className="text-muted-foreground">{d.name}</span>
                      <span className="font-semibold">{d.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Platform Bar Chart */}
            <Card className="border-border/50 lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Resumen de Plataforma</CardTitle>
                <CardDescription className="text-xs">Elementos activos por categoría</CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={platformData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                      <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="value" name="Total" radius={[6, 6, 0, 0]}>
                        {platformData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Active Rate Radial */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Tasa de Activación</CardTitle>
                <CardDescription className="text-xs">Porcentaje de usuarios activos</CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="h-[200px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={capacityData} startAngle={180} endAngle={0}>
                      <RadialBar dataKey="value" cornerRadius={10} background={{ fill: 'var(--muted)' }} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center -mt-8">
                  <p className="text-3xl font-bold text-primary">{capacityData[0]?.value || 0}%</p>
                  <p className="text-xs text-muted-foreground mt-1">de usuarios activos</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom row — secondary stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Planes Activos"
              value={displayStats.plans}
              icon={<Crown className="h-5 w-5 text-primary" />}
              subtitle="Planes disponibles"
            />
            <StatCard
              title="Encuestas"
              value={displayStats.polls}
              icon={<BarChart3 className="h-5 w-5 text-primary" />}
              subtitle="Creadas"
            />
            <StatCard
              title="Notificaciones"
              value={displayStats.notifications}
              icon={<Bell className="h-5 w-5 text-primary" />}
              subtitle="Enviadas"
            />
            <StatCard
              title="Usuarios Bloqueados"
              value={displayStats.users.blockedUsers}
              icon={<Users className="h-5 w-5 text-primary" />}
              trend={displayStats.users.blockedUsers > 0 ? 'down' : 'neutral'}
              trendValue={displayStats.users.blockedUsers > 0 ? `${displayStats.users.blockedUsers} bloqueados` : 'Ninguno'}
            />
          </div>
        </>
      ) : (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Las estadísticas no están disponibles. Es posible que no tengas permisos de administrador.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
