import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Building, Users, Trophy, Star, ArrowLeft, ArrowRight } from 'lucide-react';
import ClubRegistrationMultiStepForm from '@/components/ClubRegistrationMultiStepForm';
import { useAuth } from '@/hooks/useAuth';

const ClubRegistrationPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <Building className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-bold mb-2">Đăng ký câu lạc bộ</h2>
            <p className="text-muted-foreground mb-6">
              Bạn cần đăng nhập để có thể đăng ký câu lạc bộ
            </p>
            <div className="space-y-3">
              <Button onClick={() => navigate('/login')} className="w-full">
                Đăng nhập
              </Button>
              <Button onClick={() => navigate('/register')} variant="outline" className="w-full">
                Đăng ký tài khoản
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 pt-20 pb-8">
        <div className="max-w-4xl mx-auto px-4">
          <Button 
            variant="ghost" 
            onClick={() => setShowForm(false)}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại thông tin
          </Button>
          <ClubRegistrationMultiStepForm />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 pt-20 pb-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Đăng ký câu lạc bộ Bida
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Tham gia mạng lưới câu lạc bộ Bida chuyên nghiệp. Quản lý thành viên, 
            tổ chức giải đấu và phát triển cộng đồng người chơi Bida.
          </p>
        </div>

        {/* Benefits Section */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="text-center">
            <CardContent className="pt-6">
              <Users className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Quản lý thành viên</h3>
              <p className="text-sm text-muted-foreground">
                Hệ thống quản lý thành viên chuyên nghiệp với xác thực hạng tự động
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Tổ chức giải đấu</h3>
              <p className="text-sm text-muted-foreground">
                Công cụ tạo và quản lý giải đấu với hệ thống xếp hạng tự động
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <Building className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Quản lý cơ sở</h3>
              <p className="text-sm text-muted-foreground">
                Theo dõi lịch sử, đặt bàn và quản lý thiết bị một cách hiệu quả
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <Star className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Uy tín & Chất lượng</h3>
              <p className="text-sm text-muted-foreground">
                Xây dựng thương hiệu với hệ thống đánh giá và xếp hạng uy tín
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Requirements Section */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                Yêu cầu đăng ký
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 mt-0.5 text-green-600" />
                <div>
                  <p className="font-medium">Giấy phép kinh doanh hợp lệ</p>
                  <p className="text-sm text-muted-foreground">
                    Cần có giấy phép kinh doanh hoặc đăng ký hộ kinh doanh
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 mt-0.5 text-green-600" />
                <div>
                  <p className="font-medium">Cơ sở vật chất đầy đủ</p>
                  <p className="text-sm text-muted-foreground">
                    Tối thiểu 3 bàn bida và không gian phù hợp
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 mt-0.5 text-green-600" />
                <div>
                  <p className="font-medium">Thông tin liên hệ chính xác</p>
                  <p className="text-sm text-muted-foreground">
                    Địa chỉ, số điện thoại và email để khách hàng liên hệ
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="w-5 h-5 mr-2 text-amber-500" />
                Quyền lợi thành viên
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Hiển thị trên bản đồ</span>
                <Badge variant="secondary">Free</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Quản lý thành viên</span>
                <Badge variant="secondary">Free</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Tổ chức giải đấu</span>
                <Badge>Premium</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Thống kê chi tiết</span>
                <Badge>Premium</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Quảng cáo ưu tiên</span>
                <Badge>Premium</Badge>
              </div>
              
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  * Gói Premium sẽ có sẵn sau khi hoàn thành đăng ký cơ bản
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Process Steps */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-center">Quy trình đăng ký</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                  1
                </div>
                <h4 className="font-medium mb-2">Điền thông tin</h4>
                <p className="text-sm text-muted-foreground">
                  Cung cấp thông tin cơ bản về câu lạc bộ
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                  2
                </div>
                <h4 className="font-medium mb-2">Tải tài liệu</h4>
                <p className="text-sm text-muted-foreground">
                  Upload giấy phép kinh doanh và ảnh cơ sở
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                  3
                </div>
                <h4 className="font-medium mb-2">Xét duyệt</h4>
                <p className="text-sm text-muted-foreground">
                  Chúng tôi sẽ xem xét và phê duyệt trong 24h
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                  4
                </div>
                <h4 className="font-medium mb-2">Hoạt động</h4>
                <p className="text-sm text-muted-foreground">
                  Bắt đầu quản lý và vận hành câu lạc bộ
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-8 pb-8">
              <h2 className="text-2xl font-bold mb-4">
                Sẵn sàng bắt đầu?
              </h2>
              <p className="text-muted-foreground mb-6">
                Tham gia cùng hàng trăm câu lạc bộ khác đang sử dụng nền tảng của chúng tôi
              </p>
              <Button 
                size="lg" 
                onClick={() => setShowForm(true)}
                className="text-lg px-8"
              >
                Bắt đầu đăng ký ngay
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-muted-foreground">
                  Cần hỗ trợ? Liên hệ với chúng tôi qua{' '}
                  <a href="mailto:support@saboarea.com" className="text-primary hover:underline">
                    support@saboarea.com
                  </a>
                  {' '}hoặc{' '}
                  <a href="tel:+84901234567" className="text-primary hover:underline">
                    090 123 4567
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClubRegistrationPage;