import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  UserCheck, 
  UserX, 
  Crown, 
  AlertTriangle,
  Shield,
  Activity,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface UserProfile {
  user_id: string;
  full_name: string;
  display_name: string;
  phone: string;
  email: string;
  role: string;
  ban_status: string;
  ban_reason: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
  city: string;
  district: string;
  avatar_url: string;
  verified_rank: string;
  membership_type: string;
  last_active: string;
}

export const UserManagementDashboard = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banReason, setBanReason] = useState('');

  // Fetch users with filtering
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users', searchQuery, statusFilter, roleFilter],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select(`
          user_id,
          full_name,
          display_name,
          phone,
          role,
          ban_status,
          ban_reason,
          is_admin,
          created_at,
          updated_at,
          city,
          district,
          avatar_url,
          verified_rank,
          membership_type
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (searchQuery) {
        query = query.or(`full_name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`);
      }

      if (statusFilter !== 'all') {
        if (statusFilter === 'active') {
          query = query.neq('ban_status', 'banned');
        } else {
          query = query.eq('ban_status', statusFilter);
        }
      }

      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as UserProfile[];
    }
  });

  // Simple user count instead of RPC function
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.ban_status !== 'banned').length;
  const bannedUsers = users.filter(u => u.ban_status === 'banned').length;
  const premiumUsers = users.filter(u => u.membership_type === 'premium').length;

  // Ban/unban user mutation
  const banUserMutation = useMutation({
    mutationFn: async ({ userId, banStatus, banReason }: {
      userId: string;
      banStatus: string;
      banReason?: string;
    }) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          ban_status: banStatus,
          ban_reason: banReason || null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      // Log admin action
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('admin_actions').insert({
          admin_id: user.id,
          target_user_id: userId,
          action_type: banStatus === 'banned' ? 'ban_user' : 'unban_user',
          action_details: { ban_status: banStatus, ban_reason: banReason },
          reason: banReason
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Cập nhật trạng thái người dùng thành công');
      setBanDialogOpen(false);
      setBanReason('');
      setSelectedUser(null);
    },
    onError: (error) => {
      console.error('Error updating user status:', error);
      toast.error('Lỗi khi cập nhật trạng thái người dùng');
    }
  });

  // Change role mutation
  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          role: role,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      // Log admin action
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('admin_actions').insert({
          admin_id: user.id,
          target_user_id: userId,
          action_type: 'change_role',
          action_details: { new_role: role },
          reason: `Changed role to ${role}`
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Cập nhật vai trò thành công');
    }
  });

  const handleBanUser = (user: UserProfile) => {
    setSelectedUser(user);
    setBanDialogOpen(true);
  };

  const confirmBanUser = () => {
    if (selectedUser) {
      banUserMutation.mutate({
        userId: selectedUser.user_id,
        banStatus: 'banned',
        banReason: banReason
      });
    }
  };

  const handleUnbanUser = (user: UserProfile) => {
    banUserMutation.mutate({
      userId: user.user_id,
      banStatus: 'active'
    });
  };

  const getStatusColor = (banStatus: string) => {
    switch (banStatus) {
      case 'banned': return 'destructive';
      case 'inactive': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusText = (banStatus: string) => {
    switch (banStatus) {
      case 'banned': return 'Bị cấm';
      case 'inactive': return 'Không hoạt động';
      default: return 'Hoạt động';
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Tổng người dùng</p>
                <p className="text-2xl font-bold">{totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Hoạt động</p>
                <p className="text-2xl font-bold">{activeUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserX className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Bị cấm</p>
                <p className="text-2xl font-bold">{bannedUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Premium</p>
                <p className="text-2xl font-bold">{premiumUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Quản lý người dùng</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Tìm kiếm theo tên, số điện thoại..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="active">Hoạt động</SelectItem>
                <SelectItem value="banned">Bị cấm</SelectItem>
                <SelectItem value="inactive">Không hoạt động</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả vai trò</SelectItem>
                <SelectItem value="player">Người chơi</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="club_owner">Chủ club</SelectItem>
                <SelectItem value="admin">Quản trị viên</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users List */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                Không tìm thấy người dùng nào
              </div>
            ) : (
              users.map((user) => (
                <div
                  key={user.user_id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback>
                        {user.full_name?.charAt(0) || user.display_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">
                          {user.full_name || user.display_name || 'Chưa cập nhật'}
                        </h3>
                        {user.is_admin && (
                          <Badge variant="secondary">
                            <Shield className="w-3 h-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                        {user.membership_type === 'premium' && (
                          <Badge variant="default">
                            <Crown className="w-3 h-3 mr-1" />
                            Premium
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>ID: {user.user_id.substring(0, 8)}...</p>
                        <p>SĐT: {user.phone || 'Chưa có'}</p>
                        <p>Thành phố: {user.city || 'Chưa cập nhật'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <Badge variant={getStatusColor(user.ban_status)}>
                        {getStatusText(user.ban_status)}
                      </Badge>
                      {user.ban_reason && (
                        <p className="text-xs text-red-500 mt-1">
                          {user.ban_reason}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      {user.ban_status === 'banned' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnbanUser(user)}
                          disabled={banUserMutation.isPending}
                        >
                          <UserCheck className="w-4 h-4 mr-1" />
                          Bỏ cấm
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBanUser(user)}
                          disabled={banUserMutation.isPending}
                        >
                          <UserX className="w-4 h-4 mr-1" />
                          Cấm
                        </Button>
                      )}
                      
                      <Select
                        value={user.role}
                        onValueChange={(role) => 
                          changeRoleMutation.mutate({ userId: user.user_id, role })
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="player">Player</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="club_owner">Club Owner</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ban User Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Cấm người dùng
            </DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn cấm người dùng "{selectedUser?.full_name || selectedUser?.display_name}"?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Textarea
              placeholder="Lý do cấm (bắt buộc)"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={confirmBanUser}
              disabled={!banReason.trim() || banUserMutation.isPending}
            >
              {banUserMutation.isPending ? 'Đang xử lý...' : 'Cấm người dùng'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};