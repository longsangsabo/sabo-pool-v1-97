import React from 'react';
import { useProgressiveLoading } from '@/hooks/useProgressiveLoading';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface ProgressiveGridLoaderProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  renderSkeleton?: (index: number) => React.ReactNode;
  className?: string;
  gridClassName?: string;
  loadMoreText?: string;
  increment?: number;
  autoLoad?: boolean;
}

export function ProgressiveGridLoader<T>({
  items,
  renderItem,
  renderSkeleton,
  className = '',
  gridClassName = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
  loadMoreText = 'Tải thêm',
  increment = 6,
  autoLoad = false
}: ProgressiveGridLoaderProps<T>) {
  const {
    visibleItems,
    hasMore,
    isLoading,
    loadMore
  } = useProgressiveLoading(items, { increment });

  // Auto-load when scrolling near bottom
  React.useEffect(() => {
    if (!autoLoad || !hasMore) return;

    const handleScroll = () => {
      const scrollPosition = window.innerHeight + window.scrollY;
      const threshold = document.documentElement.offsetHeight - 1000;
      
      if (scrollPosition >= threshold && !isLoading) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [autoLoad, hasMore, isLoading, loadMore]);

  return (
    <div className={className}>
      <div className={gridClassName}>
        {visibleItems.map((item, index) => (
          <div 
            key={index}
            className="animate-fade-in"
            style={{ animationDelay: `${(index % increment) * 50}ms` }}
          >
            {renderItem(item, index)}
          </div>
        ))}
        
        {/* Show skeleton loaders while loading more */}
        {isLoading && renderSkeleton && (
          <>
            {Array.from({ length: Math.min(increment, items.length - visibleItems.length) }, (_, i) => (
              <div key={`skeleton-${i}`} className="animate-pulse">
                {renderSkeleton(visibleItems.length + i)}
              </div>
            ))}
          </>
        )}
      </div>

      {/* Load More Button */}
      {hasMore && !autoLoad && (
        <div className="flex justify-center mt-8">
          <Button
            onClick={loadMore}
            disabled={isLoading}
            className="hover-scale"
            variant="outline"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang tải...
              </>
            ) : (
              loadMoreText
            )}
          </Button>
        </div>
      )}

      {/* Auto-load indicator */}
      {hasMore && autoLoad && isLoading && (
        <div className="flex justify-center mt-8 animate-fade-in">
          <div className="flex items-center text-muted-foreground">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Đang tải thêm...
          </div>
        </div>
      )}
    </div>
  );
}