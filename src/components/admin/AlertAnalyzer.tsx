import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Brain, TrendingUp, AlertTriangle, CheckCircle, XCircle, Clock, Zap } from 'lucide-react';

interface SystemAlert {
  id: string;
  type: 'performance' | 'error' | 'security' | 'automation' | 'resource';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'investigating' | 'resolved' | 'acknowledged';
  firstSeen: Date;
  lastSeen: Date;
  occurrences: number;
  pattern?: {
    frequency: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    prediction: string;
  };
  recommendations?: string[];
  automatedActions?: string[];
}

interface AlertAnalysis {
  totalAlerts: number;
  activeAlerts: number;
  criticalAlerts: number;
  resolvedToday: number;
  averageResolutionTime: number;
  topIssues: Array<{ type: string; count: number; trend: string }>;
  aiInsights: string[];
  predictedIssues: Array<{ issue: string; probability: number; eta: string }>;
}

export const AlertAnalyzer = () => {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [analysis, setAnalysis] = useState<AlertAnalysis>({
    totalAlerts: 0,
    activeAlerts: 0,
    criticalAlerts: 0,
    resolvedToday: 0,
    averageResolutionTime: 0,
    topIssues: [],
    aiInsights: [],
    predictedIssues: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'critical'>('all');

  useEffect(() => {
    loadAlertsAndAnalysis();
    const interval = setInterval(loadAlertsAndAnalysis, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const loadAlertsAndAnalysis = async () => {
    try {
      setIsLoading(true);
      
      // Simulate alert data (in real app, this would come from monitoring systems)
      const simulatedAlerts: SystemAlert[] = [
        {
          id: '1',
          type: 'performance',
          title: 'High API Response Time',
          description: 'API endpoint /api/tournaments taking longer than 2 seconds',
          severity: 'high',
          status: 'active',
          firstSeen: new Date(Date.now() - 2 * 60 * 60 * 1000),
          lastSeen: new Date(Date.now() - 5 * 60 * 1000),
          occurrences: 15,
          pattern: {
            frequency: 0.3,
            trend: 'increasing',
            prediction: 'Expected to worsen during peak hours'
          },
          recommendations: [
            'Add database indexing for tournament queries',
            'Implement Redis caching for frequent requests',
            'Consider API rate limiting'
          ],
          automatedActions: ['Scaling up database resources', 'Cache warming initiated']
        },
        {
          id: '2',
          type: 'error',
          title: 'Payment Processing Errors',
          description: 'Increased error rate in VNPAY integration',
          severity: 'critical',
          status: 'investigating',
          firstSeen: new Date(Date.now() - 45 * 60 * 1000),
          lastSeen: new Date(Date.now() - 2 * 60 * 1000),
          occurrences: 8,
          pattern: {
            frequency: 0.15,
            trend: 'stable',
            prediction: 'May be related to external service downtime'
          },
          recommendations: [
            'Check VNPAY service status',
            'Implement fallback payment method',
            'Add detailed error logging'
          ],
          automatedActions: ['Fallback payment gateway activated', 'Alert sent to payment team']
        },
        {
          id: '3',
          type: 'automation',
          title: 'Tournament Auto-bracketing Failed',
          description: 'Bracket generation failed for tournament ID: T-2024-001',
          severity: 'medium',
          status: 'active',
          firstSeen: new Date(Date.now() - 20 * 60 * 1000),
          lastSeen: new Date(Date.now() - 20 * 60 * 1000),
          occurrences: 1,
          recommendations: [
            'Check participant data integrity',
            'Verify bracket generation algorithm',
            'Enable manual bracket override'
          ]
        },
        {
          id: '4',
          type: 'resource',
          title: 'High Memory Usage',
          description: 'Memory usage exceeded 85% threshold',
          severity: 'medium',
          status: 'acknowledged',
          firstSeen: new Date(Date.now() - 3 * 60 * 60 * 1000),
          lastSeen: new Date(Date.now() - 10 * 60 * 1000),
          occurrences: 23,
          pattern: {
            frequency: 0.2,
            trend: 'decreasing',
            prediction: 'Memory leaks in image processing component'
          },
          automatedActions: ['Memory cleanup task scheduled', 'Component restart initiated']
        }
      ];

      // Generate AI analysis
      const aiAnalysis: AlertAnalysis = {
        totalAlerts: simulatedAlerts.length,
        activeAlerts: simulatedAlerts.filter(a => a.status === 'active').length,
        criticalAlerts: simulatedAlerts.filter(a => a.severity === 'critical').length,
        resolvedToday: Math.floor(Math.random() * 10) + 5,
        averageResolutionTime: Math.floor(Math.random() * 60) + 30,
        topIssues: [
          { type: 'Performance', count: 12, trend: 'increasing' },
          { type: 'Database', count: 8, trend: 'stable' },
          { type: 'API Errors', count: 6, trend: 'decreasing' },
          { type: 'Memory', count: 4, trend: 'decreasing' }
        ],
        aiInsights: [
          'Performance degradation correlates with increased user activity during tournament registrations',
          'Database query optimization could reduce 70% of current performance alerts',
          'Payment errors spike during weekend peak hours - consider load balancing',
          'Memory usage patterns suggest potential leak in image upload component'
        ],
        predictedIssues: [
          { issue: 'Database connection pool exhaustion', probability: 0.85, eta: '2 hours' },
          { issue: 'API rate limit exceeded', probability: 0.65, eta: '4 hours' },
          { issue: 'Storage capacity warning', probability: 0.45, eta: '24 hours' }
        ]
      };

      setAlerts(simulatedAlerts);
      setAnalysis(aiAnalysis);
      
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredAlerts = () => {
    switch (selectedFilter) {
      case 'active':
        return alerts.filter(a => a.status === 'active');
      case 'critical':
        return alerts.filter(a => a.severity === 'critical');
      default:
        return alerts;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'investigating': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'acknowledged': return <AlertTriangle className="h-4 w-4 text-blue-600" />;
      default: return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const handleAlertAction = async (alertId: string, action: 'acknowledge' | 'resolve' | 'investigate') => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, status: action === 'acknowledge' ? 'acknowledged' : action === 'resolve' ? 'resolved' : 'investigating' }
        : alert
    ));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analysis.totalAlerts}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{analysis.activeAlerts}</div>
            <p className="text-xs text-muted-foreground">Requiring attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{analysis.criticalAlerts}</div>
            <p className="text-xs text-muted-foreground">High priority</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{analysis.resolvedToday}</div>
            <p className="text-xs text-muted-foreground">Avg. {analysis.averageResolutionTime}min resolution</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Analysis Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI-Powered Analysis
          </CardTitle>
          <CardDescription>Intelligent insights and predictions based on system patterns</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* AI Insights */}
          <div>
            <h4 className="font-medium mb-3">Key Insights</h4>
            <div className="space-y-2">
              {analysis.aiInsights.map((insight, index) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                  <Zap className="h-4 w-4 mt-0.5 text-blue-600" />
                  <span className="text-sm">{insight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Predictions */}
          <div>
            <h4 className="font-medium mb-3">Predicted Issues</h4>
            <div className="space-y-3">
              {analysis.predictedIssues.map((prediction, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{prediction.issue}</div>
                    <div className="text-xs text-muted-foreground">ETA: {prediction.eta}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{(prediction.probability * 100).toFixed(0)}%</div>
                    <Progress value={prediction.probability * 100} className="w-20 h-2 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Issues */}
          <div>
            <h4 className="font-medium mb-3">Issue Categories</h4>
            <div className="grid grid-cols-2 gap-4">
              {analysis.topIssues.map((issue, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">{issue.type}</div>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className={`h-3 w-3 ${
                        issue.trend === 'increasing' ? 'text-red-500' : 
                        issue.trend === 'decreasing' ? 'text-green-500' : 'text-gray-500'
                      }`} />
                      <span className="text-xs text-muted-foreground">{issue.trend}</span>
                    </div>
                  </div>
                  <Badge variant="outline">{issue.count}</Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert Filters */}
      <div className="flex gap-2">
        <Button
          variant={selectedFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedFilter('all')}
        >
          All Alerts
        </Button>
        <Button
          variant={selectedFilter === 'active' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedFilter('active')}
        >
          Active ({analysis.activeAlerts})
        </Button>
        <Button
          variant={selectedFilter === 'critical' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedFilter('critical')}
        >
          Critical ({analysis.criticalAlerts})
        </Button>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {getFilteredAlerts().map((alert) => (
          <Card key={alert.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`w-3 h-3 rounded-full mt-1 ${getSeverityColor(alert.severity)}`} />
                  <div>
                    <CardTitle className="text-base">{alert.title}</CardTitle>
                    <CardDescription className="mt-1">{alert.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(alert.status)}
                  <Badge variant={alert.severity === 'critical' ? 'destructive' : 'outline'}>
                    {alert.severity.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Alert Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">First Seen</div>
                  <div>{alert.firstSeen.toLocaleTimeString()}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Last Seen</div>
                  <div>{alert.lastSeen.toLocaleTimeString()}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Occurrences</div>
                  <div>{alert.occurrences}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Status</div>
                  <div className="capitalize">{alert.status}</div>
                </div>
              </div>

              {/* Pattern Analysis */}
              {alert.pattern && (
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="text-sm font-medium mb-2">Pattern Analysis</div>
                  <div className="text-sm text-muted-foreground">
                    Frequency: {(alert.pattern.frequency * 100).toFixed(1)}% • 
                    Trend: {alert.pattern.trend} • 
                    {alert.pattern.prediction}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {alert.recommendations && alert.recommendations.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">Recommendations</div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {alert.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span>•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Automated Actions */}
              {alert.automatedActions && alert.automatedActions.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">Automated Actions Taken</div>
                  <div className="flex flex-wrap gap-2">
                    {alert.automatedActions.map((action, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {action}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {alert.status === 'active' && (
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAlertAction(alert.id, 'acknowledge')}
                  >
                    Acknowledge
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAlertAction(alert.id, 'investigate')}
                  >
                    Investigate
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleAlertAction(alert.id, 'resolve')}
                  >
                    Mark Resolved
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {getFilteredAlerts().length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No alerts found for the selected filter.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};