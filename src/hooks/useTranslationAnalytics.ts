import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TranslationMetrics {
  date: string;
  automated: number;
  manual: number;
  accuracy: number;
  total: number;
}

interface LanguagePairData {
  pair: string;
  count: number;
  accuracy: number;
}

interface RealTimeMetric {
  id: string;
  title: string;
  value: number;
  unit?: string;
  change?: number;
  status: 'active' | 'warning' | 'error' | 'success';
  trend: 'up' | 'down' | 'stable';
  target?: number;
  description?: string;
}

interface TranslationAnalytics {
  totalTranslations: number;
  automatedTranslations: number;
  manualTranslations: number;
  averageAccuracy: number;
  dailyMetrics: TranslationMetrics[];
  languagePairs: LanguagePairData[];
  realTimeMetrics: RealTimeMetric[];
  processingTime: number;
  errorRate: number;
}

export const useTranslationAnalytics = () => {
  const [analytics, setAnalytics] = useState<TranslationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generateMockAnalytics = (): TranslationAnalytics => {
    // Generate daily metrics for the last 30 days
    const dailyMetrics: TranslationMetrics[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const automated = Math.floor(Math.random() * 500) + 100;
      const manual = Math.floor(Math.random() * 200) + 50;
      const total = automated + manual;
      const accuracy = Math.floor(Math.random() * 15) + 85; // 85-100%
      
      dailyMetrics.push({
        date: date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }),
        automated,
        manual,
        accuracy,
        total
      });
    }

    // Generate language pair data
    const languagePairs: LanguagePairData[] = [
      { pair: 'EN → VI', count: 1250, accuracy: 92 },
      { pair: 'VI → EN', count: 980, accuracy: 89 },
      { pair: 'EN → JA', count: 650, accuracy: 87 },
      { pair: 'JA → VI', count: 420, accuracy: 84 },
      { pair: 'KO → VI', count: 350, accuracy: 86 },
      { pair: 'ZH → VI', count: 280, accuracy: 82 },
      { pair: 'FR → VI', count: 180, accuracy: 88 },
      { pair: 'DE → VI', count: 120, accuracy: 85 }
    ];

    // Generate real-time metrics
    const realTimeMetrics: RealTimeMetric[] = [
      {
        id: 'translations-per-hour',
        title: 'Dịch/giờ',
        value: Math.floor(Math.random() * 50) + 120,
        change: Math.floor(Math.random() * 20) - 10,
        status: 'active',
        trend: 'up',
        target: 150,
        description: 'Số lượng dịch thuật được xử lý mỗi giờ'
      },
      {
        id: 'accuracy-rate',
        title: 'Độ chính xác',
        value: Math.floor(Math.random() * 8) + 87,
        unit: '%',
        change: Math.floor(Math.random() * 6) - 2,
        status: 'success',
        trend: 'up',
        target: 95,
        description: 'Tỷ lệ dịch thuật chính xác'
      },
      {
        id: 'processing-time',
        title: 'Thời gian xử lý',
        value: Math.floor(Math.random() * 200) + 150,
        unit: 'ms',
        change: Math.floor(Math.random() * 10) - 5,
        status: 'active',
        trend: 'stable',
        target: 200,
        description: 'Thời gian trung bình để hoàn thành dịch thuật'
      },
      {
        id: 'error-rate',
        title: 'Tỷ lệ lỗi',
        value: Math.floor(Math.random() * 3) + 1,
        unit: '%',
        change: Math.floor(Math.random() * 4) - 2,
        status: 'warning',
        trend: 'down',
        target: 2,
        description: 'Tỷ lệ dịch thuật bị lỗi hoặc không thành công'
      }
    ];

    const totalTranslations = dailyMetrics.reduce((sum, day) => sum + day.total, 0);
    const automatedTranslations = dailyMetrics.reduce((sum, day) => sum + day.automated, 0);
    const manualTranslations = dailyMetrics.reduce((sum, day) => sum + day.manual, 0);
    const averageAccuracy = dailyMetrics.reduce((sum, day) => sum + day.accuracy, 0) / dailyMetrics.length;

    return {
      totalTranslations,
      automatedTranslations,
      manualTranslations,
      averageAccuracy,
      dailyMetrics,
      languagePairs,
      realTimeMetrics,
      processingTime: realTimeMetrics[2].value,
      errorRate: realTimeMetrics[3].value
    };
  };

  const fetchTranslationAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // In a real implementation, you would fetch from translation_logs table
      // For now, generate mock data
      const mockAnalytics = generateMockAnalytics();
      setAnalytics(mockAnalytics);

    } catch (err) {
      console.error('Error fetching translation analytics:', err);
      setError('Không thể tải dữ liệu phân tích dịch thuật');
      toast.error('Không thể tải dữ liệu phân tích dịch thuật');
    } finally {
      setLoading(false);
    }
  };

  const refreshAnalytics = async () => {
    await fetchTranslationAnalytics();
    toast.success('Đã cập nhật dữ liệu phân tích thành công');
  };

  useEffect(() => {
    fetchTranslationAnalytics();
  }, []);

  return {
    analytics,
    loading,
    error,
    refreshAnalytics
  };
};