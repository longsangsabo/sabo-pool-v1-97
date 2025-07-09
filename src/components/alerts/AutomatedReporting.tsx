import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Download, 
  Calendar, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  LineChart,
  Mail,
  Bell,
  Settings,
  Brain,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Report {
  id: string;
  title: string;
  type: 'daily' | 'weekly' | 'monthly' | 'incident';
  content: string;
  generated_at: string;
  status: 'draft' | 'completed' | 'sent';
  recipients?: string[];
  metadata?: any;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  schedule: string;
  enabled: boolean;
  recipients: string[];
}

export const AutomatedReporting: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  // Mock data cho demo
  useEffect(() => {
    const mockReports: Report[] = [
      {
        id: '1',
        title: 'Daily System Health Report - 09/01/2025',
        type: 'daily',
        content: `# Báo cáo Sức khỏe Hệ thống Hàng ngày
## Tổng quan
- **Trạng thái tổng thể**: ✅ Ổn định
- **Uptime**: 99.8%
- **Alerts tổng cộng**: 5 (2 resolved, 3 monitoring)

## Chi tiết Alerts
### High Priority
- Database response time spike: 2.3s (Resolved 14:30)
- Memory usage warning: 85% (Monitoring)

### Recommendations
1. Optimize database queries cho tournament registration
2. Consider memory upgrade cho production server
3. Implement caching layer cho frequently accessed data`,
        generated_at: new Date().toISOString(),
        status: 'completed'
      },
      {
        id: '2',
        title: 'Weekly Performance Summary',
        type: 'weekly',
        content: '# Weekly Performance Report\n\nDetailed analysis of system performance trends...',
        generated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        status: 'sent'
      }
    ];

    const mockTemplates: ReportTemplate[] = [
      {
        id: '1',
        name: 'Daily Health Check',
        description: 'Automated daily system health and alerts summary',
        schedule: 'Daily 9:00 AM',
        enabled: true,
        recipients: ['admin@sabopool.com', 'devops@sabopool.com']
      },
      {
        id: '2',
        name: 'Weekly Performance Report',
        description: 'Comprehensive weekly performance analysis with trends',
        schedule: 'Monday 10:00 AM',
        enabled: true,
        recipients: ['management@sabopool.com']
      },
      {
        id: '3',
        name: 'Incident Post-mortem',
        description: 'Auto-generated post-mortem for critical incidents',
        schedule: 'Triggered by incidents',
        enabled: true,
        recipients: ['tech-team@sabopool.com']
      }
    ];

    setReports(mockReports);
    setTemplates(mockTemplates);
  }, []);

  const generateReport = async (type: string) => {
    setGeneratingReport(true);
    try {
      // Mock alert data
      const alertsData = [
        { id: '1', severity: 'high', type: 'performance', resolved: true },
        { id: '2', severity: 'medium', type: 'user_experience', resolved: false },
        { id: '3', severity: 'low', type: 'system', resolved: true }
      ];

      const { data, error } = await supabase.functions.invoke('ai-alert-analyzer', {
        body: {
          action: 'generate_summary',
          data: {
            alerts: alertsData,
            timeframe: type === 'daily' ? '24 hours' : type === 'weekly' ? '7 days' : '30 days'
          }
        }
      });

      if (error) throw error;

      const newReport: Report = {
        id: Date.now().toString(),
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} Report - ${new Date().toLocaleDateString('vi-VN')}`,
        type: type as any,
        content: data.summary,
        generated_at: new Date().toISOString(),
        status: 'completed'
      };

      setReports(prev => [newReport, ...prev]);
      toast.success('Report đã được tạo thành công!');
    } catch (error: any) {
      console.error('Error generating report:', error);
      toast.error('Lỗi tạo report: ' + error.message);
    } finally {
      setGeneratingReport(false);
    }
  };

  const downloadReport = (report: Report) => {
    const blob = new Blob([report.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Report downloaded!');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'daily': return <Calendar className="h-4 w-4" />;
      case 'weekly': return <BarChart3 className="h-4 w-4" />;
      case 'monthly': return <PieChart className="h-4 w-4" />;
      case 'incident': return <AlertTriangle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Automated Reporting</h2>
          <p className="text-muted-foreground">
            AI-powered automated reports và post-mortem generation
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => generateReport('daily')} disabled={generatingReport}>
            <Brain className="h-4 w-4 mr-2" />
            Generate Daily Report
          </Button>
          <Button variant="outline" onClick={() => generateReport('weekly')} disabled={generatingReport}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Weekly Report
          </Button>
        </div>
      </div>

      <Tabs defaultValue="reports" className="space-y-6">
        <TabsList>
          <TabsTrigger value="reports">Generated Reports</TabsTrigger>
          <TabsTrigger value="templates">Report Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Report List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent Reports ({reports.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {reports.map((report) => (
                      <div
                        key={report.id}
                        className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(report.type)}
                            <span className="font-medium text-sm">{report.title}</span>
                          </div>
                          <Badge className={getStatusColor(report.status)}>
                            {report.status}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(report.generated_at).toLocaleString('vi-VN')}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadReport(report)}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Report Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Report Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reports.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{reports[0].title}</h3>
                      <Badge className={getStatusColor(reports[0].status)}>
                        {reports[0].status}
                      </Badge>
                    </div>
                    
                    <ScrollArea className="h-80">
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <pre className="text-sm whitespace-pre-wrap font-mono">
                          {reports[0].content}
                        </pre>
                      </div>
                    </ScrollArea>

                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => downloadReport(reports[0])}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      <Button variant="outline" size="sm">
                        <Mail className="h-4 w-4 mr-2" />
                        Send Email
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>No reports generated yet</p>
                    <p className="text-sm">Click "Generate Daily Report" to create your first report</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <Badge variant={template.enabled ? 'default' : 'secondary'}>
                      {template.enabled ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {template.description}
                  </p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{template.schedule}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{template.recipients.length} recipients</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Run Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Reports Generated</p>
                    <p className="text-2xl font-bold">24</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Auto-generated</p>
                    <p className="text-2xl font-bold">87%</p>
                  </div>
                  <Brain className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Generation Time</p>
                    <p className="text-2xl font-bold">12s</p>
                  </div>
                  <Clock className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Report Generation Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <LineChart className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Report analytics chart would be here</p>
                  <p className="text-sm">Showing generation trends, success rates, and performance metrics</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {generatingReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardContent className="p-6 text-center">
              <Brain className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
              <h3 className="font-semibold mb-2">Generating AI Report</h3>
              <p className="text-sm text-muted-foreground mb-4">
                AI đang phân tích alerts và tạo báo cáo chi tiết...
              </p>
              <div className="flex items-center justify-center gap-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};