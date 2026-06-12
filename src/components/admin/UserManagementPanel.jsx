import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Users, UserPlus, Shield, Mail, Phone, Calendar, Search,
  Edit, Trash, CheckCircle, XCircle, Activity, TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function UserManagementPanel() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: rides = [] } = useQuery({
    queryKey: ['user-management-rides'],
    queryFn: () => base44.entities.Ride.list('-created_date', 500),
  });

  const updateUserRole = useMutation({
    mutationFn: async ({ userId, role }) => {
      await base44.entities.User.update(userId, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      toast.success('User role updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update user: ' + error.message);
    },
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchQuery === '' ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getUserStats = (userEmail) => {
    const userRides = rides.filter(r => r.rider_email === userEmail);
    const completedRides = userRides.filter(r => r.status === 'completed');
    const totalSpent = completedRides.reduce((sum, r) => sum + (r.fare || 0), 0);
    
    return {
      totalRides: userRides.length,
      completedRides: completedRides.length,
      totalSpent,
      lastRide: userRides.length > 0 ? userRides[0].created_date : null,
    };
  };

  const adminCount = users.filter(u => u.role === 'admin').length;
  const userCount = users.filter(u => u.role === 'user').length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-xs text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{adminCount}</p>
                <p className="text-xs text-muted-foreground">Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{userCount}</p>
                <p className="text-xs text-muted-foreground">Riders</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center">
                <Activity className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{rides.length}</p>
                <p className="text-xs text-muted-foreground">Total Rides</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by email or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={roleFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setRoleFilter('all')}
          >
            All
          </Button>
          <Button
            variant={roleFilter === 'admin' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setRoleFilter('admin')}
          >
            Admin
          </Button>
          <Button
            variant={roleFilter === 'user' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setRoleFilter('user')}
          >
            User
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Directory</CardTitle>
          <CardDescription>Manage user accounts and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-full divide-y divide-border">
              <div className="grid grid-cols-12 gap-3 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <div className="col-span-3">User</div>
                <div className="col-span-2">Role</div>
                <div className="col-span-2">Activity</div>
                <div className="col-span-3">Stats</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
              <div className="divide-y divide-border">
                {filteredUsers.map(user => {
                  const stats = getUserStats(user.email);
                  return (
                    <div key={user.id} className="grid grid-cols-12 gap-3 px-4 py-4 items-center">
                      <div className="col-span-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">
                              {user.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{user.full_name || 'No name'}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <Badge
                          variant={user.role === 'admin' ? 'default' : 'outline'}
                          className="capitalize"
                        >
                          {user.role}
                        </Badge>
                      </div>
                      <div className="col-span-2">
                        <div className="text-xs">
                          <p className="text-muted-foreground">
                            {stats.totalRides} rides
                          </p>
                          {stats.lastRide && (
                            <p className="text-muted-foreground">
                              Last: {format(new Date(stats.lastRide), 'MMM d')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="col-span-3">
                        <div className="flex items-center gap-2 text-xs">
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-green-500" />
                            <span className="text-muted-foreground">
                              ${stats.totalSpent.toFixed(0)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="col-span-2 flex justify-end gap-2">
                        {user.role !== 'admin' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateUserRole.mutate({
                              userId: user.id,
                              role: 'admin',
                            })}
                          >
                            <Shield className="w-3 h-3" />
                            Make Admin
                          </Button>
                        )}
                        {user.role === 'admin' && adminCount > 1 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateUserRole.mutate({
                              userId: user.id,
                              role: 'user',
                            })}
                          >
                            <Users className="w-3 h-3" />
                            Remove Admin
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <div className="px-4 py-12 text-center text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No users found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}