import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  Trophy, 
  Target, 
  Award,
  Zap,
  RefreshCw
} from 'lucide-react';
import { useRealtimeSPA } from '@/hooks/useRealtimeSPA';

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'tournament': return Trophy;
    case 'challenge': return Target;
    case 'milestone': return Award;
    default: return Zap;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'tournament': return 'text-yellow-600 bg-yellow-100';
    case 'challenge': return 'text-blue-600 bg-blue-100';
    case 'milestone': return 'text-purple-600 bg-purple-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

export function RealtimeSPAFeed() {
  const { recentUpdates, isConnected, getRecentGlobalUpdates } = useRealtimeSPA();

  useEffect(() => {
    getRecentGlobalUpdates();
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Hoạt động SPA Real-time
          </CardTitle>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <div className="flex items-center gap-1 text-green-600">
                <Wifi className="h-4 w-4" />
                <span className="text-xs">Đang kết nối</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-600">
                <WifiOff className="h-4 w-4" />
                <span className="text-xs">Mất kết nối</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={getRecentGlobalUpdates}
              className="h-8 px-2"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          {recentUpdates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Chưa có hoạt động nào</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentUpdates.map((update, index) => {
                const IconComponent = getCategoryIcon(update.category);
                const colorClasses = getCategoryColor(update.category);
                
                return (
                  <div
                    key={`${update.user_id}-${update.timestamp}-${index}`}
                    className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className={`p-2 rounded-full ${colorClasses}`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm truncate">
                          {update.user_name}
                        </span>
                        <Badge 
                          variant={update.amount > 0 ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {update.amount > 0 ? '+' : ''}{update.amount} SPA
                        </Badge>
                      </div>
                      
                      <p className="text-xs text-muted-foreground mb-1">
                        {update.description}
                      </p>
                      
                      <p className="text-xs text-muted-foreground">
                        {new Date(update.timestamp).toLocaleString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: 'numeric',
                          month: 'short'
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}