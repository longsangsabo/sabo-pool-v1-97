import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Lightbulb, 
  Users, 
  Trophy, 
  Target, 
  TrendingUp,
  Calendar,
  DollarSign,
  ChevronRight,
  Star,
  AlertCircle
} from 'lucide-react';

interface Recommendation {
  id: string;
  type: 'tournament' | 'engagement' | 'revenue' | 'retention' | 'performance';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  expectedImpact: string;
  timeToImplement: string;
  estimatedROI: number;
  tags: string[];
  actions: RecommendationAction[];
}

interface RecommendationAction {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

interface AIInsight {
  id: string;
  category: string;
  insight: string;
  dataPoints: string[];
  relevantMetrics: { name: string; value: string; trend: 'up' | 'down' | 'stable' }[];
}

export const RecommendationEngine: React.FC = () => {
  const [recommendations] = useState<Recommendation[]>([
    {
      id: '1',
      type: 'engagement',
      title: 'Implement Weekly Challenge System',
      description: 'Data shows 40% drop in user engagement after initial week. Weekly challenges can increase retention by 60%.',
      priority: 'high',
      confidence: 87,
      expectedImpact: 'Increase weekly active users by 35%',
      timeToImplement: '2-3 weeks',
      estimatedROI: 240,
      tags: ['User Retention', 'Engagement', 'Gamification'],
      actions: [
        { id: '1a', title: 'Design challenge mechanics', description: 'Create progressive difficulty challenges', completed: false },
        { id: '1b', title: 'Implement reward system', description: 'Define points and badges for completion', completed: false },
        { id: '1c', title: 'Create weekly themes', description: 'Skill-based and fun challenges', completed: false }
      ]
    },
    {
      id: '2',
      type: 'tournament',
      title: 'Optimize Tournament Pricing Strategy',
      description: 'Price elasticity analysis suggests 20% increase in participation with dynamic pricing model.',
      priority: 'medium',
      confidence: 92,
      expectedImpact: 'Increase tournament revenue by 28%',
      timeToImplement: '1-2 weeks',
      estimatedROI: 180,
      tags: ['Revenue Optimization', 'Tournament Management', 'Pricing'],
      actions: [
        { id: '2a', title: 'Implement dynamic pricing', description: 'Early bird and last-minute pricing', completed: true },
        { id: '2b', title: 'Create tier-based entry fees', description: 'Different skill level pricing', completed: false },
        { id: '2c', title: 'Add group discounts', description: 'Team registration incentives', completed: false }
      ]
    },
    {
      id: '3',
      type: 'retention',
      title: 'Personalized Onboarding Flow',
      description: 'Users who complete personalized onboarding show 85% higher 30-day retention rates.',
      priority: 'critical',
      confidence: 95,
      expectedImpact: 'Reduce churn rate by 45%',
      timeToImplement: '3-4 weeks',
      estimatedROI: 320,
      tags: ['User Onboarding', 'Personalization', 'Churn Reduction'],
      actions: [
        { id: '3a', title: 'Skill assessment flow', description: 'Interactive skill level detection', completed: false },
        { id: '3b', title: 'Personalized recommendations', description: 'Tailored tournament and challenge suggestions', completed: false },
        { id: '3c', title: 'Progress tracking system', description: 'Visual progress indicators', completed: false }
      ]
    },
    {
      id: '4',
      type: 'revenue',
      title: 'Introduce Premium Club Memberships',
      description: 'Market analysis shows potential for premium tier with exclusive features and tournaments.',
      priority: 'medium',
      confidence: 78,
      expectedImpact: 'Generate additional 15% monthly revenue',
      timeToImplement: '4-6 weeks',
      estimatedROI: 200,
      tags: ['Premium Features', 'Subscription Model', 'Club Benefits'],
      actions: [
        { id: '4a', title: 'Define premium features', description: 'Exclusive tournaments, analytics, coaching', completed: false },
        { id: '4b', title: 'Create subscription tiers', description: 'Monthly and annual plans', completed: false },
        { id: '4c', title: 'Implement payment system', description: 'Recurring billing and management', completed: false }
      ]
    }
  ]);

  const [aiInsights] = useState<AIInsight[]>([
    {
      id: '1',
      category: 'User Behavior',
      insight: 'Users who participate in their first tournament within 7 days have 3x higher lifetime value',
      dataPoints: [
        'New user tournament participation rate: 23%',
        'Average time to first tournament: 12 days',
        'Early adopter LTV: $45 vs Regular user LTV: $15'
      ],
      relevantMetrics: [
        { name: 'First Tournament Rate', value: '23%', trend: 'down' },
        { name: 'Time to Tournament', value: '12 days', trend: 'stable' },
        { name: 'LTV Difference', value: '3x', trend: 'up' }
      ]
    },
    {
      id: '2',
      category: 'Revenue Optimization',
      insight: 'Tournament entry fees show price elasticity sweet spot at 50,000 VND with 35% higher participation',
      dataPoints: [
        'Current average entry fee: 75,000 VND',
        'Optimal participation price: 50,000 VND',
        'Revenue increase potential: 28%'
      ],
      relevantMetrics: [
        { name: 'Current Participation', value: '64%', trend: 'down' },
        { name: 'Optimal Price Point', value: '50K VND', trend: 'stable' },
        { name: 'Revenue Impact', value: '+28%', trend: 'up' }
      ]
    },
    {
      id: '3',
      category: 'Engagement Patterns',
      insight: 'Peak engagement occurs on weekends between 7-10 PM, suggesting optimal tournament scheduling',
      dataPoints: [
        'Weekend engagement: 340% higher than weekdays',
        'Peak hours: 7-10 PM (UTC+7)',
        'Tournament completion rate: 89% during peak vs 64% off-peak'
      ],
      relevantMetrics: [
        { name: 'Weekend Activity', value: '+340%', trend: 'up' },
        { name: 'Peak Hour Usage', value: '7-10 PM', trend: 'stable' },
        { name: 'Completion Rate', value: '89%', trend: 'up' }
      ]
    }
  ]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'tournament': return <Trophy className="h-4 w-4" />;
      case 'engagement': return <Users className="h-4 w-4" />;
      case 'revenue': return <DollarSign className="h-4 w-4" />;
      case 'retention': return <Target className="h-4 w-4" />;
      case 'performance': return <TrendingUp className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down': return <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />;
      case 'stable': return <div className="h-3 w-3 rounded-full bg-gray-400" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Lightbulb className="h-6 w-6" />
          AI Recommendation Engine
        </h2>
        <p className="text-muted-foreground">
          Intelligent recommendations powered by machine learning and data analysis
        </p>
      </div>

      {/* Priority Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>High Priority Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recommendations
              .filter(r => r.priority === 'critical' || r.priority === 'high')
              .map((rec) => (
              <div key={rec.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    {getTypeIcon(rec.type)}
                    <div>
                      <h4 className="font-semibold">{rec.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                    </div>
                  </div>
                  <Badge className={getPriorityColor(rec.priority)}>
                    {rec.priority}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Confidence</p>
                    <div className="flex items-center gap-2">
                      <Progress value={rec.confidence} className="h-2 flex-1" />
                      <span className="text-sm font-medium">{rec.confidence}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Expected Impact</p>
                    <p className="text-sm">{rec.expectedImpact}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Time to Implement</p>
                    <p className="text-sm">{rec.timeToImplement}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Estimated ROI</p>
                    <p className="text-sm font-semibold text-green-600">+{rec.estimatedROI}%</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {rec.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Action Items:</p>
                  <div className="space-y-2">
                    {rec.actions.map((action) => (
                      <div key={action.id} className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          action.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'
                        }`}>
                          {action.completed && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm ${action.completed ? 'line-through text-muted-foreground' : ''}`}>
                            {action.title}
                          </p>
                          <p className="text-xs text-muted-foreground">{action.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle>AI-Generated Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {aiInsights.map((insight) => (
              <div key={insight.id} className="p-4 border rounded-lg">
                <div className="flex items-start gap-3 mb-4">
                  <Star className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <Badge variant="outline" className="mb-2">{insight.category}</Badge>
                    <p className="font-medium">{insight.insight}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Supporting Data:</p>
                    <div className="space-y-1">
                      {insight.dataPoints.map((point, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <ChevronRight className="h-3 w-3" />
                          {point}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Key Metrics:</p>
                    <div className="space-y-2">
                      {insight.relevantMetrics.map((metric, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getTrendIcon(metric.trend)}
                            <span className="text-sm">{metric.name}</span>
                          </div>
                          <span className="text-sm font-medium">{metric.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* All Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>All Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recommendations.map((rec) => (
              <div key={rec.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getTypeIcon(rec.type)}
                  <div>
                    <h4 className="font-medium">{rec.title}</h4>
                    <p className="text-sm text-muted-foreground">{rec.expectedImpact}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Confidence</p>
                    <p className="text-sm font-medium">{rec.confidence}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">ROI</p>
                    <p className="text-sm font-medium text-green-600">+{rec.estimatedROI}%</p>
                  </div>
                  <Badge className={getPriorityColor(rec.priority)}>
                    {rec.priority}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};