import React, { useState } from 'react';
import { Trash2, AlertTriangle, RotateCcw, Edit } from 'lucide-react';
import { TournamentService } from '@/services/TournamentService';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface TournamentActionsProps {
  tournamentId: string;
  tournamentName: string;
  isDeleted?: boolean;
  onDeleted?: () => void;
  onRestored?: () => void;
  className?: string;
}

export const TournamentActions: React.FC<TournamentActionsProps> = ({
  tournamentId,
  tournamentName,
  isDeleted = false,
  onDeleted,
  onRestored,
  className = ''
}) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPermanentDeleteDialogOpen, setIsPermanentDeleteDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Soft delete
  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const success = await TournamentService.deleteTournament(tournamentId, false);
      if (success && onDeleted) {
        onDeleted();
      }
    } catch (error) {
      console.error('Error deleting tournament:', error);
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
    }
  };

  // Permanent delete
  const handlePermanentDelete = async () => {
    setIsLoading(true);
    try {
      const success = await TournamentService.deleteTournament(tournamentId, true);
      if (success && onDeleted) {
        onDeleted();
      }
    } catch (error) {
      console.error('Error permanently deleting tournament:', error);
    } finally {
      setIsLoading(false);
      setIsPermanentDeleteDialogOpen(false);
    }
  };

  // Restore
  const handleRestore = async () => {
    setIsLoading(true);
    try {
      const success = await TournamentService.restoreTournament(tournamentId);
      if (success && onRestored) {
        onRestored();
      }
    } catch (error) {
      console.error('Error restoring tournament:', error);
    } finally {
      setIsLoading(false);
      setIsRestoreDialogOpen(false);
    }
  };

  return (
    <>
      <div className={`flex gap-2 ${className}`}>
        {!isDeleted ? (
          // Actions for active tournaments
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={isLoading}
          >
            <Trash2 className="w-4 h-4 mr-1" /> Xóa
          </Button>
        ) : (
          // Actions for deleted tournaments
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRestoreDialogOpen(true)}
              disabled={isLoading}
            >
              <RotateCcw className="w-4 h-4 mr-1" /> Khôi phục
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsPermanentDeleteDialogOpen(true)}
              disabled={isLoading}
            >
              <AlertTriangle className="w-4 h-4 mr-1" /> Xóa vĩnh viễn
            </Button>
          </>
        )}
      </div>

      {/* Soft Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Giải đấu "{tournamentName}" sẽ bị đánh dấu là đã xóa. Bạn có thể khôi phục lại sau.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? 'Đang xóa...' : 'Xóa giải đấu'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permanent Delete Confirmation Dialog */}
      <AlertDialog open={isPermanentDeleteDialogOpen} onOpenChange={setIsPermanentDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa vĩnh viễn?</AlertDialogTitle>
            <AlertDialogDescription>
              Giải đấu "{tournamentName}" sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.
              Tất cả dữ liệu liên quan sẽ bị mất.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePermanentDelete}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Khôi phục giải đấu?</AlertDialogTitle>
            <AlertDialogDescription>
              Giải đấu "{tournamentName}" sẽ được khôi phục và hiển thị lại trong hệ thống.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestore}
              disabled={isLoading}
            >
              {isLoading ? 'Đang khôi phục...' : 'Khôi phục'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TournamentActions;