import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Building, 
  Eye, 
  Edit,
  MapPin, 
  Phone,
  Users,
  Calendar,
  ExternalLink,
  CheckCircle,
  Trash2,
  AlertTriangle
} from 'lucide-react';

interface ApprovedClub {
  id: string;
  user_id: string;
  club_name: string;
  address: string;
  district: string;
  city: string;
  phone: string;
  opening_time: string;
  closing_time: string;
  table_count: number;
  table_types: string[];
  basic_price: number;
  normal_hour_price?: number;
  peak_hour_price?: number;
  weekend_price?: number;
  vip_table_price?: number;
  amenities: Record<string, boolean>;
  photos: string[];
  facebook_url?: string;
  google_maps_url?: string;
  business_license_url?: string;
  manager_name?: string;
  manager_phone?: string;
  email?: string;
  status: 'approved';
  approved_at: string;
  approved_by: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    display_name: string;
    full_name: string;
    email: string;
  };
}

const AdminApprovedClubs = () => {
  const { user } = useAuth();
  const [clubs, setClubs] = useState<ApprovedClub[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClub, setSelectedClub] = useState<ApprovedClub | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchApprovedClubs();
    
    // Set up real-time subscription for approved clubs
    console.log('Setting up real-time subscription for approved clubs');
    const channel = supabase
      .channel('admin-approved-clubs')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'club_registrations'
      }, (payload) => {
        console.log('Real-time approved club update:', payload);
        
        if (payload.eventType === 'UPDATE' && payload.new.status === 'approved') {
          // Add newly approved club to the list
          const approvedClub = payload.new as ApprovedClub;
          setClubs(prev => [approvedClub, ...prev]);
          toast.success(`CLB "${approvedClub.club_name}" vừa được duyệt!`);
        } else if (payload.eventType === 'UPDATE' && payload.old.status === 'approved' && payload.new.status !== 'approved') {
          // Remove club from approved list if status changed
          setClubs(prev => prev.filter(club => club.user_id !== payload.new.user_id));
        } else if (payload.eventType === 'DELETE' && payload.old.status === 'approved') {
          // Remove deleted club from list
          setClubs(prev => prev.filter(club => club.user_id !== payload.old.user_id));
          toast.info(`CLB "${payload.old.club_name}" đã được xóa khỏi hệ thống`);
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'club_profiles'
      }, (payload) => {
        console.log('Real-time club_profiles update:', payload);
        
        if (payload.eventType === 'DELETE') {
          // Remove deleted club from list
          setClubs(prev => prev.filter(club => club.id !== payload.old.id));
          toast.info(`CLB đã được xóa khỏi hệ thống`);
        }
      })
      .subscribe();

    return () => {
      console.log('Cleaning up approved clubs subscription');
      supabase.removeChannel(channel);
    };
  }, []);

  const deleteClub = async (club: ApprovedClub) => {
    if (!user?.id) {
      toast.error('Không thể xác thực người dùng');
      return;
    }

    console.log('🗑️ Starting to delete club:', club.id, club.club_name);
    setDeleting(club.id);
    
    try {
      // Remove from local state immediately for better UX
      const clubsBeforeDelete = clubs.length;
      setClubs(prev => {
        const filtered = prev.filter(c => c.id !== club.id);
        console.log('🔄 Removed from UI. Before:', clubsBeforeDelete, 'After:', filtered.length);
        return filtered;
      });
      
      console.log('🚀 Calling delete_club_completely function...');
      const { data, error } = await supabase.rpc('delete_club_completely', {
        club_profile_id: club.id,
        admin_id: user.id
      });

      if (error) {
        console.error('❌ Delete club RPC error:', error);
        // Restore the club to list if deletion failed
        console.log('🔄 Restoring club to list due to error');
        await fetchApprovedClubs();
        throw new Error(`Lỗi xóa CLB: ${error.message}`);
      }

      const result = data as { success: boolean; error?: string; club_name?: string; message?: string };
      console.log('✅ Delete function result:', result);
      
      if (!result.success) {
        console.error('❌ Delete function returned failure:', result.error);
        // Restore the club to list if deletion failed
        console.log('🔄 Restoring club to list due to function failure');
        await fetchApprovedClubs();
        throw new Error(result.error || 'Xóa CLB thất bại');
      }

      console.log('🎉 Club deleted successfully:', result.club_name);
      toast.success(`Đã xóa thành công CLB "${result.club_name}"`);
      
      // Double check by refreshing the list
      console.log('🔄 Refreshing approved clubs list to confirm deletion...');
      setTimeout(() => {
        fetchApprovedClubs();
      }, 1000);
      
    } catch (error: any) {
      console.error('💥 Error deleting club:', error);
      toast.error(error.message || 'Có lỗi xảy ra khi xóa CLB');
    } finally {
      setDeleting(null);
    }
  };

  const fetchApprovedClubs = async () => {
    console.log('🔍 Fetching approved clubs...');
    setLoading(true);
    
    try {
      const { data: clubs, error } = await supabase
        .from('club_registrations')
        .select('*')
        .eq('status', 'approved')
        .order('approved_at', { ascending: false });

      if (error) {
        console.error('❌ Club query error:', error);
        toast.error('Không thể tải danh sách CLB đã duyệt: ' + error.message);
        return;
      }

      console.log('📋 Raw approved clubs from DB:', clubs?.map(c => ({id: c.id, name: c.club_name, status: c.status})));

      // Get user info for approved clubs
      let clubsWithUsers = clubs || [];
      if (clubs && clubs.length > 0) {
        const userIds = [...new Set(clubs.map(c => c.user_id).filter(Boolean))];
        
        if (userIds.length > 0) {
          const { data: users, error: usersError } = await supabase
            .from('profiles')
            .select('user_id, display_name, full_name, phone')
            .in('user_id', userIds);

          if (usersError) {
            console.error('❌ Users query error:', usersError);
          } else {
            clubsWithUsers = clubs.map(club => ({
              ...club,
              profiles: users?.find(u => u.user_id === club.user_id) || null
            }));
          }
        }
      }
      
      const finalClubs = clubsWithUsers.map(item => ({
        ...item,
        amenities: (item.amenities as Record<string, boolean>) || {},
        status: 'approved' as const
      }));
      
      console.log('📋 Final approved clubs to display:', finalClubs.map(c => ({id: c.id, name: c.club_name})));
      setClubs(finalClubs);
    } catch (error: any) {
      console.error('💥 Error fetching approved clubs:', error);
      toast.error('Lỗi khi tải danh sách CLB đã duyệt: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price?: number) => {
    if (!price) return 'Chưa đặt';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const getAmenityLabels = (amenities: Record<string, boolean>) => {
    const labels: Record<string, string> = {
      wifi: 'WiFi miễn phí',
      car_parking: 'Chỗ đậu xe ô tô',
      bike_parking: 'Chỗ đậu xe máy',
      canteen: 'Căn tin/Đồ ăn',
      air_conditioning: 'Máy lạnh',
      vip_room: 'Phòng VIP riêng',
      equipment_rental: 'Cho thuê dụng cụ',
      coach: 'Có HLV/Coach'
    };

    return Object.entries(amenities)
      .filter(([_, value]) => value)
      .map(([key, _]) => labels[key])
      .filter(Boolean);
  };

  const filteredClubs = clubs.filter(club =>
    club.club_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    club.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    club.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Câu lạc bộ đã duyệt</h2>
          <p className="text-gray-600">Quản lý các câu lạc bộ đã được phê duyệt</p>
        </div>
        <div className="flex gap-3 items-center">
          <Input
            placeholder="Tìm kiếm CLB..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
          <Button onClick={fetchApprovedClubs} variant="outline" disabled={loading}>
            🔄 Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tổng CLB đã duyệt</p>
                <p className="text-2xl font-bold">{clubs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Duyệt hôm nay</p>
                <p className="text-2xl font-bold">
                  {clubs.filter(c => 
                    new Date(c.approved_at).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tổng số bàn</p>
                <p className="text-2xl font-bold">
                  {clubs.reduce((sum, club) => sum + club.table_count, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Club List */}
      <div className="grid gap-4">
        {filteredClubs.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Building className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">
                {searchQuery ? 'Không tìm thấy CLB nào' : 'Chưa có CLB nào được duyệt'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredClubs.map((club) => (
            <Card key={club.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Building className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-semibold">{club.club_name}</h3>
                      <Badge className="bg-green-100 text-green-800">Đã duyệt</Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span>{club.address}, {club.district}, {club.city}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span>{club.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-gray-500" />
                          <span>{club.table_count} bàn - {club.table_types.join(', ')}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span>Duyệt: {new Date(club.approved_at).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Chủ CLB:</span> {club.profiles?.display_name || club.profiles?.full_name}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Giá cơ bản:</span> {formatPrice(club.basic_price)}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedClub(club)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Xem chi tiết
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Building className="w-5 h-5" />
                              {club.club_name}
                              <Badge className="bg-green-100 text-green-800">Đã duyệt</Badge>
                            </DialogTitle>
                          </DialogHeader>
                          
                          {selectedClub && (
                            <div className="space-y-6">
                              {/* Basic Info */}
                              <div>
                                <h4 className="font-semibold mb-3">Thông tin cơ bản</h4>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   <div>
                                     <label className="text-sm font-medium text-gray-700">Tên câu lạc bộ</label>
                                     <p className="text-sm">{selectedClub.club_name}</p>
                                   </div>
                                   <div>
                                     <label className="text-sm font-medium text-gray-700">Số điện thoại</label>
                                     <p className="text-sm">{selectedClub.phone}</p>
                                   </div>
                                   <div>
                                     <label className="text-sm font-medium text-gray-700">Email</label>
                                     <p className="text-sm">{selectedClub.email || 'Không có'}</p>
                                   </div>
                                   <div>
                                     <label className="text-sm font-medium text-gray-700">Người quản lý</label>
                                     <p className="text-sm">{selectedClub.manager_name || 'Không có'}</p>
                                   </div>
                                   <div>
                                     <label className="text-sm font-medium text-gray-700">SĐT người quản lý</label>
                                     <p className="text-sm">{selectedClub.manager_phone || 'Không có'}</p>
                                   </div>
                                   <div className="md:col-span-2">
                                     <label className="text-sm font-medium text-gray-700">Địa chỉ đầy đủ</label>
                                     <p className="text-sm">{selectedClub.address}, {selectedClub.district}, {selectedClub.city}</p>
                                   </div>
                                   <div>
                                     <label className="text-sm font-medium text-gray-700">Giờ hoạt động</label>
                                     <p className="text-sm">{selectedClub.opening_time} - {selectedClub.closing_time}</p>
                                   </div>
                                   <div>
                                     <label className="text-sm font-medium text-gray-700">Số bàn & loại bàn</label>
                                     <p className="text-sm">{selectedClub.table_count} bàn ({selectedClub.table_types.join(', ')})</p>
                                   </div>
                                 </div>
                              </div>

                               {/* Pricing */}
                               <div>
                                 <h4 className="font-semibold mb-3">Bảng giá</h4>
                                 <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                   <div>
                                     <label className="text-sm font-medium text-gray-700">Giá cơ bản</label>
                                     <p className="text-sm">{formatPrice(selectedClub.basic_price)}</p>
                                   </div>
                                   <div>
                                     <label className="text-sm font-medium text-gray-700">Giờ thường</label>
                                     <p className="text-sm">{formatPrice(selectedClub.normal_hour_price)}</p>
                                   </div>
                                   <div>
                                     <label className="text-sm font-medium text-gray-700">Giờ vàng</label>
                                     <p className="text-sm">{formatPrice(selectedClub.peak_hour_price)}</p>
                                   </div>
                                   <div>
                                     <label className="text-sm font-medium text-gray-700">Cuối tuần</label>
                                     <p className="text-sm">{formatPrice(selectedClub.weekend_price)}</p>
                                   </div>
                                   <div>
                                     <label className="text-sm font-medium text-gray-700">Bàn VIP</label>
                                     <p className="text-sm">{formatPrice(selectedClub.vip_table_price)}</p>
                                   </div>
                                 </div>
                               </div>

                               {/* Links & Documents */}
                               <div>
                                 <h4 className="font-semibold mb-3">Liên kết & Tài liệu</h4>
                                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                   <div>
                                     <label className="text-sm font-medium text-gray-700">Facebook</label>
                                     {selectedClub.facebook_url ? (
                                       <a 
                                         href={selectedClub.facebook_url} 
                                         target="_blank" 
                                         rel="noopener noreferrer"
                                         className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                       >
                                         <ExternalLink className="w-3 h-3" />
                                         Xem trang Facebook
                                       </a>
                                     ) : (
                                       <p className="text-sm text-gray-500">Không có</p>
                                     )}
                                   </div>
                                   <div>
                                     <label className="text-sm font-medium text-gray-700">Google Maps</label>
                                     {selectedClub.google_maps_url ? (
                                       <a 
                                         href={selectedClub.google_maps_url} 
                                         target="_blank" 
                                         rel="noopener noreferrer"
                                         className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                       >
                                         <ExternalLink className="w-3 h-3" />
                                         Xem trên Google Maps
                                       </a>
                                     ) : (
                                       <p className="text-sm text-gray-500">Không có</p>
                                     )}
                                   </div>
                                   <div>
                                     <label className="text-sm font-medium text-gray-700">Giấy phép kinh doanh</label>
                                     {selectedClub.business_license_url ? (
                                       <a 
                                         href={selectedClub.business_license_url} 
                                         target="_blank" 
                                         rel="noopener noreferrer"
                                         className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                       >
                                         <ExternalLink className="w-3 h-3" />
                                         Xem giấy phép
                                       </a>
                                     ) : (
                                       <p className="text-sm text-gray-500">Không có</p>
                                     )}
                                   </div>
                                 </div>
                               </div>

                               {/* Amenities */}
                               <div>
                                 <h4 className="font-semibold mb-3">Tiện ích</h4>
                                 <div className="flex flex-wrap gap-2">
                                   {getAmenityLabels(selectedClub.amenities).length > 0 ? (
                                     getAmenityLabels(selectedClub.amenities).map((amenity) => (
                                       <Badge key={amenity} variant="outline">{amenity}</Badge>
                                     ))
                                   ) : (
                                     <p className="text-sm text-gray-500">Không có tiện ích nào được đăng ký</p>
                                   )}
                                 </div>
                               </div>

                               {/* Photos */}
                               <div>
                                 <h4 className="font-semibold mb-3">Hình ảnh câu lạc bộ</h4>
                                 {selectedClub.photos && selectedClub.photos.length > 0 ? (
                                   <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                     {selectedClub.photos.map((photo, index) => (
                                       <div key={index} className="relative">
                                         <img
                                           src={photo}
                                           alt={`Club photo ${index + 1}`}
                                           className="w-full h-32 object-cover rounded-lg border hover:scale-105 transition-transform cursor-pointer"
                                           onClick={() => window.open(photo, '_blank')}
                                         />
                                         <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                                           {index + 1}/{selectedClub.photos.length}
                                         </div>
                                       </div>
                                     ))}
                                   </div>
                                 ) : (
                                   <p className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg text-center">
                                     Không có hình ảnh nào được tải lên
                                   </p>
                                 )}
                               </div>

                              {/* Approval Info */}
                              <div className="p-4 bg-green-50 rounded-lg">
                                <h4 className="font-semibold text-green-900 mb-2">Thông tin phê duyệt</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="font-medium text-green-800">Ngày duyệt:</span>
                                    <p className="text-green-700">{new Date(selectedClub.approved_at).toLocaleString('vi-VN')}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-green-800">Trạng thái:</span>
                                    <p className="text-green-700">Đã phê duyệt và đang hoạt động</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            disabled={deleting === club.id}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {deleting === club.id ? 'Đang xóa...' : 'Xóa CLB'}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                              <AlertTriangle className="w-5 h-5 text-red-600" />
                              Xác nhận xóa CLB
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              <div className="space-y-2">
                                <p>Bạn có chắc chắn muốn xóa CLB <strong>"{club.club_name}"</strong>?</p>
                                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                                  <p className="text-sm text-red-800 font-medium mb-1">⚠️ Cảnh báo:</p>
                                  <ul className="text-sm text-red-700 space-y-1">
                                    <li>• Tất cả dữ liệu của CLB sẽ bị xóa vĩnh viễn</li>
                                    <li>• Bao gồm: thống kê, thành viên, giải đấu, trận đấu</li>
                                    <li>• Không thể hoàn tác sau khi xóa</li>
                                    <li>• Tài khoản chủ CLB sẽ được đặt lại về vai trò người chơi</li>
                                  </ul>
                                </div>
                              </div>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteClub(club)}
                              className="bg-red-600 hover:bg-red-700"
                              disabled={deleting === club.id}
                            >
                              {deleting === club.id ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminApprovedClubs;