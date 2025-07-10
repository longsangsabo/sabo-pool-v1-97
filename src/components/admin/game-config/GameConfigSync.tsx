import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Upload, 
  Download,
  History,
  GitBranch
} from 'lucide-react';
import { useGameConfigSync } from '@/hooks/useGameConfigSync';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export const GameConfigSync: React.FC = () => {
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const { 
    inconsistencies, 
    loading, 
    syncToConstants, 
    syncFromDatabase,
    exportConfig,
    importConfig,
    compareVersions,
    lastSyncTime
  } = useGameConfigSync();

  const handleSync = async (direction: 'to-constants' | 'from-database') => {
    if (direction === 'to-constants') {
      await syncToConstants();
    } else {
      await syncFromDatabase();
    }
    setSyncDialogOpen(false);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Sync Status Indicator */}
      {inconsistencies && inconsistencies.length > 0 ? (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          {inconsistencies.length} issues
        </Badge>
      ) : (
        <Badge variant="secondary" className="gap-1">
          <CheckCircle className="h-3 w-3" />
          Synced
        </Badge>
      )}

      {/* Main Sync Dialog */}
      <Dialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Sync
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Game Configuration Sync</DialogTitle>
            <DialogDescription>
              Đồng bộ hóa cấu hình giữa database và code constants
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Status Overview */}
            <div className="space-y-4">
              <h4 className="font-medium">Sync Status</h4>
              {inconsistencies && inconsistencies.length > 0 ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Phát hiện {inconsistencies.length} sự khác biệt giữa database và constants
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Database và constants đang đồng bộ hoàn toàn
                  </AlertDescription>
                </Alert>
              )}

              {lastSyncTime && (
                <p className="text-sm text-muted-foreground">
                  Last sync: {new Date(lastSyncTime).toLocaleString('vi-VN')}
                </p>
              )}
            </div>

            <Separator />

            {/* Inconsistencies List */}
            {inconsistencies && inconsistencies.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium">Detected Issues</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {inconsistencies.map((issue, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{issue.table}</span>
                        <Badge variant="outline">{issue.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {issue.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Sync Actions */}
            <div className="space-y-4">
              <h4 className="font-medium">Sync Actions</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-auto p-4 justify-start gap-3"
                  onClick={() => handleSync('from-database')}
                  disabled={loading}
                >
                  <Upload className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Update Constants</div>
                    <div className="text-sm text-muted-foreground">
                      Cập nhật constants từ database
                    </div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto p-4 justify-start gap-3"
                  onClick={() => handleSync('to-constants')}
                  disabled={loading}
                >
                  <Download className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Update Database</div>
                    <div className="text-sm text-muted-foreground">
                      Cập nhật database từ constants
                    </div>
                  </div>
                </Button>
              </div>
            </div>

            <Separator />

            {/* Advanced Operations */}
            <div className="space-y-4">
              <h4 className="font-medium">Advanced Operations</h4>
              <div className="flex flex-wrap gap-2">
                <Button variant="ghost" size="sm" onClick={exportConfig}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Config
                </Button>
                <Button variant="ghost" size="sm" onClick={importConfig}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Config
                </Button>
                <Button variant="ghost" size="sm" onClick={compareVersions}>
                  <GitBranch className="h-4 w-4 mr-2" />
                  Compare Versions
                </Button>
              </div>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-4">
                <LoadingSpinner size="sm" text="Syncing..." />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};