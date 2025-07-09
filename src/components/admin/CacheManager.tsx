import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useDatabaseOptimization } from '@/hooks/useDatabaseOptimization';
import { useQueryClient } from '@tanstack/react-query';
import { 
  Database, 
  RefreshCcw, 
  Trash2, 
  Activity, 
  Clock,
  BarChart3,
  Users,
  TrendingUp
} from 'lucide-react';

export const CacheManager: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { warmCache, invalidateCache, measureDbOperation } = useDatabaseOptimization();
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  // Get cache statistics
  const getCacheStats = () => {
    const queryCache = queryClient.getQueryCache();
    const queries = queryCache.getAll();
    
    const stats = {
      total: queries.length,
      fresh: queries.filter(q => q.isStale() === false).length,
      stale: queries.filter(q => q.isStale() === true).length,
      fetching: queries.filter(q => q.state.fetchStatus === 'fetching').length,
      error: queries.filter(q => q.state.status === 'error').length
    };

    return stats;
  };

  const handleWarmCache = async (type: string) => {
    setLoading(prev => ({ ...prev, [type]: true }));
    
    try {
      await measureDbOperation(`warm-cache-${type}`, () => warmCache(type));
      
      toast({
        title: "Cache Warmed",
        description: `${type} cache has been pre-loaded successfully.`,
      });
    } catch (error) {
      toast({
        title: "Cache Warm Failed",
        description: `Failed to warm ${type} cache.`,
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleInvalidateCache = async (pattern: string) => {
    setLoading(prev => ({ ...prev, [`invalidate-${pattern}`]: true }));
    
    try {
      invalidateCache(pattern);
      
      toast({
        title: "Cache Invalidated",
        description: `${pattern} cache has been cleared.`,
      });
    } catch (error) {
      toast({
        title: "Cache Invalidation Failed",
        description: `Failed to invalidate ${pattern} cache.`,
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, [`invalidate-${pattern}`]: false }));
    }
  };

  const handleRefreshMaterializedView = async () => {
    setLoading(prev => ({ ...prev, 'mv-refresh': true }));
    
    try {
      await measureDbOperation('refresh-materialized-view', async () => {
        const query = queryClient.getQueryCache().find({
          queryKey: ['leaderboard-stats']
        });
        
        if (query) {
          await queryClient.invalidateQueries({ queryKey: ['leaderboard-stats'] });
        }
      });
      
      toast({
        title: "Materialized View Refreshed",
        description: "Leaderboard statistics have been updated.",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh materialized view.",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, 'mv-refresh': false }));
    }
  };

  const stats = getCacheStats();
  
  return (
    <div className="space-y-6">
      {/* Cache Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Cache Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Queries</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.fresh}</div>
              <div className="text-sm text-muted-foreground">Fresh</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.stale}</div>
              <div className="text-sm text-muted-foreground">Stale</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.fetching}</div>
              <div className="text-sm text-muted-foreground">Fetching</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.error}</div>
              <div className="text-sm text-muted-foreground">Errors</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cache Warming */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Cache Warming
            <Badge variant="outline">Pre-load Data</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => handleWarmCache('leaderboard')}
              disabled={loading['leaderboard']}
              className="flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              {loading['leaderboard'] ? 'Warming...' : 'Warm Leaderboard'}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleWarmCache('stats')}
              disabled={loading['stats']}
              className="flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              {loading['stats'] ? 'Warming...' : 'Warm Statistics'}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleWarmCache('top-players')}
              disabled={loading['top-players']}
              className="flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              {loading['top-players'] ? 'Warming...' : 'Warm Top Players'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cache Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Cache Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              onClick={() => handleInvalidateCache('leaderboard')}
              disabled={loading['invalidate-leaderboard']}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear Leaderboard
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleInvalidateCache('profiles')}
              disabled={loading['invalidate-profiles']}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear Profiles
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleInvalidateCache('all')}
              disabled={loading['invalidate-all']}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear All Cache
            </Button>
            
            <Button
              variant="outline"
              onClick={handleRefreshMaterializedView}
              disabled={loading['mv-refresh']}
              className="flex items-center gap-2"
            >
              <RefreshCcw className="w-4 h-4" />
              Refresh Stats View
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Database Optimization Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Performance Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <strong>Cache Hit Rate:</strong> Keep above 80% for optimal performance
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <strong>Warm Cache:</strong> Pre-load frequently accessed data during low traffic
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <strong>Invalidation:</strong> Clear cache after data mutations for consistency
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <strong>Materialized Views:</strong> Refresh every 15 minutes for updated statistics
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};