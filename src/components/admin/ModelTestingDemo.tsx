import React, { useState } from 'react';
import { Play, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ModelSelector } from '@/components/ModelSelector';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TestResult {
  modelId: string;
  startTime: number;
  endTime: number;
  responseTime: number;
  success: boolean;
  result?: any;
  error?: string;
  cost?: number;
}

const ModelTestingDemo: React.FC = () => {
  const { toast } = useToast();
  const [selectedModel, setSelectedModel] = useState('gpt-4.1-mini-2025-04-14');
  const [testData, setTestData] = useState(`{
  "alertData": {
    "id": "alert-001",
    "title": "High CPU Usage Detected",
    "severity": "warning",
    "timestamp": "2024-01-15T10:30:00Z",
    "metrics": {
      "cpu_usage": 85.5,
      "memory_usage": 67.2,
      "active_users": 156
    }
  },
  "context": {
    "system": "SABO Pool Arena Hub",
    "environment": "production"
  }
}`);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const testAlertAnalysis = async () => {
    setIsRunning(true);
    
    try {
      const parsedData = JSON.parse(testData);
      const startTime = Date.now();
      
      const { data, error } = await supabase.functions.invoke('ai-alert-analyzer', {
        body: {
          action: 'analyze_alert',
          model: selectedModel,
          data: parsedData
        }
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      const result: TestResult = {
        modelId: selectedModel,
        startTime,
        endTime,
        responseTime,
        success: !error && data?.success,
        result: data,
        error: error?.message,
        cost: estimateCost(selectedModel, responseTime)
      };

      setTestResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
      
      if (result.success) {
        toast({
          title: "Test thành công",
          description: `Model ${selectedModel} đã phân tích alert trong ${responseTime}ms`,
        });
      } else {
        toast({
          title: "Test thất bại",
          description: result.error || "Có lỗi xảy ra",
          variant: "destructive",
        });
      }
    } catch (parseError) {
      toast({
        title: "Lỗi dữ liệu test",
        description: "Dữ liệu JSON không hợp lệ",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const testTranslation = async () => {
    setIsRunning(true);
    
    try {
      const startTime = Date.now();
      
      const { data, error } = await supabase.functions.invoke('auto-translate', {
        body: {
          keys: ['admin.dashboard', 'tournament.create', 'match.result'],
          sourceLanguage: 'en',
          targetLanguage: 'vi',
          model: selectedModel,
          context: 'Pool/Billiards gaming platform'
        }
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      const result: TestResult = {
        modelId: selectedModel,
        startTime,
        endTime,
        responseTime,
        success: !error && data?.success,
        result: data,
        error: error?.message,
        cost: estimateCost(selectedModel, responseTime, 'translation')
      };

      setTestResults(prev => [result, ...prev.slice(0, 9)]);
      
      if (result.success) {
        toast({
          title: "Test translation thành công",
          description: `Đã dịch ${data?.processedCount || 0} keys trong ${responseTime}ms`,
        });
      } else {
        toast({
          title: "Test translation thất bại",
          description: result.error || "Có lỗi xảy ra",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi test translation",
        description: "Không thể thực hiện test",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const estimateCost = (modelId: string, responseTime: number, taskType = 'analysis'): number => {
    // Rough cost estimation based on model and task complexity
    const baseCosts = {
      'gpt-4.1-2025-04-14': 0.005,
      'gpt-4.1-mini-2025-04-14': 0.001,
      'o3-2025-04-16': 0.015,
      'o4-mini-2025-04-16': 0.003,
      'gpt-4o-mini': 0.0015
    };
    
    const taskMultiplier = taskType === 'analysis' ? 1.5 : 1.0;
    const timeFactor = responseTime / 1000; // Convert to seconds
    
    return (baseCosts[modelId as keyof typeof baseCosts] || 0.002) * taskMultiplier * Math.max(timeFactor, 0.5);
  };

  const getModelBadgeColor = (modelId: string) => {
    if (modelId.includes('o3')) return 'bg-purple-100 text-purple-800';
    if (modelId.includes('o4')) return 'bg-green-100 text-green-800';
    if (modelId.includes('4.1-mini')) return 'bg-blue-100 text-blue-800';
    if (modelId.includes('4.1')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Selection & Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="w-5 h-5" />
              Model Testing
            </CardTitle>
            <CardDescription>
              Test các AI models với dữ liệu thực tế
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ModelSelector
              value={selectedModel}
              onChange={setSelectedModel}
              taskType="alert_analysis"
              showDetails={true}
            />
            
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={testAlertAnalysis}
                disabled={isRunning}
                className="w-full"
              >
                {isRunning ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                Test Alert Analysis
              </Button>
              
              <Button 
                onClick={testTranslation}
                disabled={isRunning}
                variant="outline"
                className="w-full"
              >
                {isRunning ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                Test Translation
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Data */}
        <Card>
          <CardHeader>
            <CardTitle>Test Data</CardTitle>
            <CardDescription>
              Dữ liệu JSON để test alert analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={testData}
              onChange={(e) => setTestData(e.target.value)}
              rows={12}
              className="font-mono text-sm"
              placeholder="Nhập dữ liệu JSON để test..."
            />
          </CardContent>
        </Card>
      </div>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
          <CardDescription>
            Kết quả test các models (hiển thị 10 lần test gần nhất)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {testResults.length === 0 ? (
            <Alert>
              <AlertDescription>
                Chưa có kết quả test nào. Hãy chạy test để xem kết quả.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div 
                  key={`${result.modelId}-${result.startTime}-${index}`}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    
                    <div>
                      <Badge className={getModelBadgeColor(result.modelId)}>
                        {result.modelId}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(result.startTime).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <p className="font-medium">{result.responseTime}ms</p>
                      <p className="text-muted-foreground">Response Time</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="font-medium">${result.cost?.toFixed(4) || '0.0000'}</p>
                      <p className="text-muted-foreground">Est. Cost</p>
                    </div>
                    
                    <div className="text-center">
                      <Badge variant={result.success ? "default" : "destructive"}>
                        {result.success ? "Success" : "Failed"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ModelTestingDemo;