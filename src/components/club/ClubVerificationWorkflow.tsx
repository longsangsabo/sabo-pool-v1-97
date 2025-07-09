import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Camera, 
  MapPin,
  Phone,
  Calendar,
  User,
  Building
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ClubRegistration {
  id: string;
  club_name: string;
  address: string;
  phone: string;
  city: string;
  district: string;
  opening_time: string;
  closing_time: string;
  table_count: number;
  table_types: string[];
  basic_price: number;
  manager_name: string;
  manager_phone: string;
  email: string;
  status: string;
  created_at: string;
  photos: string[];
  business_license_url: string;
  google_maps_url: string;
  facebook_url: string;
  rejection_reason?: string;
}

interface VerificationStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  required: boolean;
}

const ClubVerificationWorkflow = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<ClubRegistration[]>([]);
  const [selectedRegistration, setSelectedRegistration] = useState<ClubRegistration | null>(null);
  const [loading, setLoading] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [verificationSteps, setVerificationSteps] = useState<VerificationStep[]>([]);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  useEffect(() => {
    if (selectedRegistration) {
      generateVerificationSteps(selectedRegistration);
    }
  }, [selectedRegistration]);

  const fetchRegistrations = async () => {
    try {
      const { data, error } = await supabase
        .from('club_registrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRegistrations(data || []);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast.error('Lỗi khi tải danh sách đăng ký');
    }
  };

  const generateVerificationSteps = (registration: ClubRegistration): void => {
    const steps: VerificationStep[] = [
      {
        id: 'basic_info',
        title: 'Thông tin cơ bản',
        description: 'Kiểm tra tên câu lạc bộ, địa chỉ, số điện thoại',
        status: registration.club_name && registration.address && registration.phone ? 'completed' : 'pending',
        required: true
      },
      {
        id: 'business_license',
        title: 'Giấy phép kinh doanh',
        description: 'Xác minh giấy phép kinh doanh hợp lệ',
        status: registration.business_license_url ? 'completed' : 'pending',
        required: true
      },
      {
        id: 'photos',
        title: 'Hình ảnh câu lạc bộ',
        description: 'Kiểm tra hình ảnh không gian, bàn bi-a',
        status: registration.photos && registration.photos.length >= 3 ? 'completed' : 'pending',
        required: true
      },
      {
        id: 'location',
        title: 'Vị trí địa lý',
        description: 'Xác minh địa chỉ và liên kết Google Maps',
        status: registration.google_maps_url ? 'completed' : 'pending',
        required: true
      },
      {
        id: 'contact_verification',
        title: 'Xác minh liên hệ',
        description: 'Gọi điện xác nhận thông tin với người quản lý',
        status: 'pending',
        required: true
      },
      {
        id: 'pricing',
        title: 'Giá cả hợp lý',
        description: 'Kiểm tra giá cả có phù hợp với thị trường',
        status: registration.basic_price > 0 ? 'completed' : 'pending',
        required: false
      },
      {
        id: 'social_presence',
        title: 'Mạng xã hội',
        description: 'Kiểm tra trang Facebook/Instagram (nếu có)',
        status: registration.facebook_url ? 'completed' : 'pending',
        required: false
      }
    ];

    setVerificationSteps(steps);
  };

  const updateStepStatus = (stepId: string, status: 'completed' | 'failed') => {
    setVerificationSteps(prev => 
      prev.map(step => 
        step.id === stepId ? { ...step, status } : step
      )
    );
  };

  const approveRegistration = async () => {
    if (!selectedRegistration) return;

    const requiredSteps = verificationSteps.filter(step => step.required);
    const completedRequired = requiredSteps.filter(step => step.status === 'completed');

    if (completedRequired.length < requiredSteps.length) {
      toast.error('Vui lòng hoàn thành tất cả các bước xác minh bắt buộc');
      return;
    }

    setLoading(true);
    try {
      // Update registration status
      const { error: updateError } = await supabase
        .from('club_registrations')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user?.id
        })
        .eq('id', selectedRegistration.id);

      if (updateError) throw updateError;

      // Create club profile
      const { error: profileError } = await supabase
        .from('club_profiles')
        .insert({
          user_id: selectedRegistration.user_id,
          club_name: selectedRegistration.club_name,
          address: selectedRegistration.address,
          phone: selectedRegistration.phone,
          verification_status: 'verified',
          verified_at: new Date().toISOString(),
          verified_by: user?.id,
          verification_notes: verificationNotes,
          number_of_tables: selectedRegistration.table_count,
          operating_hours: {
            opening: selectedRegistration.opening_time,
            closing: selectedRegistration.closing_time
          }
        });

      if (profileError) throw profileError;

      // Log approval action
      await supabase
        .from('approval_logs')
        .insert({
          registration_id: selectedRegistration.id,
          approver_id: user?.id,
          action: 'approved',
          comments: verificationNotes
        });

      toast.success('Đã phê duyệt câu lạc bộ thành công');
      await fetchRegistrations();
      setSelectedRegistration(null);
      setVerificationNotes('');
    } catch (error) {
      console.error('Error approving registration:', error);
      toast.error('Lỗi khi phê duyệt câu lạc bộ');
    }
    setLoading(false);
  };

  const rejectRegistration = async () => {
    if (!selectedRegistration || !verificationNotes.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('club_registrations')
        .update({
          status: 'rejected',
          rejection_reason: verificationNotes
        })
        .eq('id', selectedRegistration.id);

      if (error) throw error;

      // Log rejection action
      await supabase
        .from('approval_logs')
        .insert({
          registration_id: selectedRegistration.id,
          approver_id: user?.id,
          action: 'rejected',
          comments: verificationNotes
        });

      toast.success('Đã từ chối đăng ký câu lạc bộ');
      await fetchRegistrations();
      setSelectedRegistration(null);
      setVerificationNotes('');
    } catch (error) {
      console.error('Error rejecting registration:', error);
      toast.error('Lỗi khi từ chối đăng ký');
    }
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'approved': 'success',
      'rejected': 'destructive',
      'pending': 'warning',
      'draft': 'secondary'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status === 'approved' && 'Đã duyệt'}
        {status === 'rejected' && 'Đã từ chối'}
        {status === 'pending' && 'Chờ duyệt'}
        {status === 'draft' && 'Nháp'}
      </Badge>
    );
  };

  const completedSteps = verificationSteps.filter(step => step.status === 'completed').length;
  const totalSteps = verificationSteps.length;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Quy trình xác minh câu lạc bộ
          </CardTitle>
          <CardDescription>
            Quản lý và xác minh đăng ký câu lạc bộ mới
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Registration List */}
          <div className="space-y-4">
            <h3 className="font-semibold">Danh sách đăng ký ({registrations.length})</h3>
            <div className="grid gap-4">
              {registrations.map((registration) => (
                <div
                  key={registration.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedRegistration?.id === registration.id 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedRegistration(registration)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(registration.status)}
                      <div>
                        <h4 className="font-medium">{registration.club_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {registration.address}, {registration.district}, {registration.city}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(registration.status)}
                      <span className="text-xs text-muted-foreground">
                        {new Date(registration.created_at).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Verification Details */}
          {selectedRegistration && (
            <>
              <Separator className="my-6" />
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Chi tiết xác minh</h3>
                  <div className="flex items-center gap-2">
                    <Progress value={progress} className="w-32" />
                    <span className="text-sm text-muted-foreground">
                      {completedSteps}/{totalSteps}
                    </span>
                  </div>
                </div>

                {/* Club Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      <span className="font-medium">Thông tin câu lạc bộ</span>
                    </div>
                    <div className="pl-6 space-y-2">
                      <p><strong>Tên:</strong> {selectedRegistration.club_name}</p>
                      <p><strong>Địa chỉ:</strong> {selectedRegistration.address}</p>
                      <p><strong>Số bàn:</strong> {selectedRegistration.table_count}</p>
                      <p><strong>Giá cơ bản:</strong> {selectedRegistration.basic_price?.toLocaleString()} VNĐ/giờ</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span className="font-medium">Thông tin liên hệ</span>
                    </div>
                    <div className="pl-6 space-y-2">
                      <p><strong>Quản lý:</strong> {selectedRegistration.manager_name}</p>
                      <p><strong>Điện thoại:</strong> {selectedRegistration.phone}</p>
                      <p><strong>Email:</strong> {selectedRegistration.email}</p>
                      <p><strong>Giờ mở cửa:</strong> {selectedRegistration.opening_time} - {selectedRegistration.closing_time}</p>
                    </div>
                  </div>
                </div>

                {/* Verification Steps */}
                <div className="space-y-3">
                  <h4 className="font-medium">Các bước xác minh</h4>
                  <div className="space-y-2">
                    {verificationSteps.map((step) => (
                      <div
                        key={step.id}
                        className={`p-3 border rounded-lg ${
                          step.status === 'completed' ? 'bg-green-50 border-green-200' :
                          step.status === 'failed' ? 'bg-red-50 border-red-200' :
                          'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {step.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-500" />}
                            {step.status === 'failed' && <XCircle className="w-4 h-4 text-red-500" />}
                            {step.status === 'pending' && <Clock className="w-4 h-4 text-yellow-500" />}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{step.title}</span>
                                {step.required && <Badge variant="secondary" className="text-xs">Bắt buộc</Badge>}
                              </div>
                              <p className="text-sm text-muted-foreground">{step.description}</p>
                            </div>
                          </div>
                          {step.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateStepStatus(step.id, 'completed')}
                              >
                                Hoàn thành
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateStepStatus(step.id, 'failed')}
                              >
                                Thất bại
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Verification Notes */}
                <div className="space-y-3">
                  <label className="block font-medium">Ghi chú xác minh</label>
                  <Textarea
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    placeholder="Nhập ghi chú về quá trình xác minh..."
                    className="min-h-[100px]"
                  />
                </div>

                {/* Action Buttons */}
                {selectedRegistration.status === 'pending' && (
                  <div className="flex gap-4 pt-4">
                    <Button
                      onClick={approveRegistration}
                      disabled={loading}
                      className="flex-1"
                    >
                      {loading ? 'Đang xử lý...' : 'Phê duyệt'}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={rejectRegistration}
                      disabled={loading}
                      className="flex-1"
                    >
                      Từ chối
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClubVerificationWorkflow;