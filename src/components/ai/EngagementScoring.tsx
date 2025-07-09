import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  TrendingUp, 
  Target, 
  Activity,
  Clock,
  Trophy,
  MessageCircle,
  Calendar,
  Star,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar } from 'recharts';

interface EngagementScore {
  userId: string;
  userName: string;
  overallScore: number;
  category: 'champion' | 'active' | 'casual' | 'at-risk' | 'dormant';
  metrics: {
    loginFrequency: number;
    sessionDuration: number;
    tournamentParticipation: number;
    challengeActivity: number;
    socialInteraction: number;
    paymentActivity: number;
    skillProgression: number;
  };
  trends: {
    week: number;
    month: number;
    quarter: number;
  };
  riskFactors: string[];
  recommendations: string[];
  lastActivity: string;
}

interface EngagementSegment {
  name: string;
  count: number;
  percentage: number;
  color: string;
  description: string;
  avgScore: number;
}

export const EngagementScoring: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const engagementScores: EngagementScore[] = [
    {
      userId: '1',
      userName: 'Nguyễn Văn An',
      overallScore: 89,
      category: 'champion',
      metrics: {
        loginFrequency: 95,
        sessionDuration: 87,
        tournamentParticipation: 92,
        challengeActivity: 85,
        socialInteraction: 78,
        paymentActivity: 90,
        skillProgression: 88
      },
      trends: { week: +5, month: +12, quarter: +8 },
      riskFactors: [],
      recommendations: ['Feature in tournament highlights', 'Invite to exclusive events'],
      lastActivity: '2024-01-09T10:30:00Z'
    },
    {
      userId: '2',
      userName: 'Trần Thị Bình',
      overallScore: 72,
      category: 'active',
      metrics: {
        loginFrequency: 78,
        sessionDuration: 75,
        tournamentParticipation: 68,
        challengeActivity: 82,
        socialInteraction: 65,
        paymentActivity: 70,
        skillProgression: 76
      },
      trends: { week: +2, month: -3, quarter: +1 },
      riskFactors: ['Declining tournament participation'],
      recommendations: ['Send tournament invitations', 'Offer skill development challenges'],
      lastActivity: '2024-01-09T08:15:00Z'
    },
    {
      userId: '3',
      userName: 'Lê Hoàng Cường',
      overallScore: 45,
      category: 'casual',
      metrics: {
        loginFrequency: 42,
        sessionDuration: 38,
        tournamentParticipation: 25,
        challengeActivity: 55,
        socialInteraction: 48,
        paymentActivity: 35,
        skillProgression: 42
      },
      trends: { week: -8, month: -15, quarter: -12 },
      riskFactors: ['Low session duration', 'Irregular login pattern', 'Limited tournament participation'],
      recommendations: ['Send re-engagement campaign', 'Offer beginner-friendly tournaments', 'Provide skill tutorials'],
      lastActivity: '2024-01-08T14:20:00Z'
    },
    {
      userId: '4',
      userName: 'Phạm Thị Dung',
      overallScore: 23,
      category: 'at-risk',
      metrics: {
        loginFrequency: 15,
        sessionDuration: 22,
        tournamentParticipation: 8,
        challengeActivity: 12,
        socialInteraction: 18,
        paymentActivity: 5,
        skillProgression: 25
      },
      trends: { week: -12, month: -25, quarter: -18 },
      riskFactors: ['Very low activity', 'No recent payments', 'Missed last 3 tournaments'],
      recommendations: ['Urgent re-engagement needed', 'Personal outreach', 'Special comeback offers'],
      lastActivity: '2024-01-06T16:45:00Z'
    }
  ];

  const segments: EngagementSegment[] = [
    { name: 'Champions', count: 156, percentage: 12.5, color: '#10b981', description: 'Highly engaged power users', avgScore: 87 },
    { name: 'Active Users', count: 467, percentage: 37.4, color: '#3b82f6', description: 'Regular participants', avgScore: 71 },
    { name: 'Casual Users', count: 389, percentage: 31.2, color: '#f59e0b', description: 'Occasional users', avgScore: 48 },
    { name: 'At Risk', count: 156, percentage: 12.5, color: '#ef4444', description: 'Low engagement, high churn risk', avgScore: 28 },
    { name: 'Dormant', count: 79, percentage: 6.3, color: '#6b7280', description: 'Inactive users', avgScore: 12 }
  ];

  const engagementTrends = [
    { month: 'Oct', champions: 145, active: 450, casual: 380, atRisk: 170, dormant: 85 },
    { month: 'Nov', champions: 152, active: 465, casual: 385, atRisk: 160, dormant: 82 },
    { month: 'Dec', champions: 156, active: 467, casual: 389, atRisk: 156, dormant: 79 },
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'champion': return 'bg-green-500 text-white';
      case 'active': return 'bg-blue-500 text-white';
      case 'casual': return 'bg-yellow-500 text-black';
      case 'at-risk': return 'bg-red-500 text-white';
      case 'dormant': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'champion': return <Trophy className="h-4 w-4" />;
      case 'active': return <Activity className="h-4 w-4" />;
      case 'casual': return <Clock className="h-4 w-4" />;
      case 'at-risk': return <AlertCircle className="h-4 w-4" />;
      case 'dormant': return <Users className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend < 0) return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
    return <div className="h-4 w-4 rounded-full bg-gray-400" />;
  };

  const selectedUserData = selectedUser ? engagementScores.find(u => u.userId === selectedUser) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Target className="h-6 w-6" />
          Player Engagement Scoring
        </h2>
        <p className="text-muted-foreground">
          AI-powered engagement analysis and user segmentation
        </p>
      </div>

      {/* Engagement Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {segments.map((segment) => (
          <Card key={segment.name}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-sm">{segment.name}</h3>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.color }} />
              </div>
              <p className="text-2xl font-bold">{segment.count}</p>
              <p className="text-sm text-muted-foreground">{segment.percentage}% of users</p>
              <div className="mt-2">
                <p className="text-xs text-muted-foreground">Avg Score</p>
                <Progress value={segment.avgScore} className="h-1 mt-1" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Engagement Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Engagement Trends by Segment</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={engagementTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="champions" stackId="a" fill="#10b981" name="Champions" />
              <Bar dataKey="active" stackId="a" fill="#3b82f6" name="Active" />
              <Bar dataKey="casual" stackId="a" fill="#f59e0b" name="Casual" />
              <Bar dataKey="atRisk" stackId="a" fill="#ef4444" name="At Risk" />
              <Bar dataKey="dormant" stackId="a" fill="#6b7280" name="Dormant" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Engagement Scores */}
        <Card>
          <CardHeader>
            <CardTitle>Individual User Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {engagementScores.map((user) => (
                <div 
                  key={user.userId} 
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedUser === user.userId ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedUser(user.userId)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getCategoryIcon(user.category)}
                      <div>
                        <h4 className="font-medium">{user.userName}</h4>
                        <p className="text-sm text-muted-foreground">
                          Last active: {new Date(user.lastActivity).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <p className="text-2xl font-bold">{user.overallScore}</p>
                        <Badge className={getCategoryColor(user.category)}>
                          {user.category}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Week:</span>
                      {getTrendIcon(user.trends.week)}
                      <span className={user.trends.week >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {user.trends.week > 0 ? '+' : ''}{user.trends.week}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Month:</span>
                      {getTrendIcon(user.trends.month)}
                      <span className={user.trends.month >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {user.trends.month > 0 ? '+' : ''}{user.trends.month}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Quarter:</span>
                      {getTrendIcon(user.trends.quarter)}
                      <span className={user.trends.quarter >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {user.trends.quarter > 0 ? '+' : ''}{user.trends.quarter}
                      </span>
                    </div>
                  </div>

                  {user.riskFactors.length > 0 && (
                    <div className="mt-3 p-2 bg-red-50 rounded border border-red-200">
                      <p className="text-sm font-medium text-red-800 mb-1">Risk Factors:</p>
                      <p className="text-sm text-red-700">{user.riskFactors.join(', ')}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Detailed User Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedUserData ? (
              <div className="space-y-6">
                {/* User Header */}
                <div className="text-center">
                  <h3 className="text-xl font-bold">{selectedUserData.userName}</h3>
                  <Badge className={getCategoryColor(selectedUserData.category)}>
                    {selectedUserData.category} - {selectedUserData.overallScore}/100
                  </Badge>
                </div>

                {/* Engagement Metrics Radar */}
                <div>
                  <h4 className="font-medium mb-3">Engagement Breakdown</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <RadarChart data={[
                      { metric: 'Login', value: selectedUserData.metrics.loginFrequency },
                      { metric: 'Session', value: selectedUserData.metrics.sessionDuration },
                      { metric: 'Tournament', value: selectedUserData.metrics.tournamentParticipation },
                      { metric: 'Challenge', value: selectedUserData.metrics.challengeActivity },
                      { metric: 'Social', value: selectedUserData.metrics.socialInteraction },
                      { metric: 'Payment', value: selectedUserData.metrics.paymentActivity },
                      { metric: 'Skill', value: selectedUserData.metrics.skillProgression }
                    ]}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar
                        dataKey="value"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Risk Factors */}
                {selectedUserData.riskFactors.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      Risk Factors
                    </h4>
                    <div className="space-y-1">
                      {selectedUserData.riskFactors.map((factor, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 bg-red-500 rounded-full" />
                          {factor}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    Recommendations
                  </h4>
                  <div className="space-y-1">
                    {selectedUserData.recommendations.map((rec, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        {rec}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Select a user to view detailed engagement analysis</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};