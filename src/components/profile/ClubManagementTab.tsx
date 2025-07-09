import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, UserCheck, Shield, AlertTriangle, ExternalLink, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ClubRegistrationMultiStepForm from '@/components/ClubRegistrationMultiStepForm';
import RankVerificationRequests from '@/components/RankVerificationRequests';
import PenaltyManagement from '@/components/PenaltyManagement';
import ClubTournamentManagement from '@/components/ClubTournamentManagement';

interface ClubManagementTabProps {
  userRole: 'player' | 'club_owner' | 'both';
}

const ClubManagementTab: React.FC<ClubManagementTabProps> = ({ userRole }) => {
  const navigate = useNavigate();

  // If user is not a club owner, show registration option
  if (userRole === 'player') {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <Building className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Chưa có câu lạc bộ</h3>
            <p className="text-muted-foreground mb-6">
              Bạn chưa đăng ký câu lạc bộ nào. Đăng ký ngay để quản lý thành viên và tổ chức giải đấu.
            </p>
            <div className="space-y-3">
              <Button onClick={() => navigate('/club-registration')} className="w-full">
                <Building className="w-4 h-4 mr-2" />
                Đăng ký câu lạc bộ mới
              </Button>
              <Button onClick={() => navigate('/clubs')} variant="outline" className="w-full">
                <ExternalLink className="w-4 h-4 mr-2" />
                Xem danh sách câu lạc bộ
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Quản lý Câu lạc bộ</h2>
        <p className="text-muted-foreground">
          Quản lý thành viên, xử lý yêu cầu xác thực và theo dõi hoạt động câu lạc bộ
        </p>
      </div>
      
      <Tabs defaultValue="registration" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="registration" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            <span className="hidden sm:inline">Đăng ký CLB</span>
            <span className="sm:hidden">CLB</span>
          </TabsTrigger>
          <TabsTrigger value="tournaments" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            <span className="hidden sm:inline">Giải đấu</span>
            <span className="sm:hidden">Giải</span>
          </TabsTrigger>
          <TabsTrigger value="verification" className="flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Xác thực hạng</span>
            <span className="sm:hidden">Xác thực</span>
          </TabsTrigger>
          <TabsTrigger value="penalties" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="hidden sm:inline">Hình phạt</span>
            <span className="sm:hidden">Phạt</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="registration">
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Quản lý thông tin CLB</h3>
                    <p className="text-sm text-muted-foreground">
                      Cập nhật thông tin câu lạc bộ của bạn
                    </p>
                  </div>
                  <Button onClick={() => navigate('/club-management')} variant="outline">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Đi tới trang quản lý CLB
                  </Button>
                </div>
              </CardContent>
            </Card>
            <ClubRegistrationMultiStepForm />
          </div>
        </TabsContent>

        <TabsContent value="tournaments">
          <ClubTournamentManagement />
        </TabsContent>

        <TabsContent value="verification">
          <RankVerificationRequests />
        </TabsContent>

        <TabsContent value="penalties">
          <PenaltyManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClubManagementTab;