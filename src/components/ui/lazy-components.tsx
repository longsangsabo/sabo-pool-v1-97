/**
 * Lazy-loaded components with enhanced loading states
 * Provides consistent loading experience across the application
 */

import React, { Suspense, ComponentType } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { performanceMonitor, bundleMonitor } from '@/utils/performance';

// Enhanced loading fallback with skeleton
export const PageLoadingFallback = ({ pageTitle }: { pageTitle?: string }) => (
  <div className="min-h-screen bg-background">
    {/* Header skeleton */}
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>
      
      {/* Content skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-20 w-full" />
            <div className="flex justify-between">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Component loading fallback
export const ComponentLoadingFallback = ({ 
  height = 'h-64', 
  showSpinner = true 
}: { 
  height?: string; 
  showSpinner?: boolean; 
}) => (
  <div className={`flex items-center justify-center ${height} bg-background rounded-lg border`}>
    {showSpinner ? (
      <LoadingSpinner size="lg" text="Đang tải..." />
    ) : (
      <div className="w-full h-full p-4 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-16 w-full" />
      </div>
    )}
  </div>
);

// Table loading skeleton
export const TableLoadingFallback = ({ rows = 5, columns = 4 }) => (
  <div className="border rounded-lg">
    {/* Header */}
    <div className="border-b p-4 grid grid-cols-4 gap-4">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
    
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="border-b last:border-b-0 p-4 grid grid-cols-4 gap-4">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={colIndex} className="h-4 w-full" />
        ))}
      </div>
    ))}
  </div>
);

// List loading skeleton
export const ListLoadingFallback = ({ items = 5, showAvatar = false }) => (
  <div className="space-y-3">
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg">
        {showAvatar && <Skeleton className="h-10 w-10 rounded-full" />}
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
    ))}
  </div>
);

// Error boundary for lazy components
class LazyComponentErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy component error:', error, errorInfo);
    performanceMonitor.trackWebVitals({
      name: 'lazy-component-error',
      value: 1,
      error: error.message,
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center h-64 bg-background rounded-lg border">
          <div className="text-center">
            <p className="text-muted-foreground mb-2">Không thể tải thành phần</p>
            <button 
              onClick={() => this.setState({ hasError: false })}
              className="text-primary hover:underline"
            >
              Thử lại
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for creating lazy components with enhanced loading
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  loadingComponent?: React.ReactNode,
  pageTitle?: string
) {
  const LazyComponent = React.lazy(() => {
    const start = performance.now();
    
    return importFn().then((module) => {
      const end = performance.now();
      bundleMonitor.trackLazyLoad(
        pageTitle || 'Unknown Component',
        true,
        end - start
      );
      return module;
    }).catch((error) => {
      bundleMonitor.trackLazyLoad(
        pageTitle || 'Unknown Component',
        false
      );
      throw error;
    });
  });

  return (props: React.ComponentProps<T>) => (
    <LazyComponentErrorBoundary>
      <Suspense fallback={loadingComponent || <PageLoadingFallback pageTitle={pageTitle} />}>
        <LazyComponent {...props} />
      </Suspense>
    </LazyComponentErrorBoundary>
  );
}

// Lazy component with prefetching
export function createLazyComponentWithPrefetch<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  prefetchCondition?: () => boolean,
  loadingComponent?: React.ReactNode,
  pageTitle?: string
) {
  const LazyComponent = createLazyComponent(importFn, loadingComponent, pageTitle);
  
  // Prefetch on hover or other conditions
  React.useEffect(() => {
    if (prefetchCondition && prefetchCondition()) {
      importFn();
    }
  }, []);

  return LazyComponent;
}