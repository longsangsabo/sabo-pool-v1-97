import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Search, 
  Calendar, 
  User, 
  Activity, 
  AlertTriangle,
  Eye,
  Download,
  Filter,
  Clock,
  Database
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuditLog {
  id: string;
  user_id: string;
  action_type: string;
  table_name: string;
  record_id: string;
  old_values: any;
  new_values: any;
  ip_address: string;
  user_agent: string;
  timestamp: string;
  user?: {
    full_name: string;
    email: string;
  };
}

interface SystemLog {
  id: string;
  log_type: string;
  severity: string;
  message: string;
  metadata: any;
  timestamp: string;
  resolved: boolean;
}

interface AuditStats {
  totalLogs: number;
  todayLogs: number;
  criticalEvents: number;
  uniqueUsers: number;
  topActions: Array<{ action: string; count: number }>;
}

const AuditLoggingSystem = () => {
  const { user } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [auditStats, setAuditStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    action_type: '',
    date_from: '',
    date_to: '',
    user_id: '',
    severity: ''
  });

  useEffect(() => {
    fetchAuditLogs();
    fetchSystemLogs();
    fetchAuditStats();
  }, [filters]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          user:profiles(full_name, email)
        `)
        .order('timestamp', { ascending: false })
        .limit(100);

      // Apply filters
      if (filters.action_type) {
        query = query.eq('action_type', filters.action_type);
      }
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      if (filters.date_from) {
        query = query.gte('timestamp', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('timestamp', filters.date_to);
      }
      if (filters.search) {
        query = query.or(`message.ilike.%${filters.search}%,table_name.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      setAuditLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error('Lỗi khi tải audit logs');
    }
    setLoading(false);
  };

  const fetchSystemLogs = async () => {
    try {
      let query = supabase
        .from('system_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (filters.severity) {
        query = query.eq('severity', filters.severity);
      }

      const { data, error } = await query;
      if (error) throw error;

      setSystemLogs(data || []);
    } catch (error) {
      console.error('Error fetching system logs:', error);
    }
  };

  const fetchAuditStats = async () => {
    try {
      // Get total logs count
      const { count: totalLogs } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true });

      // Get today's logs count
      const today = new Date().toISOString().split('T')[0];
      const { count: todayLogs } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', today);

      // Get critical events count
      const { count: criticalEvents } = await supabase
        .from('system_logs')
        .select('*', { count: 'exact', head: true })
        .eq('severity', 'critical')
        .eq('resolved', false);

      // Get unique users count
      const { data: uniqueUsersData } = await supabase
        .from('audit_logs')
        .select('user_id')
        .not('user_id', 'is', null);

      const uniqueUsers = new Set(uniqueUsersData?.map(log => log.user_id)).size;

      // Get top actions
      const { data: actionsData } = await supabase
        .from('audit_logs')
        .select('action_type')
        .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const actionCounts = actionsData?.reduce((acc: any, log) => {
        acc[log.action_type] = (acc[log.action_type] || 0) + 1;
        return acc;
      }, {});

      const topActions = Object.entries(actionCounts || {})
        .map(([action, count]) => ({ action, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setAuditStats({
        totalLogs: totalLogs || 0,
        todayLogs: todayLogs || 0,
        criticalEvents: criticalEvents || 0,
        uniqueUsers,
        topActions
      });
    } catch (error) {
      console.error('Error fetching audit stats:', error);
    }
  };

  const logAuditEvent = async (
    actionType: string,
    tableName: string,
    recordId: string,
    oldValues?: any,
    newValues?: any
  ) => {
    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: user?.id,
          action_type: actionType,
          table_name: tableName,
          record_id: recordId,
          old_values: oldValues,
          new_values: newValues,
          ip_address: await getUserIP(),
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging audit event:', error);
    }
  };

  const logSystemEvent = async (
    logType: string,
    severity: 'info' | 'warning' | 'error' | 'critical',
    message: string,
    metadata?: any
  ) => {
    try {
      const { error } = await supabase
        .from('system_logs')
        .insert({
          log_type: logType,
          severity,
          message,
          metadata,
          timestamp: new Date().toISOString(),
          resolved: false
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging system event:', error);
    }
  };

  const getUserIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  };

  const exportAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          user:profiles(full_name, email)
        `)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      const csv = convertToCSV(data);
      downloadCSV(csv, `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
      
      // Log this export action
      await logAuditEvent('export', 'audit_logs', 'bulk', null, { exported_count: data?.length });
      
      toast.success('Đã xuất audit logs thành công');
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      toast.error('Lỗi khi xuất audit logs');
    }
  };

  const convertToCSV = (data: any[]): string => {
    if (!data.length) return '';

    const headers = ['Timestamp', 'User', 'Action', 'Table', 'Record ID', 'IP Address'];
    const rows = data.map(log => [
      log.timestamp,
      log.user?.full_name || 'System',
      log.action_type,
      log.table_name,
      log.record_id,
      log.ip_address
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const markSystemLogResolved = async (logId: string) => {
    try {
      const { error } = await supabase
        .from('system_logs')
        .update({ resolved: true })
        .eq('id', logId);

      if (error) throw error;

      setSystemLogs(prev => 
        prev.map(log => 
          log.id === logId ? { ...log, resolved: true } : log
        )
      );

      toast.success('Đã đánh dấu log đã giải quyết');
    } catch (error) {
      console.error('Error marking log resolved:', error);
      toast.error('Lỗi khi cập nhật log');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'error':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'bg-green-100 text-green-800';
      case 'update':
        return 'bg-blue-100 text-blue-800';
      case 'delete':
        return 'bg-red-100 text-red-800';
      case 'login':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Hệ thống Audit Logging
          </CardTitle>
          <CardDescription>
            Theo dõi và ghi lại tất cả các hoạt động trong hệ thống
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="audit" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="audit">Audit Logs</TabsTrigger>
              <TabsTrigger value="system">System Logs</TabsTrigger>
              <TabsTrigger value="stats">Thống kê</TabsTrigger>
            </TabsList>

            <TabsContent value="audit" className="space-y-6">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  placeholder="Tìm kiếm..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="col-span-2"
                />
                <select
                  value={filters.action_type}
                  onChange={(e) => setFilters(prev => ({ ...prev, action_type: e.target.value }))}
                  className="p-2 border rounded-md"
                >
                  <option value="">Tất cả hành động</option>
                  <option value="create">Tạo mới</option>
                  <option value="update">Cập nhật</option>
                  <option value="delete">Xóa</option>
                  <option value="login">Đăng nhập</option>
                  <option value="logout">Đăng xuất</option>
                </select>
                <Button onClick={exportAuditLogs} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Xuất CSV
                </Button>
              </div>

              {/* Audit Logs Table */}
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="p-3 text-left font-medium">Thời gian</th>
                        <th className="p-3 text-left font-medium">Người dùng</th>
                        <th className="p-3 text-left font-medium">Hành động</th>
                        <th className="p-3 text-left font-medium">Bảng</th>
                        <th className="p-3 text-left font-medium">IP</th>
                        <th className="p-3 text-left font-medium">Chi tiết</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="border-t hover:bg-muted/30">
                          <td className="p-3 text-sm">
                            {new Date(log.timestamp).toLocaleString('vi-VN')}
                          </td>
                          <td className="p-3">
                            <div>
                              <p className="font-medium text-sm">{log.user?.full_name || 'System'}</p>
                              <p className="text-xs text-muted-foreground">{log.user?.email}</p>
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge className={getActionColor(log.action_type)}>
                              {log.action_type}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm font-mono">{log.table_name}</td>
                          <td className="p-3 text-sm font-mono">{log.ip_address}</td>
                          <td className="p-3">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                // Show detailed view
                                console.log('Log details:', log);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="system" className="space-y-6">
              {/* Severity Filter */}
              <div className="flex gap-4">
                <select
                  value={filters.severity}
                  onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
                  className="p-2 border rounded-md"
                >
                  <option value="">Tất cả mức độ</option>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              {/* System Logs */}
              <div className="space-y-3">
                {systemLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-4 border rounded-lg ${
                      log.resolved ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getSeverityColor(log.severity)}>
                            {log.severity.toUpperCase()}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {log.log_type}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(log.timestamp).toLocaleString('vi-VN')}
                          </span>
                        </div>
                        <p className="text-sm font-medium mb-1">{log.message}</p>
                        {log.metadata && (
                          <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {!log.resolved && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markSystemLogResolved(log.id)}
                          >
                            Đánh dấu đã giải quyết
                          </Button>
                        )}
                        {log.resolved && (
                          <Badge variant="secondary">Đã giải quyết</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="stats" className="space-y-6">
              {auditStats && (
                <>
                  {/* Stats Overview */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Database className="w-8 h-8 mx-auto text-blue-500 mb-2" />
                        <p className="text-2xl font-bold">{auditStats.totalLogs}</p>
                        <p className="text-sm text-muted-foreground">Tổng logs</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Clock className="w-8 h-8 mx-auto text-green-500 mb-2" />
                        <p className="text-2xl font-bold">{auditStats.todayLogs}</p>
                        <p className="text-sm text-muted-foreground">Hôm nay</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 text-center">
                        <AlertTriangle className="w-8 h-8 mx-auto text-red-500 mb-2" />
                        <p className="text-2xl font-bold">{auditStats.criticalEvents}</p>
                        <p className="text-sm text-muted-foreground">Sự cố nghiêm trọng</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 text-center">
                        <User className="w-8 h-8 mx-auto text-purple-500 mb-2" />
                        <p className="text-2xl font-bold">{auditStats.uniqueUsers}</p>
                        <p className="text-sm text-muted-foreground">Người dùng hoạt động</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Top Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Hành động phổ biến (7 ngày qua)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {auditStats.topActions.map((action, index) => (
                          <div key={action.action} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-bold">{index + 1}</span>
                              </div>
                              <span className="font-medium">{action.action}</span>
                            </div>
                            <Badge variant="secondary">{action.count}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Demo Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Thử nghiệm Audit Logging</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button
                        onClick={() => logAuditEvent('test_create', 'demo_table', 'demo_123', null, { test: true })}
                        variant="outline"
                        className="w-full"
                      >
                        Tạo log thử nghiệm
                      </Button>
                      <Button
                        onClick={() => logSystemEvent('test', 'info', 'Đây là tin nhắn test system log', { demo: true })}
                        variant="outline"
                        className="w-full"
                      >
                        Tạo system log thử nghiệm
                      </Button>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

// Export the logging functions for use in other components
export { AuditLoggingSystem };

export const useAuditLogging = () => {
  const { user } = useAuth();

  const logAuditEvent = async (
    actionType: string,
    tableName: string,
    recordId: string,
    oldValues?: any,
    newValues?: any
  ) => {
    try {
      const getUserIP = async (): Promise<string> => {
        try {
          const response = await fetch('https://api.ipify.org?format=json');
          const data = await response.json();
          return data.ip;
        } catch {
          return 'unknown';
        }
      };

      const { error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: user?.id,
          action_type: actionType,
          table_name: tableName,
          record_id: recordId,
          old_values: oldValues,
          new_values: newValues,
          ip_address: await getUserIP(),
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging audit event:', error);
    }
  };

  const logSystemEvent = async (
    logType: string,
    severity: 'info' | 'warning' | 'error' | 'critical',
    message: string,
    metadata?: any
  ) => {
    try {
      const { error } = await supabase
        .from('system_logs')
        .insert({
          log_type: logType,
          severity,
          message,
          metadata,
          timestamp: new Date().toISOString(),
          resolved: false
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging system event:', error);
    }
  };

  return { logAuditEvent, logSystemEvent };
};

export default AuditLoggingSystem;