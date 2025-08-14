import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Users, Package, BarChart3, Trash2, Search as SearchIcon } from 'lucide-react';
import { AdminProductManager } from '@/components/AdminProductManager';
import AdminCategoryManager from '@/components/AdminCategoryManager';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const PAGE_SIZE = 10;

export default function AdminDashboard() {
  const { user, isAdmin, isAdminManager } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalCategories: 0,
    newUsersLast7Days: 0,
  });
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<any>(null);

  const totalAll = stats.totalUsers + stats.totalProducts + stats.totalCategories;

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
      fetchUsers();
      setupRealtimeSubscriptions();
    }

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [isAdmin]);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter]);

  const fetchStats = async () => {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [usersResponse, productsResponse, categoriesResponse, recentUsersResponse] = await Promise.all([
        supabase.from('profiles').select('id'),
        supabase.from('products').select('id'),
        supabase.from('categories').select('id'),
        supabase.from('profiles').select('id').gte('created_at', sevenDaysAgo),
      ]);

      setStats({
        totalUsers: usersResponse.data?.length || 0,
        totalProducts: productsResponse.data?.length || 0,
        totalCategories: categoriesResponse.data?.length || 0,
        newUsersLast7Days: recentUsersResponse.data?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        setUsers([]);
        return;
      }

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) console.error('Error fetching roles:', rolesError);

      const mergedUsers = profiles.map(profile => ({
        ...profile,
        user_roles: roles?.filter(r => r.user_id === profile.id) || []
      }));

      setUsers(mergedUsers || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    const sub = supabase
      .channel('public:profiles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setUsers((prev) => [payload.new, ...prev]);
            setStats((prev) => ({ ...prev, totalUsers: prev.totalUsers + 1 }));
          } else if (payload.eventType === 'DELETE') {
            setUsers((prev) => prev.filter((user) => user.id !== payload.old.id));
            setStats((prev) => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
          }
        }
      )
      .subscribe();

    setSubscription(sub);
  };

  const filterUsers = () => {
    let filtered = [...users];

    const excludedEmails = ['adminviewer@gmail.com', 'adminmanager@gmail.com', 'shrestha@natan.com'];
    filtered = filtered.filter(u => !excludedEmails.includes(u.email));

    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (u) =>
          u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter) {
      filtered = filtered.filter((u) => u.user_roles?.[0]?.role === roleFilter);
    }

    setFilteredUsers(filtered);
    setPage(1);
  };

  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [filteredUsers, page]);

  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      if (error) throw error;
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (error: any) {
      alert('Failed to delete user: ' + error.message);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Access denied. Admin privileges required.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.email}</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          {isAdminManager && (
            <>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
            </>
          )}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid gap-8 md:grid-cols-3">
            {[{
              title: 'Total Users',
              value: stats.totalUsers,
              icon: <Users className="h-6 w-6 text-indigo-600" />,
              subtitle: `New last 7 days: ${stats.newUsersLast7Days}`
            }, {
              title: 'Total Products',
              value: stats.totalProducts,
              icon: <Package className="h-6 w-6 text-yellow-500" />,
            }, {
              title: 'Categories',
              value: stats.totalCategories,
              icon: <BarChart3 className="h-6 w-6 text-green-500" />,
            }].map(({ title, value, icon, subtitle }) => (
              <Card
                key={title}
                className="flex flex-col justify-between p-6 hover:shadow-lg transition-shadow duration-300"
              >
                <CardHeader className="flex items-center justify-between pb-3">
                  <CardTitle className="text-base font-semibold text-gray-700">{title}</CardTitle>
                  {icon}
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-3xl font-extrabold text-gray-900">{value}</p>
                  {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-8 bg-white/60 backdrop-blur-xl shadow-lg border border-white/20">
            <CardHeader>
              <CardTitle>Platform Overview</CardTitle>
              <CardDescription>Visual breakdown with live totals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[320px] flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      <linearGradient id="gradUsers" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#818CF8" stopOpacity={0.9} />
                      </linearGradient>
                      <linearGradient id="gradProducts" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#FBBF24" stopOpacity={0.9} />
                      </linearGradient>
                      <linearGradient id="gradCategories" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#34D399" stopOpacity={0.9} />
                      </linearGradient>
                    </defs>

                    <Pie
                      data={[
                        { name: 'Users', value: stats.totalUsers },
                        { name: 'Products', value: stats.totalProducts },
                        { name: 'Categories', value: stats.totalCategories },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={3}
                      dataKey="value"
                      animationDuration={800}
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {[stats.totalUsers, stats.totalProducts, stats.totalCategories].map(
                        (_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={[
                              'url(#gradUsers)',
                              'url(#gradProducts)',
                              'url(#gradCategories)',
                            ][index % 3]}
                          />
                        )
                      )}
                    </Pie>

                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>

                <div className="absolute text-center">
                  <p className="text-lg font-semibold text-gray-600">Total</p>
                  <p className="text-3xl font-bold">{totalAll}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Users</CardTitle>
                <CardDescription>Manage all registered users</CardDescription>
              </div>

              <div className="flex gap-2 flex-wrap items-center">
                <div className="relative">
                  <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="search"
                    placeholder="Search by name or email"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-1 border rounded-md focus:outline-none focus:ring focus:ring-indigo-500"
                  />
                </div>

                <select
                  value={roleFilter || ''}
                  onChange={(e) => setRoleFilter(e.target.value || null)}
                  className="border border-gray-300 rounded-md py-2 px-3 bg-white text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  aria-label="Filter by role"
                >
                  <option value="user">User</option>
                </select>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <p>Loading users...</p>
              ) : (
                <>
                  <div className="space-y-4">
                    {paginatedUsers.length === 0 ? (
                      <p>No users found.</p>
                    ) : (
                      paginatedUsers.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{user.full_name || 'No name'}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            <p className="text-xs text-muted-foreground">
                              Joined: {new Date(user.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge
                              variant={
                                user.user_roles?.[0]?.role === 'user' ? 'secondary' : 'default'
                              }
                            >
                              {user.user_roles?.[0]?.role || 'user'}
                            </Badge>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              aria-label={`Delete user ${user.full_name || user.email}`}
                              className="p-1 rounded-md hover:bg-red-100 text-red-600"
                              type="button"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {totalPages > 1 && (
                    <div className="mt-4 flex justify-center space-x-2">
                      <button
                        disabled={page === 1}
                        onClick={() => setPage((p) => Math.max(p - 1, 1))}
                        className={`px-3 py-1 rounded-md ${
                          page === 1 ? 'bg-gray-300 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        Previous
                      </button>
                      <span className="inline-flex items-center px-2">{page}</span>
                      <button
                        disabled={page === totalPages}
                        onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                        className={`px-3 py-1 rounded-md ${
                          page === totalPages ? 'bg-gray-300 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manager Tabs */}
        {isAdminManager && (
          <>
            <TabsContent value="products">
              <AdminProductManager />
            </TabsContent>
            <TabsContent value="categories">
              <AdminCategoryManager />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
