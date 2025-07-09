/**
 * Performance utilities for SABO Pool Arena
 * Provides tools for monitoring and optimizing application performance
 */

// Performance monitoring
export const performanceMonitor = {
  // Measure component render time
  measureRender: (componentName: string, renderFn: () => React.ReactElement) => {
    const start = performance.now();
    const result = renderFn();
    const end = performance.now();
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} render time: ${end - start}ms`);
    }
    
    return result;
  },

  // Track Core Web Vitals
  trackWebVitals: (metric: any) => {
    if (typeof window !== 'undefined') {
      // Send to analytics service
      console.log('Web Vital:', metric);
    }
  },

  // Memory usage monitoring
  checkMemoryUsage: () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      };
    }
    return null;
  },
};

// Bundle size tracking
export const bundleMonitor = {
  // Track lazy loading success
  trackLazyLoad: (componentName: string, success: boolean, loadTime?: number) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Lazy load ${componentName}:`, { success, loadTime });
    }
  },

  // Monitor chunk load times
  trackChunkLoad: (chunkName: string, loadTime: number) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Chunk ${chunkName} loaded in ${loadTime}ms`);
    }
  },
};

// Performance optimization helpers
export const optimizationHelpers = {
  // Debounce function for search inputs
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  // Throttle function for scroll events
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  // Intersection Observer for lazy loading
  createLazyObserver: (callback: (entry: IntersectionObserverEntry) => void) => {
    return new IntersectionObserver(
      (entries) => {
        entries.forEach(callback);
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
      }
    );
  },
};

// Image optimization
export const imageOptimization = {
  // Generate responsive image sources
  generateResponsiveSources: (baseUrl: string, sizes: number[]) => {
    return sizes.map(size => ({
      src: `${baseUrl}?w=${size}&q=80`,
      width: size,
    }));
  },

  // Lazy load images
  lazyLoadImage: (img: HTMLImageElement, src: string) => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          img.src = src;
          img.classList.remove('lazy');
          observer.unobserve(img);
        }
      });
    });
    observer.observe(img);
  },
};

// Network optimization
export const networkOptimization = {
  // Prefetch critical resources
  prefetchResource: (href: string, type: 'script' | 'style' | 'image' = 'script') => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    link.as = type;
    document.head.appendChild(link);
  },

  // Preload critical resources
  preloadResource: (href: string, type: 'script' | 'style' | 'image' = 'script') => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = type;
    document.head.appendChild(link);
  },
};