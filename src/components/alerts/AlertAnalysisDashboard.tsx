import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  Brain, 
  MessageSquare, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap,
  Shield,
  Activity,
  Users,
  Database,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Alert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: string;
  status: 'active' | 'resolved' | 'acknowledged';
  source: string;
  metadata?: any;
}

interface AlertAnalysis {
  severity: string;
  urgency: string;
  category: string;
  root_cause_analysis: string;
  impact_assessment: string;
  recommended_actions: string[];
  priority_score: number;
  summary: string;
  technical_details: string;
  estimated_resolution_time: string;
  related_patterns: string[];
}

export const AlertAnalysisDashboard: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [analysis, setAnalysis] = useState<AlertAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [chatQuery, setChatQuery] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [predictions, setPredictions] = useState<any>(null);

  // Mock data cho demo
  useEffect(() => {
    const mockAlerts: Alert[] = [
      {
        id: '1',
        type: 'performance',
        severity: 'high',
        title: 'High Database Response Time',
        description: 'Database queries taking >2s on average',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        status: 'active',
        source: 'database-monitor',
        metadata: { avg_response_time: '2.3s', affected_queries: 15 }
      },
      {
        id: '2',
        type: 'user_experience',
        severity: 'medium',
        title: 'Tournament Registration Errors',
        description: 'Multiple users reporting registration failures',
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        status: 'acknowledged',
        source: 'application-monitor',
        metadata: { error_count: 23, affected_users: 8 }
      },
      {
        id: '3',
        type: 'security',
        severity: 'critical',
        title: 'Suspicious Login Attempts',
        description: 'High volume of failed login attempts detected',
        timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        status: 'active',
        source: 'security-monitor',
        metadata: { attempts: 156, unique_ips: 12 }
      }
    ];
    setAlerts(mockAlerts);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'acknowledged': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <XCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance': return <TrendingUp className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      case 'business': return <Users className="h-4 w-4" />;
      case 'system': return <Database className="h-4 w-4" />;
      case 'user_experience': return <Activity className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const analyzeAlert = async (alert: Alert) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-alert-analyzer', {
        body: {
          action: 'analyze_alert',
          data: {
            alertData: alert,
            context: {
              system_status: 'operational',
              recent_alerts: alerts.slice(-5),
              current_load: 'medium'
            }
          }
        }
      });

      if (error) throw error;

      setAnalysis(data.analysis);
      toast.success('Phân tích alert hoàn tất!');
    } catch (error: any) {
      console.error('Error analyzing alert:', error);
      toast.error('Lỗi phân tích alert: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const chatWithAI = async () => {
    if (!chatQuery.trim()) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-alert-analyzer', {
        body: {
          action: 'chat_query',
          data: {
            query: chatQuery,
            alertContext: {
              active_alerts: alerts.filter(a => a.status === 'active'),
              selected_alert: selectedAlert,
              current_analysis: analysis
            }
          }
        }
      });

      if (error) throw error;

      setChatResponse(data.response);
      setChatQuery('');
    } catch (error: any) {
      console.error('Error chatting with AI:', error);
      toast.error('Lỗi chat với AI: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const generatePredictions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-alert-analyzer', {
        body: {
          action: 'predict_incidents',
          data: {
            systemMetrics: {
              cpu_usage: 72,
              memory_usage: 85,
              disk_usage: 65,
              network_io: 'high',
              active_connections: 1247,
              error_rate: 0.1
            },
            alertHistory: alerts
          }
        }
      });

      if (error) throw error;

      setPredictions(data.predictions);
      toast.success('Dự đoán incidents đã được tạo!');
    } catch (error: any) {
      console.error('Error generating predictions:', error);
      toast.error('Lỗi tạo dự đoán: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI-Powered Alert Analysis</h2>
          <p className="text-muted-foreground">
            Intelligent alert monitoring với OpenAI integration
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={generatePredictions} disabled={loading}>
            <Brain className="h-4 w-4 mr-2" />
            Predict Incidents
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alert List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Active Alerts ({alerts.filter(a => a.status === 'active').length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedAlert?.id === alert.id 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedAlert(alert)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                      {getStatusIcon(alert.status)}
                    </div>
                    <h4 className="font-medium text-sm">{alert.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {alert.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(alert.timestamp).toLocaleString('vi-VN')}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Alert Details & Analysis */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Analysis & Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedAlert ? (
              <Tabs defaultValue="details" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="details">Alert Details</TabsTrigger>
                  <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
                  <TabsTrigger value="chat">Ask AI</TabsTrigger>
                  <TabsTrigger value="predictions">Predictions</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Badge className={getSeverityColor(selectedAlert.severity)}>
                        {selectedAlert.severity.toUpperCase()}
                      </Badge>
                      {getStatusIcon(selectedAlert.status)}
                      <span className="text-sm text-muted-foreground">
                        {selectedAlert.source}
                      </span>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold">{selectedAlert.title}</h3>
                      <p className="text-muted-foreground mt-1">
                        {selectedAlert.description}
                      </p>
                    </div>

                    {selectedAlert.metadata && (
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <h4 className="font-medium mb-2">Metadata</h4>
                        <pre className="text-xs">
                          {JSON.stringify(selectedAlert.metadata, null, 2)}
                        </pre>
                      </div>
                    )}

                    <Button 
                      onClick={() => analyzeAlert(selectedAlert)}
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Brain className="h-4 w-4 mr-2" />
                      )}
                      Analyze with AI
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="analysis" className="space-y-4">
                  {analysis ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(analysis.category)}
                            <span className="font-medium">Category</span>
                          </div>
                          <Badge>{analysis.category}</Badge>
                        </div>
                        <div className="space-y-2">
                          <span className="font-medium">Priority Score</span>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full"
                                style={{ width: `${analysis.priority_score}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">
                              {analysis.priority_score}/100
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium mb-2">AI Summary</h4>
                          <p className="text-sm bg-muted/50 p-3 rounded-lg">
                            {analysis.summary}
                          </p>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Root Cause Analysis</h4>
                          <p className="text-sm bg-muted/50 p-3 rounded-lg">
                            {analysis.root_cause_analysis}
                          </p>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Recommended Actions</h4>
                          <div className="space-y-2">
                            {analysis.recommended_actions.map((action, index) => (
                              <div key={index} className="flex items-start gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                <span>{action}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>Est. Resolution: {analysis.estimated_resolution_time}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Zap className="h-4 w-4" />
                            <span>Urgency: {analysis.urgency}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Chọn "Analyze with AI" để xem phân tích chi tiết</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="chat" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Ask AI Assistant</h4>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={chatQuery}
                          onChange={(e) => setChatQuery(e.target.value)}
                          placeholder="Hỏi AI về alert này..."
                          className="flex-1 px-3 py-2 border rounded-md"
                          onKeyPress={(e) => e.key === 'Enter' && chatWithAI()}
                        />
                        <Button onClick={chatWithAI} disabled={loading || !chatQuery.trim()}>
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {chatResponse && (
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <h5 className="font-medium mb-2 flex items-center gap-2">
                          <Brain className="h-4 w-4" />
                          AI Response
                        </h5>
                        <div className="text-sm whitespace-pre-wrap">
                          {chatResponse}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="predictions" className="space-y-4">
                  {predictions ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Incident Predictions</h4>
                        <Badge variant="outline">
                          Risk Score: {predictions.overall_risk_score}/100
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        {predictions.predictions?.map((prediction: any, index: number) => (
                          <div key={index} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{prediction.incident_type}</span>
                              <Badge className={
                                prediction.probability > 0.7 ? 'bg-red-100 text-red-800' :
                                prediction.probability > 0.4 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }>
                                {Math.round(prediction.probability * 100)}%
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {prediction.description}
                            </p>
                            <div className="text-xs text-muted-foreground">
                              Timeframe: {prediction.estimated_timeframe} | 
                              Impact: {prediction.potential_impact}
                            </div>
                          </div>
                        ))}
                      </div>

                      {predictions.recommendations && (
                        <div>
                          <h5 className="font-medium mb-2">Recommendations</h5>
                          <div className="space-y-1">
                            {predictions.recommendations.map((rec: string, index: number) => (
                              <div key={index} className="text-sm flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                <span>{rec}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Click "Predict Incidents" để xem dự đoán AI</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <AlertTriangle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Chọn một alert để xem chi tiết và phân tích AI</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};