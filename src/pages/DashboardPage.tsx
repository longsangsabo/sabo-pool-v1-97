import React, { Suspense, lazy } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Trophy, Target, Users } from 'lucide-react';
import { DashboardSkeleton } from '@/components/skeleton/DashboardSkeleton';
import { EnhancedWalletBalance } from '@/components/enhanced/EnhancedWalletBalance';

const DashboardPage = () => {
  const { user, signOut, loading } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  // Show skeleton while loading
  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50 animate-fade-in">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center transition-transform hover:scale-110">
                <span className="text-white font-bold text-sm">🎱</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">SABO Pool Arena</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                Xin chào, {user?.user_metadata?.full_name || user?.phone || 'User'}
              </span>
              <Button 
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="hover-scale"
              >
                Đăng xuất
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 animate-fade-in">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
          <p className="text-gray-600">Chào mừng bạn đến với SABO Pool Arena!</p>
        </div>

        {/* Wallet Balance */}
        <div className="mb-8 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <Suspense fallback={<DashboardSkeleton />}>
            <EnhancedWalletBalance />
          </Suspense>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { title: 'Hồ sơ cá nhân', value: 'Hoàn thiện', desc: 'Cập nhật thông tin cá nhân', icon: User },
            { title: 'Giải đấu', value: '0', desc: 'Giải đấu đã tham gia', icon: Trophy },
            { title: 'Thách đấu', value: '0', desc: 'Trận đấu đã chơi', icon: Target },
            { title: 'CLB', value: 'Chưa có', desc: 'Tham gia CLB ngay', icon: Users }
          ].map((stat, index) => (
            <Card 
              key={stat.title}
              className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-slide-in-up"
              style={{ animationDelay: `${index * 100 + 200}ms` }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.desc}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: 'Thách đấu', desc: 'Tìm kiếm đối thủ và thách đấu ngay!', buttonText: 'Tạo thách đấu', variant: 'default' as const },
            { title: 'Giải đấu', desc: 'Tham gia các giải đấu hấp dẫn', buttonText: 'Xem giải đấu', variant: 'outline' as const },
            { title: 'CLB Pool', desc: 'Tìm kiếm CLB gần bạn', buttonText: 'Tìm CLB', variant: 'outline' as const }
          ].map((action, index) => (
            <Card 
              key={action.title}
              className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-slide-in-up"
              style={{ animationDelay: `${index * 100 + 600}ms` }}
            >
              <CardHeader>
                <CardTitle>{action.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{action.desc}</p>
                <Button className="w-full hover-scale" variant={action.variant}>
                  {action.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;