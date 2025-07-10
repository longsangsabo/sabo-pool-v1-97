import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Target, 
  Star, 
  Trophy, 
  Settings, 
  AlertTriangle, 
  CheckCircle,
  TrendingUp,
  Users,
  Gamepad2
} from 'lucide-react';
import { useGameConfigStats } from '@/hooks/useGameConfigStats';

export const GameConfigOverview: React.FC = () => {
  const { stats, loading, inconsistencies } = useGameConfigStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const configSections = [
    {
      title: 'ELO Calculation Rules',
      icon: Target,
      count: stats?.eloRules || 0,
      description: 'K-factors và tournament bonuses',
      status: 'active',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Rank Definitions', 
      icon: Star,
      count: stats?.ranks || 0,
      description: 'Các hạng từ K đến E+',
      status: 'active',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'SPA Reward Milestones',
      icon: Trophy,
      count: stats?.spaRewards || 0,
      description: 'Challenge và streak rewards',
      status: 'active',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Tournament Rewards',
      icon: Settings,
      count: stats?.tournamentRewards || 0,
      description: 'Phần thưởng theo hạng và vị trí',
      status: 'active',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  const systemMetrics = [
    {
      label: 'Active Players',
      value: stats?.activePlayers?.toLocaleString() || '0',
      icon: Users,
      change: '+12%'
    },
    {
      label: 'Total Matches',
      value: stats?.totalMatches?.toLocaleString() || '0',
      icon: Gamepad2,
      change: '+8%'
    },
    {
      label: 'Tournament Results',
      value: stats?.tournamentResults?.toLocaleString() || '0',
      icon: Trophy,
      change: '+15%'
    },
    {
      label: 'Average ELO',
      value: stats?.averageElo || '1000',
      icon: TrendingUp,
      change: '+2%'
    }
  ];

  return (
    <div className="space-y-6">
      {/* System Status */}
      {inconsistencies && inconsistencies.length > 0 ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Phát hiện {inconsistencies.length} vấn đề trong cấu hình game logic. 
            Kiểm tra tab Sync để xem chi tiết và sửa chữa.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Tất cả các cấu hình game logic đang hoạt động bình thường.
          </AlertDescription>
        </Alert>
      )}

      {/* Configuration Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {configSections.map((section, index) => {
          const Icon = section.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {section.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${section.bgColor}`}>
                  <Icon className={`h-4 w-4 ${section.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{section.count}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {section.description}
                </p>
                <div className="mt-2">
                  <Badge variant="secondary" className="text-xs">
                    {section.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* System Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>System Metrics</CardTitle>
          <CardDescription>
            Thống kê sử dụng game logic trong 30 ngày qua
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {systemMetrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <div key={index} className="flex items-center space-x-4">
                  <div className="p-2 bg-muted rounded-lg">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {metric.label}
                    </p>
                    <div className="flex items-center space-x-2">
                      <p className="text-2xl font-bold">{metric.value}</p>
                      <Badge variant="secondary" className="text-xs text-green-600">
                        {metric.change}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Changes */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Configuration Changes</CardTitle>
          <CardDescription>
            Lịch sử thay đổi cấu hình gần đây
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.recentChanges && stats.recentChanges.length > 0 ? (
            <div className="space-y-4">
              {stats.recentChanges.map((change: any, index: number) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline">{change.action_type}</Badge>
                    <span className="font-medium">{change.config_table}</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(change.created_at).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    by {change.changed_by}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Chưa có thay đổi nào được ghi nhận
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};