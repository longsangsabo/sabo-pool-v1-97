import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Building2, 
  Trophy, 
  Users, 
  CreditCard, 
  AlertTriangle,
  CheckCircle,
  Plus,
  Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

interface QuickActionsProps {
  pendingClubs: number;
  pendingTournaments?: number;
  activeIssues?: number;
}

const QuickActions: React.FC<QuickActionsProps> = ({ 
  pendingClubs, 
  pendingTournaments = 0, 
  activeIssues = 0 
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const actions = [
    {
      title: t('admin.approve_clubs'),
      description: `${pendingClubs} ${t('admin.pending')}`,
      icon: Building2,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      onClick: () => navigate('/admin/users'),
      urgent: pendingClubs > 0
    },
    {
      title: t('admin.manage_tournaments'),
      description: `${pendingTournaments} ${t('admin.active')}`,
      icon: Trophy,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      onClick: () => navigate('/admin/tournaments'),
      urgent: false
    },
    {
      title: t('admin.manage_users'),
      description: t('admin.user_overview'),
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      onClick: () => navigate('/admin/users'),
      urgent: false
    },
    {
      title: t('admin.financial_overview'),
      description: t('admin.transactions_payments'),
      icon: CreditCard,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      onClick: () => navigate('/admin/transactions'),
      urgent: false
    },
    {
      title: t('admin.system_issues'),
      description: `${activeIssues} ${t('admin.active_issues')}`,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      onClick: () => navigate('/admin/monitoring'),
      urgent: activeIssues > 0
    },
    {
      title: t('admin.system_settings'),
      description: t('admin.configure_system'),
      icon: Settings,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      onClick: () => navigate('/admin/settings'),
      urgent: false
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {t('admin.quick_actions')}
        </CardTitle>
        <CardDescription>{t('admin.common_actions')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Button 
              key={index}
              variant="ghost" 
              className={`w-full justify-start gap-3 h-auto p-3 ${
                action.urgent ? 'border border-red-200 bg-red-50 hover:bg-red-100' : ''
              }`}
              onClick={action.onClick}
            >
              <div className={`p-2 rounded-lg ${action.bgColor}`}>
                <Icon className={`w-4 h-4 ${action.color}`} />
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium">{action.title}</div>
                <div className="text-sm text-muted-foreground">{action.description}</div>
              </div>
              {action.urgent && (
                <AlertTriangle className="w-4 h-4 text-red-500" />
              )}
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default QuickActions;