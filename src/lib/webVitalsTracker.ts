import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals';

interface WebVitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  url: string;
  userId?: string;
}

class WebVitalsTracker {
  private metrics: WebVitalsMetric[] = [];
  private userId?: string;

  constructor(userId?: string) {
    this.userId = userId;
    this.initializeTracking();
  }

  private initializeTracking() {
    // Track Core Web Vitals
    onCLS(this.onVitalsReport.bind(this, 'CLS'));
    onINP(this.onVitalsReport.bind(this, 'INP'));
    onFCP(this.onVitalsReport.bind(this, 'FCP'));
    onLCP(this.onVitalsReport.bind(this, 'LCP'));
    onTTFB(this.onVitalsReport.bind(this, 'TTFB'));

    // Send metrics periodically
    setInterval(() => {
      this.sendMetrics();
    }, 30000); // Send every 30 seconds

    // Send metrics before page unload
    window.addEventListener('beforeunload', () => {
      this.sendMetrics();
    });
  }

  private onVitalsReport(name: string, metric: any) {
    const webVitalsMetric: WebVitalsMetric = {
      name,
      value: metric.value,
      rating: this.getRating(name, metric.value),
      timestamp: Date.now(),
      url: window.location.href,
      userId: this.userId
    };

    this.metrics.push(webVitalsMetric);
    
    // Log for debugging
    console.log(`[WebVitals] ${name}:`, webVitalsMetric);

    // Send critical metrics immediately
    if (webVitalsMetric.rating === 'poor') {
      this.sendMetric(webVitalsMetric);
    }
  }

  private getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds: Record<string, [number, number]> = {
      CLS: [0.1, 0.25],
      FID: [100, 300],
      FCP: [1800, 3000],
      LCP: [2500, 4000],
      TTFB: [800, 1800]
    };

    const [good, poor] = thresholds[name] || [0, 0];
    
    if (value <= good) return 'good';
    if (value <= poor) return 'needs-improvement';
    return 'poor';
  }

  private async sendMetric(metric: WebVitalsMetric) {
    try {
      // Send to Supabase for storage
      const { supabase } = await import('@/integrations/supabase/client');
      
      await supabase.from('web_vitals_metrics' as any).insert({
        metric_name: metric.name,
        metric_value: metric.value,
        rating: metric.rating,
        url: metric.url,
        user_id: metric.userId,
        timestamp: new Date(metric.timestamp).toISOString()
      });
    } catch (error) {
      console.error('Failed to send web vitals metric:', error);
    }
  }

  private async sendMetrics() {
    if (this.metrics.length === 0) return;

    const metricsToSend = [...this.metrics];
    this.metrics = [];

    try {
      // Batch send metrics
      const { supabase } = await import('@/integrations/supabase/client');
      
      const formattedMetrics = metricsToSend.map(metric => ({
        metric_name: metric.name,
        metric_value: metric.value,
        rating: metric.rating,
        url: metric.url,
        user_id: metric.userId,
        timestamp: new Date(metric.timestamp).toISOString()
      }));

      await supabase.from('web_vitals_metrics' as any).insert(formattedMetrics);
      
      console.log(`[WebVitals] Sent ${formattedMetrics.length} metrics`);
    } catch (error) {
      console.error('Failed to send web vitals metrics:', error);
      // Re-add metrics for retry
      this.metrics.unshift(...metricsToSend);
    }
  }

  public setUserId(userId: string) {
    this.userId = userId;
  }

  public getMetrics(): WebVitalsMetric[] {
    return [...this.metrics];
  }
}

export const webVitalsTracker = new WebVitalsTracker();