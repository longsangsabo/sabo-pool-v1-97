import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Building, 
  Eye, 
  Check, 
  X, 
  Clock, 
  MapPin, 
  Phone,
  Users,
  Calendar,
  ExternalLink
} from 'lucide-react';

interface ClubRegistration {
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
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    display_name: string;
    full_name: string;
    email: string;
  };
}

const AdminClubRegistrations = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<ClubRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegistration, setSelectedRegistration] = useState<ClubRegistration | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRegistrations();
    
    // Set up real-time subscription for club registrations
    console.log('Setting up real-time subscription for club registrations');
    const channel = supabase
      .channel('admin-club-registrations')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'club_registrations'
      }, (payload) => {
        console.log('Real-time club registration update:', payload);
        
        if (payload.eventType === 'INSERT') {
          // Add new registration to the list
          const newRegistration = payload.new as ClubRegistration;
          setRegistrations(prev => [newRegistration, ...prev]);
          toast.info(`Đăng ký CLB mới: ${newRegistration.club_name}`);
        } else if (payload.eventType === 'UPDATE') {
          // Update existing registration
          const updatedRegistration = payload.new as ClubRegistration;
          setRegistrations(prev => 
            prev.map(reg => 
              reg.id === updatedRegistration.id ? updatedRegistration : reg
            )
          );
          
          // Show status change notification
          if (payload.old?.status !== payload.new?.status) {
            const statusText = payload.new?.status === 'approved' ? 'đã duyệt' : 
                              payload.new?.status === 'rejected' ? 'bị từ chối' : payload.new?.status;
            toast.success(`CLB "${updatedRegistration.club_name}" ${statusText}`);
          }
        } else if (payload.eventType === 'DELETE') {
          // Remove registration from list
          const deletedId = payload.old?.id;
          setRegistrations(prev => prev.filter(reg => reg.id !== deletedId));
        }
      })
      .subscribe();

    return () => {
      console.log('Cleaning up club registrations subscription');
      supabase.removeChannel(channel);
    };
  }, [statusFilter]);

  // Debug effect to check registrations table
  useEffect(() => {
    const debugCheck = async () => {
      console.log('🔍 Checking club_registrations table...');
      
      const { data, error, count } = await supabase
        .from('club_registrations')
        .select('*', { count: 'exact' });
      
      console.log('Total registrations:', count);
      console.log('Data:', data);
      console.log('Error:', error);
    };
    
    debugCheck();
  }, []);

  const fetchRegistrations = async () => {
    console.log('🔍 Admin accessing club panel, filtering by:', statusFilter);
    setLoading(true);
    
    try {
      // Simple query without joins first  
      let query = supabase
        .from('club_registrations')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply status filter - only filter if not 'all'
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data: clubs, error } = await query;

      if (error) {
        console.error('Club query error:', error);
        toast.error('Không thể tải danh sách CLB: ' + error.message);
        return;
      }

      console.log('📋 Found clubs with filter:', statusFilter, 'Count:', clubs?.length || 0);
      console.log('Club statuses:', clubs?.map(c => c.status));

      // If we have clubs, get user info separately
      let clubsWithUsers = clubs || [];
      if (clubs && clubs.length > 0) {
        const userIds = [...new Set(clubs.map(c => c.user_id).filter(Boolean))];
        
        if (userIds.length > 0) {
          const { data: users, error: usersError } = await supabase
            .from('profiles')
            .select('user_id, display_name, full_name, phone')
            .in('user_id', userIds);

          if (usersError) {
            console.error('Users query error:', usersError);
          } else {
            // Merge user data with clubs
            clubsWithUsers = clubs.map(club => ({
              ...club,
              profiles: users?.find(u => u.user_id === club.user_id) || null
            }));
          }
        }
      }
      
      setRegistrations(clubsWithUsers.map(item => ({
        ...item,
        amenities: (item.amenities as Record<string, boolean>) || {},
        status: item.status as 'draft' | 'pending' | 'approved' | 'rejected'
      })));
    } catch (error: any) {
      console.error('Error fetching registrations:', error);
      toast.error('Lỗi khi tải danh sách đăng ký: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const approveRegistration = async (registration: ClubRegistration) => {
    console.log('✅ Starting approval for club:', registration.club_name);
    setProcessing(true);
    
    try {
      // Use the new database function for atomic approval
      const { data, error } = await supabase.rpc('approve_club_registration', {
        registration_id: registration.id,
        approver_id: user?.id,
        approved: true,
        comments: null
      });

      if (error) {
        console.error('❌ Approval function error:', error);
        throw new Error(`Lỗi duyệt đăng ký: ${error.message}`);
      }

      const result = data as { success: boolean; error?: string; club_name?: string };
      
      if (!result.success) {
        throw new Error(result.error || 'Approval failed');
      }

      console.log('🎉 Club approval completed successfully!');
      toast.success(`Đã duyệt thành công câu lạc bộ "${result.club_name}"!`);
      
      // Refresh the list to show updated status
      await fetchRegistrations();
      setSelectedRegistration(null);
      
    } catch (error: any) {
      console.error('💥 Error during club approval:', error);
      toast.error(`Lỗi khi duyệt đăng ký: ${error.message || 'Unknown error'}`);
    } finally {
      setProcessing(false);
    }
  };

  const rejectRegistration = async (registration: ClubRegistration) => {
    if (!rejectionReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }

    console.log('❌ Rejecting club:', registration.club_name, 'Reason:', rejectionReason);
    setProcessing(true);
    
    try {
      // Use the new database function for atomic rejection
      const { data, error } = await supabase.rpc('approve_club_registration', {
        registration_id: registration.id,
        approver_id: user?.id,
        approved: false,
        comments: rejectionReason
      });

      if (error) {
        console.error('❌ Rejection function error:', error);
        throw new Error(`Lỗi từ chối đăng ký: ${error.message}`);
      }

      const result = data as { success: boolean; error?: string; club_name?: string };
      
      if (!result.success) {
        throw new Error(result.error || 'Rejection failed');
      }

      console.log('❌ Club rejected successfully:', result.club_name);
      toast.success(`Đã từ chối đăng ký câu lạc bộ "${result.club_name}"`);
      setRejectionReason('');
      await fetchRegistrations();
      setSelectedRegistration(null);
    } catch (error: any) {
      console.error('Error rejecting registration:', error);
      toast.error('Lỗi khi từ chối đăng ký: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Đã duyệt</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Bị từ chối</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Chờ duyệt</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Bản nháp</Badge>;
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
          <h2 className="text-xl font-bold">Quản lý đăng ký câu lạc bộ</h2>
          <p className="text-gray-600">Xét duyệt các yêu cầu đăng ký câu lạc bộ ({registrations.length} đăng ký)</p>
          {statusFilter !== 'all' && (
            <p className="text-sm text-blue-600">Đang lọc: {
              statusFilter === 'pending' ? 'Chờ duyệt' :
              statusFilter === 'approved' ? 'Đã duyệt' :
              statusFilter === 'rejected' ? 'Bị từ chối' : 'Bản nháp'
            }</p>
          )}
        </div>
        <div className="flex gap-3 items-center">
          <Button onClick={fetchRegistrations} variant="outline" disabled={loading}>
            🔄 Refresh danh sách
          </Button>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả ({registrations.length})</SelectItem>
              <SelectItem value="pending">Chờ duyệt ({registrations.filter(r => r.status === 'pending').length})</SelectItem>
              <SelectItem value="approved">Đã duyệt ({registrations.filter(r => r.status === 'approved').length})</SelectItem>
              <SelectItem value="rejected">Bị từ chối ({registrations.filter(r => r.status === 'rejected').length})</SelectItem>
              <SelectItem value="draft">Bản nháp ({registrations.filter(r => r.status === 'draft').length})</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Registration List */}
      <div className="grid gap-4">
        {registrations.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Building className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Không có đăng ký nào</p>
            </CardContent>
          </Card>
        ) : (
          registrations.map((registration) => (
            <Card key={registration.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Building className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-semibold">{registration.club_name}</h3>
                      {getStatusBadge(registration.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span>{registration.address}, {registration.district}, {registration.city}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span>{registration.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-gray-500" />
                          <span>{registration.table_count} bàn - {registration.table_types.join(', ')}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span>{registration.opening_time} - {registration.closing_time}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span>{new Date(registration.created_at).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Người đăng ký:</span> {registration.profiles?.display_name || registration.profiles?.full_name}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedRegistration(registration)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Xem chi tiết
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Building className="w-5 h-5" />
                              {registration.club_name}
                              {getStatusBadge(registration.status)}
                            </DialogTitle>
                          </DialogHeader>
                          
                          {selectedRegistration && (
                            <div className="space-y-6">
                              {/* Basic Info */}
                              <div>
                                <h4 className="font-semibold mb-3">Thông tin cơ bản</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Tên câu lạc bộ</label>
                                    <p className="text-sm">{selectedRegistration.club_name}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Số điện thoại</label>
                                    <p className="text-sm">{selectedRegistration.phone}</p>
                                  </div>
                                  <div className="md:col-span-2">
                                    <label className="text-sm font-medium text-gray-700">Địa chỉ</label>
                                    <p className="text-sm">{selectedRegistration.address}, {selectedRegistration.district}, {selectedRegistration.city}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Giờ hoạt động</label>
                                    <p className="text-sm">{selectedRegistration.opening_time} - {selectedRegistration.closing_time}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Số bàn & loại</label>
                                    <p className="text-sm">{selectedRegistration.table_count} bàn ({selectedRegistration.table_types.join(', ')})</p>
                                  </div>
                                </div>
                              </div>

                              {/* Pricing */}
                              <div>
                                <h4 className="font-semibold mb-3">Bảng giá</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Giá cơ bản</label>
                                    <p className="text-sm">{formatPrice(selectedRegistration.basic_price)}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Giờ thường</label>
                                    <p className="text-sm">{formatPrice(selectedRegistration.normal_hour_price)}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Giờ vàng</label>
                                    <p className="text-sm">{formatPrice(selectedRegistration.peak_hour_price)}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Cuối tuần</label>
                                    <p className="text-sm">{formatPrice(selectedRegistration.weekend_price)}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Amenities */}
                              <div>
                                <h4 className="font-semibold mb-3">Tiện ích</h4>
                                <div className="flex flex-wrap gap-2">
                                  {getAmenityLabels(selectedRegistration.amenities).map((amenity) => (
                                    <Badge key={amenity} variant="outline">{amenity}</Badge>
                                  ))}
                                </div>
                              </div>

                              {/* Photos */}
                              {selectedRegistration.photos.length > 0 && (
                                <div>
                                  <h4 className="font-semibold mb-3">Hình ảnh câu lạc bộ</h4>
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {selectedRegistration.photos.map((photo, index) => (
                                      <div key={index} className="relative">
                                        <img
                                          src={photo}
                                          alt={`Club photo ${index + 1}`}
                                          className="w-full h-32 object-cover rounded-lg border hover:scale-105 transition-transform cursor-pointer"
                                          onClick={() => window.open(photo, '_blank')}
                                        />
                                        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                                          {index + 1}/{selectedRegistration.photos.length}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Business License */}
                              {selectedRegistration.business_license_url && (
                                <div>
                                  <h4 className="font-semibold mb-3">Giấy phép kinh doanh</h4>
                                  <div className="border rounded-lg p-4 bg-blue-50">
                                    <div className="flex items-center gap-3">
                                      <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                      </div>
                                      <div className="flex-1">
                                        <p className="font-medium text-blue-900">Giấy phép kinh doanh</p>
                                        <p className="text-sm text-blue-700">Nhấn để xem giấy phép</p>
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.open(selectedRegistration.business_license_url, '_blank')}
                                        className="shrink-0"
                                      >
                                        <ExternalLink className="w-4 h-4 mr-2" />
                                        Xem file
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Google Maps URL */}
                              {selectedRegistration.google_maps_url && (
                                <div>
                                  <h4 className="font-semibold mb-3">Vị trí trên bản đồ</h4>
                                  <div className="border rounded-lg p-4 bg-green-50">
                                    <div className="flex items-center gap-3">
                                      <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center">
                                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                      </div>
                                      <div className="flex-1">
                                        <p className="font-medium text-green-900">Vị trí Google Maps</p>
                                        <p className="text-sm text-green-700">Xem vị trí chính xác của câu lạc bộ</p>
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.open(selectedRegistration.google_maps_url, '_blank')}
                                        className="shrink-0"
                                      >
                                        <ExternalLink className="w-4 h-4 mr-2" />
                                        Mở Maps
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Contact Info */}
                              <div>
                                <h4 className="font-semibold mb-3">Thông tin liên hệ</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Người quản lý</label>
                                    <p className="text-sm">{selectedRegistration.manager_name}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Số điện thoại quản lý</label>
                                    <p className="text-sm">{selectedRegistration.manager_phone}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Email</label>
                                    <p className="text-sm">{selectedRegistration.email}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Facebook</label>
                                    {selectedRegistration.facebook_url ? (
                                      <a 
                                        href={selectedRegistration.facebook_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                                      >
                                        Xem trang Facebook <ExternalLink className="w-3 h-3" />
                                      </a>
                                    ) : (
                                      <p className="text-sm text-gray-500">Chưa cung cấp</p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              {selectedRegistration.status === 'pending' && (
                                <div className="space-y-4 pt-4 border-t">
                                  <div className="flex gap-4">
                                    <Button
                                      onClick={() => approveRegistration(selectedRegistration)}
                                      disabled={processing}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <Check className="w-4 h-4 mr-2" />
                                      {processing ? 'Đang duyệt...' : 'Duyệt đăng ký'}
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      onClick={() => rejectRegistration(selectedRegistration)}
                                      disabled={processing || !rejectionReason.trim()}
                                    >
                                      <X className="w-4 h-4 mr-2" />
                                      {processing ? 'Đang từ chối...' : 'Từ chối'}
                                    </Button>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Lý do từ chối (bắt buộc nếu từ chối)
                                    </label>
                                    <Textarea
                                      value={rejectionReason}
                                      onChange={(e) => setRejectionReason(e.target.value)}
                                      placeholder="Nhập lý do từ chối..."
                                      className="min-h-[80px]"
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Rejection Reason */}
                              {selectedRegistration.status === 'rejected' && selectedRegistration.rejection_reason && (
                                <div className="p-4 bg-red-50 rounded-lg">
                                  <h4 className="font-semibold text-red-900 mb-2">Lý do từ chối:</h4>
                                  <p className="text-red-800 text-sm">{selectedRegistration.rejection_reason}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      {registration.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => approveRegistration(registration)}
                            disabled={processing}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Duyệt
                          </Button>
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                <X className="w-4 h-4 mr-2" />
                                Từ chối
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Từ chối đăng ký</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <p>Bạn có chắc chắn muốn từ chối đăng ký câu lạc bộ "{registration.club_name}"?</p>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Lý do từ chối *
                                  </label>
                                  <Textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Nhập lý do từ chối..."
                                    className="min-h-[80px]"
                                  />
                                </div>
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    variant="destructive"
                                    onClick={() => rejectRegistration(registration)}
                                    disabled={processing || !rejectionReason.trim()}
                                  >
                                    {processing ? 'Đang từ chối...' : 'Từ chối'}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </>
                      )}
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

export default AdminClubRegistrations;