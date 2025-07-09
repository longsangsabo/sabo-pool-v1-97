import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Users, 
  Calendar, 
  DollarSign,
  MapPin,
  Clock,
  Star,
  Plus,
  Edit3,
  Trash2,
  Eye,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Club {
  id: string;
  club_name: string;
  address: string;
  phone: string;
  user_id: string;
  verification_status: string;
  verification_notes?: string;
  verified_at?: string;
  verified_by?: string;
  number_of_tables: number;
  operating_hours?: any;
  created_at: string;
  updated_at: string;
}

interface ClubStats {
  id: string;
  club_id: string;
  month: number;
  year: number;
  active_members: number;
  total_matches_hosted: number;
  total_revenue: number;
  avg_trust_score: number;
  verified_members: number;
  peak_hours?: any;
}

export const ClubManagement = () => {
  const queryClient = useQueryClient();
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch user's clubs
  const { data: clubs, isLoading: clubsLoading } = useQuery({
    queryKey: ['user-clubs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('club_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Club[];
    }
  });

  // Fetch club stats
  const { data: clubStats } = useQuery({
    queryKey: ['club-stats', selectedClub?.id],
    queryFn: async () => {
      if (!selectedClub?.id) return null;
      
      const { data, error } = await supabase
        .from('club_stats')
        .select('*')
        .eq('club_id', selectedClub.id)
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .limit(12);

      if (error) throw error;
      return data as ClubStats[];
    },
    enabled: !!selectedClub?.id
  });

  // Update club mutation
  const updateClubMutation = useMutation({
    mutationFn: async (updates: Partial<Club>) => {
      if (!selectedClub?.id) throw new Error('No club selected');
      
      const { data, error } = await supabase
        .from('club_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedClub.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-clubs'] });
      setSelectedClub(data);
      setIsEditing(false);
      toast.success('Đã cập nhật thông tin câu lạc bộ');
    },
    onError: (error) => {
      console.error('Error updating club:', error);
      toast.error('Lỗi khi cập nhật thông tin');
    }
  });

  // Delete club mutation
  const deleteClubMutation = useMutation({
    mutationFn: async (clubId: string) => {
      const { error } = await supabase
        .from('club_profiles')
        .delete()
        .eq('id', clubId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-clubs'] });
      setSelectedClub(null);
      toast.success('Đã xóa câu lạc bộ');
    },
    onError: (error) => {
      console.error('Error deleting club:', error);
      toast.error('Lỗi khi xóa câu lạc bộ');
    }
  });

  const getVerificationStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  const getVerificationStatusText = (status: string) => {
    switch (status) {
      case 'verified': return 'Đã xác thực';
      case 'pending': return 'Chờ xác thực';
      case 'rejected': return 'Bị từ chối';
      default: return 'Chưa xác thực';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  if (clubsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Club List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Câu lạc bộ của tôi
          </CardTitle>
          <Button onClick={() => {/* Navigate to register club */}}>
            <Plus className="w-4 h-4 mr-2" />
            Đăng ký câu lạc bộ mới
          </Button>
        </CardHeader>

        <CardContent>
          {!clubs || clubs.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Bạn chưa có câu lạc bộ nào</p>
              <Button variant="outline" className="mt-4">
                Đăng ký câu lạc bộ đầu tiên
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clubs.map((club) => (
                <Card
                  key={club.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedClub?.id === club.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedClub(club)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold truncate">{club.club_name}</h3>
                        <Badge variant={getVerificationStatusColor(club.verification_status)}>
                          {getVerificationStatusText(club.verification_status)}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">{club.address}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>{club.number_of_tables} bàn</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {formatDistanceToNow(new Date(club.created_at), {
                              addSuffix: true,
                              locale: vi
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Club Details */}
      {selectedClub && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {selectedClub.club_name}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit3 className="w-4 h-4 mr-2" />
                {isEditing ? 'Hủy' : 'Chỉnh sửa'}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (confirm('Bạn có chắc chắn muốn xóa câu lạc bộ này?')) {
                    deleteClubMutation.mutate(selectedClub.id);
                  }
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">Thông tin</TabsTrigger>
                <TabsTrigger value="stats">Thống kê</TabsTrigger>
                <TabsTrigger value="members">Thành viên</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-6">
                {isEditing ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      updateClubMutation.mutate({
                        club_name: formData.get('club_name') as string,
                        address: formData.get('address') as string,
                        phone: formData.get('phone') as string,
                        number_of_tables: parseInt(formData.get('number_of_tables') as string)
                      });
                    }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="club_name">Tên câu lạc bộ</Label>
                        <Input
                          id="club_name"
                          name="club_name"
                          defaultValue={selectedClub.club_name}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Số điện thoại</Label>
                        <Input
                          id="phone"
                          name="phone"
                          defaultValue={selectedClub.phone}
                          required
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address">Địa chỉ</Label>
                        <Textarea
                          id="address"
                          name="address"
                          defaultValue={selectedClub.address}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="number_of_tables">Số bàn</Label>
                        <Input
                          id="number_of_tables"
                          name="number_of_tables"
                          type="number"
                          min="1"
                          defaultValue={selectedClub.number_of_tables}
                          required
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="submit" disabled={updateClubMutation.isPending}>
                        {updateClubMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">
                            Địa chỉ
                          </Label>
                          <p className="text-sm">{selectedClub.address}</p>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">
                            Số điện thoại
                          </Label>
                          <p className="text-sm">{selectedClub.phone}</p>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">
                            Số bàn
                          </Label>
                          <p className="text-sm">{selectedClub.number_of_tables} bàn</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">
                            Trạng thái xác thực
                          </Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={getVerificationStatusColor(selectedClub.verification_status)}>
                              {getVerificationStatusText(selectedClub.verification_status)}
                            </Badge>
                          </div>
                        </div>

                        {selectedClub.verification_notes && (
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">
                              Ghi chú xác thực
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              {selectedClub.verification_notes}
                            </p>
                          </div>
                        )}

                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">
                            Ngày tạo
                          </Label>
                          <p className="text-sm">
                            {formatDistanceToNow(new Date(selectedClub.created_at), {
                              addSuffix: true,
                              locale: vi
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="stats" className="space-y-6">
                {clubStats && clubStats.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {clubStats[0] && (
                      <>
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-primary" />
                              <div>
                                <p className="text-sm text-muted-foreground">Thành viên hoạt động</p>
                                <p className="text-2xl font-bold">{clubStats[0].active_members}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-primary" />
                              <div>
                                <p className="text-sm text-muted-foreground">Trận đấu</p>
                                <p className="text-2xl font-bold">{clubStats[0].total_matches_hosted}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-primary" />
                              <div>
                                <p className="text-sm text-muted-foreground">Doanh thu</p>
                                <p className="text-lg font-bold">
                                  {formatCurrency(clubStats[0].total_revenue)}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                              <Star className="w-4 h-4 text-primary" />
                              <div>
                                <p className="text-sm text-muted-foreground">Điểm tin cậy TB</p>
                                <p className="text-2xl font-bold">
                                  {clubStats[0].avg_trust_score.toFixed(1)}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-center p-8 text-muted-foreground">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Chưa có dữ liệu thống kê</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="members" className="space-y-6">
                <div className="text-center p-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Quản lý thành viên sẽ có trong phiên bản tiếp theo</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};