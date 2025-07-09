interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface APICallMetric {
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  timestamp: number;
  userId?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private apiCalls: APICallMetric[] = [];
  private userId?: string;
  private observer?: PerformanceObserver;

  constructor() {
    this.initializePerformanceObserver();
    this.setupNavigationTiming();
    this.setupResourceTiming();
  }

  private initializePerformanceObserver() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    try {
      // Observe navigation timing
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processPerformanceEntry(entry);
        }
      });

      this.observer.observe({ entryTypes: ['navigation', 'resource', 'measure', 'mark'] });
    } catch (error) {
      console.error('Performance Observer not supported:', error);
    }
  }

  private processPerformanceEntry(entry: PerformanceEntry) {
    const metric: PerformanceMetric = {
      name: entry.name,
      value: entry.duration,
      timestamp: Date.now(),
      metadata: {
        entryType: entry.entryType,
        startTime: entry.startTime
      }
    };

    // Add specific metadata based on entry type
    if (entry.entryType === 'navigation') {
      const navEntry = entry as PerformanceNavigationTiming;
      metric.metadata = {
        ...metric.metadata,
        domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
        loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
        redirectTime: navEntry.redirectEnd - navEntry.redirectStart,
        dnsTime: navEntry.domainLookupEnd - navEntry.domainLookupStart,
        connectTime: navEntry.connectEnd - navEntry.connectStart,
        responseTime: navEntry.responseEnd - navEntry.responseStart
      };
    }

    if (entry.entryType === 'resource') {
      const resourceEntry = entry as PerformanceResourceTiming;
      metric.metadata = {
        ...metric.metadata,
        transferSize: resourceEntry.transferSize,
        encodedBodySize: resourceEntry.encodedBodySize,
        decodedBodySize: resourceEntry.decodedBodySize
      };
    }

    this.metrics.push(metric);

    // Send critical performance issues immediately
    if (entry.duration > 1000) { // > 1 second
      this.sendMetric(metric);
    }
  }

  private setupNavigationTiming() {
    if (typeof window === 'undefined') return;

    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {
          const timings = {
            'Page Load Time': navigation.loadEventEnd - navigation.fetchStart,
            'DOM Content Loaded': navigation.domContentLoadedEventEnd - navigation.fetchStart,
            'First Byte': navigation.responseStart - navigation.requestStart,
            'DNS Lookup': navigation.domainLookupEnd - navigation.domainLookupStart,
            'Connection Time': navigation.connectEnd - navigation.connectStart,
            'Server Response': navigation.responseEnd - navigation.responseStart,
            'DOM Processing': navigation.domComplete - navigation.responseEnd
          };

          Object.entries(timings).forEach(([name, value]) => {
            if (value > 0) {
              this.addMetric(name, value, {
                type: 'navigation_timing',
                url: window.location.href
              });
            }
          });
        }
      }, 0);
    });
  }

  private setupResourceTiming() {
    if (typeof window === 'undefined') return;

    // Monitor large resources
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const resourceEntry = entry as PerformanceResourceTiming;
        
        // Flag large resources
        if (resourceEntry.transferSize > 1024 * 1024) { // > 1MB
          this.addMetric('Large Resource Loaded', resourceEntry.transferSize, {
            type: 'large_resource',
            url: resourceEntry.name,
            transferSize: resourceEntry.transferSize
          });
        }

        // Flag slow resources
        if (resourceEntry.duration > 2000) { // > 2 seconds
          this.addMetric('Slow Resource', resourceEntry.duration, {
            type: 'slow_resource',
            url: resourceEntry.name,
            duration: resourceEntry.duration
          });
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['resource'] });
    } catch (error) {
      console.error('Resource timing observer failed:', error);
    }
  }

  public addMetric(name: string, value: number, metadata?: Record<string, any>) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata
    };

    this.metrics.push(metric);

    // Log for debugging
    console.log(`[Performance] ${name}:`, value, metadata);
  }

  public trackAPICall(endpoint: string, method: string, duration: number, status: number) {
    const apiCall: APICallMetric = {
      endpoint,
      method,
      duration,
      status,
      timestamp: Date.now(),
      userId: this.userId
    };

    this.apiCalls.push(apiCall);

    // Log slow API calls
    if (duration > 2000) {
      console.warn(`[Performance] Slow API call: ${method} ${endpoint} - ${duration}ms`);
    }

    // Send critical API performance issues
    if (duration > 5000 || status >= 500) {
      this.sendAPIMetric(apiCall);
    }
  }

  private async sendMetric(metric: PerformanceMetric) {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      await supabase.from('performance_metrics').insert({
        metric_name: metric.name,
        metric_value: metric.value,
        metadata: metric.metadata || {},
        user_id: this.userId,
        timestamp: new Date(metric.timestamp).toISOString()
      });
    } catch (error) {
      console.error('Failed to send performance metric:', error);
    }
  }

  private async sendAPIMetric(apiCall: APICallMetric) {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      await supabase.from('api_performance_metrics').insert({
        endpoint: apiCall.endpoint,
        method: apiCall.method,
        duration: apiCall.duration,
        status: apiCall.status,
        user_id: apiCall.userId,
        timestamp: new Date(apiCall.timestamp).toISOString()
      });
    } catch (error) {
      console.error('Failed to send API metric:', error);
    }
  }

  public async sendAllMetrics() {
    if (this.metrics.length > 0) {
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        
        const formattedMetrics = this.metrics.map(metric => ({
          metric_name: metric.name,
          metric_value: metric.value,
          metadata: metric.metadata || {},
          user_id: this.userId,
          timestamp: new Date(metric.timestamp).toISOString()
        }));

        await supabase.from('performance_metrics').insert(formattedMetrics);
        this.metrics = [];
      } catch (error) {
        console.error('Failed to send performance metrics:', error);
      }
    }

    if (this.apiCalls.length > 0) {
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        
        const formattedAPIMetrics = this.apiCalls.map(call => ({
          endpoint: call.endpoint,
          method: call.method,
          duration: call.duration,
          status: call.status,
          user_id: call.userId,
          timestamp: new Date(call.timestamp).toISOString()
        }));

        await supabase.from('api_performance_metrics').insert(formattedAPIMetrics);
        this.apiCalls = [];
      } catch (error) {
        console.error('Failed to send API metrics:', error);
      }
    }
  }

  public setUserId(userId: string) {
    this.userId = userId;
  }

  public getMetrics() {
    return {
      performance: [...this.metrics],
      apiCalls: [...this.apiCalls]
    };
  }

  public startTimer(name: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      this.addMetric(name, duration, { type: 'custom_timer' });
    };
  }

  public cleanup() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();