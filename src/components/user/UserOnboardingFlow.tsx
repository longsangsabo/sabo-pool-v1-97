import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { 
  User, 
  Phone, 
  MapPin, 
  Award, 
  CheckCircle, 
  Clock, 
  ArrowRight,
  Camera,
  Shield,
  Star,
  Target
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed';
  required: boolean;
  component: React.ReactNode;
}

interface UserProfile {
  full_name: string;
  display_name: string;
  phone: string;
  city: string;
  district: string;
  skill_level: string;
  bio: string;
  avatar_url?: string;
}

const UserOnboardingFlow = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [profile, setProfile] = useState<UserProfile>({
    full_name: '',
    display_name: '',
    phone: '',
    city: '',
    district: '',
    skill_level: 'beginner',
    bio: ''
  });
  const [loading, setLoading] = useState(false);
  const [existingProfile, setExistingProfile] = useState<any>(null);
  const [verificationCode, setVerificationCode] = useState('');

  useEffect(() => {
    if (user) {
      fetchExistingProfile();
    }
  }, [user]);

  const fetchExistingProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (data) {
        setExistingProfile(data);
        setProfile({
          full_name: data.full_name || '',
          display_name: data.display_name || '',
          phone: data.phone || '',
          city: data.city || '',
          district: data.district || '',
          skill_level: data.skill_level || 'beginner',
          bio: data.bio || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const BasicInfoStep = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Họ và tên *</label>
          <Input
            value={profile.full_name}
            onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
            placeholder="Nhập họ và tên đầy đủ"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Tên hiển thị *</label>
          <Input
            value={profile.display_name}
            onChange={(e) => setProfile(prev => ({ ...prev, display_name: e.target.value }))}
            placeholder="Tên hiển thị trong game"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Số điện thoại *</label>
        <Input
          value={profile.phone}
          onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
          placeholder="Số điện thoại liên hệ"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Giới thiệu bản thân</label>
        <Textarea
          value={profile.bio}
          onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
          placeholder="Kể về bản thân bạn, kinh nghiệm chơi bi-a..."
          className="min-h-[100px]"
        />
      </div>
    </div>
  );

  const LocationStep = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Thành phố *</label>
          <select
            value={profile.city}
            onChange={(e) => setProfile(prev => ({ ...prev, city: e.target.value }))}
            className="w-full p-2 border rounded-md"
          >
            <option value="">Chọn thành phố</option>
            <option value="Hồ Chí Minh">Hồ Chí Minh</option>
            <option value="Hà Nội">Hà Nội</option>
            <option value="Đà Nẵng">Đà Nẵng</option>
            <option value="Cần Thơ">Cần Thơ</option>
            <option value="Hải Phòng">Hải Phòng</option>
            <option value="Nha Trang">Nha Trang</option>
            <option value="Huế">Huế</option>
            <option value="Vũng Tàu">Vũng Tàu</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Quận/Huyện *</label>
          <Input
            value={profile.district}
            onChange={(e) => setProfile(prev => ({ ...prev, district: e.target.value }))}
            placeholder="Nhập quận/huyện"
          />
        </div>
      </div>
      <div className="p-4 bg-muted/30 rounded-lg">
        <p className="text-sm text-muted-foreground">
          Thông tin vị trí giúp chúng tôi tìm kiếm đối thủ và câu lạc bộ gần bạn nhất.
        </p>
      </div>
    </div>
  );

  const SkillLevelStep = () => (
    <div className="space-y-4">
      <div className="grid gap-4">
        {[
          { value: 'beginner', title: 'Người mới', description: 'Mới bắt đầu chơi bi-a, đang học cơ bản' },
          { value: 'intermediate', title: 'Trung bình', description: 'Đã chơi được 6 tháng - 2 năm, biết các kỹ thuật cơ bản' },
          { value: 'advanced', title: 'Giỏi', description: 'Chơi được 2+ năm, thành thạo nhiều kỹ thuật' },
          { value: 'expert', title: 'Chuyên nghiệp', description: 'Tham gia các giải đấu, có thể dạy người khác' }
        ].map((level) => (
          <button
            key={level.value}
            onClick={() => setProfile(prev => ({ ...prev, skill_level: level.value }))}
            className={`p-4 border rounded-lg text-left transition-colors ${
              profile.skill_level === level.value 
                ? 'border-primary bg-primary/5' 
                : 'border-gray-200 hover:bg-muted/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full border-2 ${
                profile.skill_level === level.value 
                  ? 'border-primary bg-primary' 
                  : 'border-gray-300'
              }`} />
              <div>
                <h4 className="font-medium">{level.title}</h4>
                <p className="text-sm text-muted-foreground">{level.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const PhoneVerificationStep = () => (
    <div className="space-y-4">
      <div className="text-center">
        <Phone className="w-12 h-12 mx-auto text-primary mb-4" />
        <h3 className="text-lg font-semibold mb-2">Xác minh số điện thoại</h3>
        <p className="text-muted-foreground mb-4">
          Chúng tôi đã gửi mã xác minh đến số {profile.phone}
        </p>
      </div>
      
      <div className="max-w-xs mx-auto">
        <Input
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value)}
          placeholder="Nhập mã 6 số"
          className="text-center text-2xl font-mono"
          maxLength={6}
        />
      </div>
      
      <div className="text-center space-y-2">
        <Button
          variant="outline"
          onClick={() => sendVerificationCode()}
          disabled={loading}
        >
          Gửi lại mã
        </Button>
        <p className="text-sm text-muted-foreground">
          Không nhận được mã? Kiểm tra tin nhắn rác hoặc thử lại sau 60s
        </p>
      </div>
    </div>
  );

  const CompletionStep = () => (
    <div className="text-center space-y-4">
      <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle className="w-10 h-10 text-green-500" />
      </div>
      <h3 className="text-xl font-semibold">Chào mừng đến với SPA!</h3>
      <p className="text-muted-foreground">
        Hồ sơ của bạn đã được tạo thành công. Bây giờ bạn có thể:
      </p>
      <div className="grid gap-3 text-left max-w-md mx-auto">
        <div className="flex items-center gap-3">
          <Target className="w-5 h-5 text-primary" />
          <span>Tham gia thách đấu với người chơi khác</span>
        </div>
        <div className="flex items-center gap-3">
          <Award className="w-5 h-5 text-primary" />
          <span>Đăng ký các giải đấu</span>
        </div>
        <div className="flex items-center gap-3">
          <Star className="w-5 h-5 text-primary" />
          <span>Tích lũy điểm SPA và leo hạng</span>
        </div>
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-primary" />
          <span>Tìm kiếm câu lạc bộ gần bạn</span>
        </div>
      </div>
    </div>
  );

  const sendVerificationCode = async () => {
    // Simulate sending verification code
    toast.success('Đã gửi mã xác minh đến số điện thoại của bạn');
  };

  const verifyPhoneNumber = async () => {
    if (verificationCode.length !== 6) {
      toast.error('Vui lòng nhập mã 6 số');
      return false;
    }

    // Simulate verification
    if (verificationCode === '123456') {
      toast.success('Xác minh số điện thoại thành công');
      return true;
    } else {
      toast.error('Mã xác minh không đúng');
      return false;
    }
  };

  const steps: OnboardingStep[] = [
    {
      id: 'basic_info',
      title: 'Thông tin cơ bản',
      description: 'Nhập thông tin cá nhân của bạn',
      status: currentStep === 0 ? 'active' : currentStep > 0 ? 'completed' : 'pending',
      required: true,
      component: <BasicInfoStep />
    },
    {
      id: 'location',
      title: 'Vị trí',
      description: 'Cho chúng tôi biết bạn ở đâu',
      status: currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : 'pending',
      required: true,
      component: <LocationStep />
    },
    {
      id: 'skill_level',
      title: 'Trình độ chơi',
      description: 'Đánh giá kỹ năng bi-a của bạn',
      status: currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : 'pending',
      required: true,
      component: <SkillLevelStep />
    },
    {
      id: 'phone_verification',
      title: 'Xác minh SĐT',
      description: 'Xác minh số điện thoại để bảo mật',
      status: currentStep === 3 ? 'active' : currentStep > 3 ? 'completed' : 'pending',
      required: true,
      component: <PhoneVerificationStep />
    },
    {
      id: 'completion',
      title: 'Hoàn tất',
      description: 'Chào mừng bạn đến với SPA!',
      status: currentStep === 4 ? 'active' : 'pending',
      required: false,
      component: <CompletionStep />
    }
  ];

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return !!(profile.full_name && profile.display_name && profile.phone);
      case 1:
        return !!(profile.city && profile.district);
      case 2:
        return !!profile.skill_level;
      case 3:
        return verificationCode.length === 6;
      default:
        return true;
    }
  };

  const nextStep = async () => {
    if (!validateCurrentStep()) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    if (currentStep === 3) {
      const verified = await verifyPhoneNumber();
      if (!verified) return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const profileData = {
        user_id: user.id,
        ...profile,
        email_verified: true,
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      };

      if (existingProfile) {
        const { error } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('user_id', user.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('profiles')
          .insert(profileData);
        
        if (error) throw error;

        // Create initial wallet
        await supabase
          .from('wallets')
          .insert({
            user_id: user.id,
            balance: 0,
            points_balance: 100 // Welcome bonus
          });

        // Create initial player ranking
        await supabase
          .from('player_rankings')
          .insert({
            player_id: user.id,
            elo_points: 1000,
            elo: 1000,
            spa_points: 0,
            total_matches: 0,
            wins: 0,
            losses: 0
          });
      }

      toast.success('Đã lưu hồ sơ thành công!');
      setCurrentStep(4);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Lỗi khi lưu hồ sơ');
    }
    setLoading(false);
  };

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Thiết lập hồ sơ người dùng
          </CardTitle>
          <CardDescription>
            Hoàn thành các bước để bắt đầu trải nghiệm SPA
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Tiến độ hoàn thành</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Steps Overview */}
          <div className="flex justify-between mb-8">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex flex-col items-center text-center flex-1 ${
                  index < steps.length - 1 ? 'relative' : ''
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                  step.status === 'completed' ? 'bg-green-500 text-white' :
                  step.status === 'active' ? 'bg-primary text-white' :
                  'bg-gray-200 text-gray-500'
                }`}>
                  {step.status === 'completed' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <span className="text-xs font-bold">{index + 1}</span>
                  )}
                </div>
                <span className="text-xs font-medium">{step.title}</span>
                
                {index < steps.length - 1 && (
                  <div className="absolute top-4 left-1/2 w-full h-0.5 bg-gray-200 -z-10" />
                )}
              </div>
            ))}
          </div>

          {/* Current Step Content */}
          <div className="mb-8">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">{currentStepData.title}</h3>
              <p className="text-muted-foreground">{currentStepData.description}</p>
            </div>
            {currentStepData.component}
          </div>

          {/* Navigation Buttons */}
          {currentStep < steps.length - 1 && (
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={previousStep}
                disabled={currentStep === 0}
              >
                Quay lại
              </Button>
              <Button
                onClick={currentStep === steps.length - 2 ? saveProfile : nextStep}
                disabled={!validateCurrentStep() || loading}
              >
                {loading ? 'Đang lưu...' : 
                 currentStep === steps.length - 2 ? 'Hoàn tất' : 'Tiếp tục'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {currentStep === steps.length - 1 && (
            <div className="text-center">
              <Button
                onClick={() => window.location.href = '/'}
                size="lg"
              >
                Bắt đầu sử dụng SPA
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserOnboardingFlow;