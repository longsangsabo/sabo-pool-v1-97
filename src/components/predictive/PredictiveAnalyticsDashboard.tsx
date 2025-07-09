import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  TrendingUp, 
  Users, 
  Target, 
  AlertTriangle,
  Lightbulb,
  Trophy,
  Activity,
  Zap,
  ChevronRight
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface PredictiveModel {
  id: string;
  name: string;
  accuracy: number;
  lastTrained: string;
  status: 'active' | 'training' | 'inactive';
  predictions: number;
}

interface UserBehaviorPrediction {
  userId: string;
  userName: string;
  churnRisk: number;
  engagementScore: number;
  likelyActions: string[];
  recommendedInterventions: string[];
}

interface TournamentForecast {
  tournamentId: string;
  tournamentName: string;
  predictedParticipants: number;
  successProbability: number;
  revenueEstimate: number;
  riskFactors: string[];
}

interface AnomalyDetection {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedAt: string;
  affectedMetrics: string[];
  suggestedActions: string[];
}

export const PredictiveAnalyticsDashboard: React.FC = () => {
  const [models] = useState<PredictiveModel[]>([
    {
      id: 'user-churn',
      name: 'User Churn Prediction',
      accuracy: 89.2,
      lastTrained: '2024-01-09T08:00:00Z',
      status: 'active',
      predictions: 1247
    },
    {
      id: 'tournament-success',
      name: 'Tournament Success Model',
      accuracy: 94.7,
      lastTrained: '2024-01-09T06:30:00Z',
      status: 'active',
      predictions: 89
    },
    {
      id: 'engagement-scoring',
      name: 'Player Engagement Scorer',
      accuracy: 87.5,
      lastTrained: '2024-01-09T05:15:00Z',
      status: 'training',
      predictions: 2156
    }
  ]);

  const [userPredictions] = useState<UserBehaviorPrediction[]>([
    {
      userId: '1',
      userName: 'Nguyễn Văn An',
      churnRisk: 78,
      engagementScore: 45,
      likelyActions: ['Tournament Registration', 'Challenge Creation'],
      recommendedInterventions: ['Send tournament invitation', 'Offer practice session']
    },
    {
      userId: '2',
      userName: 'Trần Thị Bình',
      churnRisk: 23,
      engagementScore: 89,
      likelyActions: ['Daily Login', 'Match Participation', 'Social Interaction'],
      recommendedInterventions: ['Feature new tournaments', 'Invite to premium events']
    },
    {
      userId: '3',
      userName: 'Lê Hoàng Cường',
      churnRisk: 92,
      engagementScore: 12,
      likelyActions: ['Account Deletion Risk'],
      recommendedInterventions: ['Urgent re-engagement campaign', 'Personal outreach', 'Special offers']
    }
  ]);

  const [tournamentForecasts] = useState<TournamentForecast[]>([
    {
      tournamentId: '1',
      tournamentName: 'Monthly Championship',
      predictedParticipants: 64,
      successProbability: 95,
      revenueEstimate: 3200000,
      riskFactors: ['Weather conditions', 'Competing events']
    },
    {
      tournamentId: '2',
      tournamentName: 'Weekend Warrior Cup',
      predictedParticipants: 32,
      successProbability: 78,
      revenueEstimate: 1600000,
      riskFactors: ['Low early registration', 'Prize pool concerns']
    }
  ]);

  const [anomalies] = useState<AnomalyDetection[]>([
    {
      type: 'User Behavior Anomaly',
      severity: 'high',
      description: 'Unusual spike in challenge rejections (35% above normal)',
      detectedAt: '2024-01-09T10:15:00Z',
      affectedMetrics: ['Challenge Acceptance Rate', 'User Engagement'],
      suggestedActions: ['Review challenge difficulty', 'Check game balance', 'Survey users']
    },
    {
      type: 'Performance Anomaly',
      severity: 'medium',
      description: 'API response times 150% slower than baseline',
      detectedAt: '2024-01-09T09:45:00Z',
      affectedMetrics: ['Response Time', 'User Experience'],
      suggestedActions: ['Scale server resources', 'Optimize database queries', 'Enable caching']
    }
  ]);

  const engagementTrendData = [
    { month: 'Jan', predicted: 85, actual: 82 },
    { month: 'Feb', predicted: 78, actual: 76 },
    { month: 'Mar', predicted: 82, actual: 84 },
    { month: 'Apr', predicted: 88, actual: null },
    { month: 'May', predicted: 92, actual: null },
    { month: 'Jun', predicted: 89, actual: null }
  ];

  const churnRiskDistribution = [
    { name: 'Low Risk (0-30%)', value: 68, color: '#10b981' },
    { name: 'Medium Risk (31-60%)', value: 23, color: '#f59e0b' },
    { name: 'High Risk (61-80%)', value: 7, color: '#ef4444' },
    { name: 'Critical Risk (81-100%)', value: 2, color: '#dc2626' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'training': return 'bg-yellow-500';
      case 'inactive': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6" />
            Predictive Analytics & AI Insights
          </h2>
          <p className="text-muted-foreground">
            AI-powered predictions and intelligent business insights
          </p>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Retrain Models
        </Button>
      </div>

      {/* Model Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {models.map((model) => (
          <Card key={model.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(model.status)}`} />
                <Badge variant="secondary">{model.accuracy}% accuracy</Badge>
              </div>
              <h3 className="font-semibold mb-1">{model.name}</h3>
              <p className="text-sm text-muted-foreground mb-2">
                {model.predictions} predictions made
              </p>
              <p className="text-xs text-muted-foreground">
                Last trained: {new Date(model.lastTrained).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="predictions" className="space-y-6">
        <TabsList className="grid w-full lg:w-auto grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="predictions" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            User Predictions
          </TabsTrigger>
          <TabsTrigger value="forecasts" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Tournament Forecasts
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Trend Analysis
          </TabsTrigger>
          <TabsTrigger value="anomalies" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Anomaly Detection
          </TabsTrigger>
        </TabsList>

        {/* User Behavior Predictions */}
        <TabsContent value="predictions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Churn Risk Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Churn Risk Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={churnRiskDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                    >
                      {churnRiskDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {churnRiskDistribution.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: item.color }} />
                        <span>{item.name}</span>
                      </div>
                      <span className="font-medium">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* High Risk Users */}
            <Card>
              <CardHeader>
                <CardTitle>High Risk Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userPredictions.filter(u => u.churnRisk > 60).map((user) => (
                    <div key={user.userId} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{user.userName}</h4>
                        <Badge variant="destructive">{user.churnRisk}% risk</Badge>
                      </div>
                      <div className="mb-3">
                        <p className="text-sm text-muted-foreground mb-1">Engagement Score</p>
                        <Progress value={user.engagementScore} className="h-2" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Recommended Actions:</p>
                        <div className="space-y-1">
                          {user.recommendedInterventions.map((action, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <ChevronRight className="h-3 w-3" />
                              {action}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* All User Predictions */}
          <Card>
            <CardHeader>
              <CardTitle>User Behavior Predictions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userPredictions.map((user) => (
                  <div key={user.userId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{user.userName}</h4>
                      <p className="text-sm text-muted-foreground">
                        Likely actions: {user.likelyActions.join(', ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-sm font-medium">Churn Risk</p>
                        <Badge variant={user.churnRisk > 60 ? 'destructive' : user.churnRisk > 30 ? 'outline' : 'secondary'}>
                          {user.churnRisk}%
                        </Badge>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">Engagement</p>
                        <Badge variant="outline">{user.engagementScore}/100</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tournament Forecasts */}
        <TabsContent value="forecasts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {tournamentForecasts.map((forecast) => (
              <Card key={forecast.tournamentId}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {forecast.tournamentName}
                    <Badge variant={forecast.successProbability > 80 ? 'default' : 'outline'}>
                      {forecast.successProbability}% success
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Predicted Participants</p>
                      <p className="text-2xl font-bold">{forecast.predictedParticipants}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Revenue Estimate</p>
                      <p className="text-2xl font-bold">{(forecast.revenueEstimate / 1000000).toFixed(1)}M VND</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-2">Success Probability</p>
                    <Progress value={forecast.successProbability} className="h-3" />
                  </div>

                  {forecast.riskFactors.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Risk Factors</p>
                      <div className="space-y-1">
                        {forecast.riskFactors.map((risk, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <AlertTriangle className="h-3 w-3" />
                            {risk}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Trend Analysis */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Engagement Trend Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={engagementTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="actual" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Actual Engagement"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="predicted" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Predicted Engagement"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Anomaly Detection */}
        <TabsContent value="anomalies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detected Anomalies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {anomalies.map((anomaly, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{anomaly.type}</h4>
                        <p className="text-sm text-muted-foreground">{anomaly.description}</p>
                      </div>
                      <Badge className={getSeverityColor(anomaly.severity)}>
                        {anomaly.severity}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium mb-2">Affected Metrics</p>
                        <div className="space-y-1">
                          {anomaly.affectedMetrics.map((metric, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <Activity className="h-3 w-3" />
                              {metric}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-2">Suggested Actions</p>
                        <div className="space-y-1">
                          {anomaly.suggestedActions.map((action, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <Lightbulb className="h-3 w-3" />
                              {action}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-3">
                      Detected: {new Date(anomaly.detectedAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};