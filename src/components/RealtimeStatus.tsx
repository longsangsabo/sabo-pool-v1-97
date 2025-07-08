import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff } from 'lucide-react';

interface RealtimeStatusProps {
  isConnected: boolean;
  lastUpdate?: Date | null;
}

const RealtimeStatus: React.FC<RealtimeStatusProps> = ({ 
  isConnected, 
  lastUpdate 
}) => {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Badge 
        variant={isConnected ? "default" : "destructive"} 
        className="flex items-center gap-1"
      >
        {isConnected ? (
          <Wifi className="h-3 w-3" />
        ) : (
          <WifiOff className="h-3 w-3" />
        )}
        {isConnected ? 'Kết nối' : 'Mất kết nối'}
      </Badge>
      {lastUpdate && (
        <span>
          Cập nhật lúc {lastUpdate.toLocaleTimeString('vi-VN')}
        </span>
      )}
    </div>
  );
};

export default RealtimeStatus;