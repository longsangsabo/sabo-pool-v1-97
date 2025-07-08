import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { CheckCircle, XCircle, Clock, AlertTriangle, Users, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface MatchVerificationCardProps {
  matchResult: any;
  onVerificationChange: () => void;
}

export const MatchVerificationCard: React.FC<MatchVerificationCardProps> = ({
  matchResult,
  onVerificationChange
}) => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const isPlayer1 = user?.id === matchResult.player1_id;
  const isPlayer2 = user?.id === matchResult.player2_id;
  const canConfirm = (isPlayer1 && !matchResult.player1_confirmed) || 
                     (isPlayer2 && !matchResult.player2_confirmed);

  const getStatusBadge = () => {
    if (matchResult.result_status === 'verified') {
      return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Đã xác thực</Badge>;
    }
    if (matchResult.player1_confirmed && matchResult.player2_confirmed) {
      return <Badge className="bg-blue-500"><Clock className="h-3 w-3 mr-1" />Chờ xác thực</Badge>;
    }
    if (matchResult.player1_confirmed || matchResult.player2_confirmed) {
      return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Chờ xác nhận</Badge>;
    }
    return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Chưa xác nhận</Badge>;
  };

  const handleConfirm = async () => {
    if (!canConfirm) return;

    setIsProcessing(true);
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (isPlayer1) {
        updateData.player1_confirmed = true;
        updateData.player1_confirmed_at = new Date().toISOString();
      } else if (isPlayer2) {
        updateData.player2_confirmed = true;
        updateData.player2_confirmed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('match_results')
        .update(updateData)
        .eq('id', matchResult.id);

      if (error) throw error;

      // Kiểm tra nếu cả hai người chơi đã xác nhận
      const updatedResult = { ...matchResult, ...updateData };
      if (updatedResult.player1_confirmed && updatedResult.player2_confirmed) {
        // Tự động xác thực kết quả
        const { error: verifyError } = await supabase.rpc('verify_match_result', {
          p_match_result_id: matchResult.id,
          p_verifier_id: user?.id,
          p_verification_method: 'auto'
        });

        if (verifyError) {
          console.error('Error auto-verifying match:', verifyError);
          toast.warning('Đã xác nhận kết quả, nhưng có lỗi khi tự động xác thực');
        } else {
          toast.success('Kết quả đã được xác nhận và xác thực thành công!');
        }
      } else {
        toast.success('Đã xác nhận kết quả trận đấu!');
      }

      onVerificationChange();
    } catch (error: any) {
      console.error('Error confirming match result:', error);
      toast.error('Có lỗi xảy ra khi xác nhận kết quả');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDispute = async () => {
    // TODO: Implement dispute functionality
    toast.info('Tính năng khiếu nại sẽ sớm được triển khai');
  };

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Xác Nhận Kết Quả Trận Đấu
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Thông tin trận đấu */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Trận đấu:</span>
            <div className="font-medium">
              Vòng {matchResult.tournament_match?.round_number}, 
              Trận {matchResult.tournament_match?.match_number}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Thời gian:</span>
            <div className="font-medium">
              {new Date(matchResult.match_date).toLocaleString('vi-VN')}
            </div>
          </div>
        </div>

        <Separator />

        {/* Kết quả trận đấu */}
        <div className="flex justify-between items-center bg-muted/50 p-4 rounded-lg">
          <div className="text-center flex-1">
            <div className="font-medium">{matchResult.player1?.full_name}</div>
            <div className="text-xs text-muted-foreground">Người chơi 1</div>
            {matchResult.player1_confirmed && (
              <CheckCircle className="h-4 w-4 text-green-500 mx-auto mt-1" />
            )}
          </div>
          
          <div className="text-center px-6">
            <div className="text-2xl font-bold">
              {matchResult.player1_score} - {matchResult.player2_score}
            </div>
            <div className="text-xs text-muted-foreground">{matchResult.match_format}</div>
          </div>
          
          <div className="text-center flex-1">
            <div className="font-medium">{matchResult.player2?.full_name}</div>
            <div className="text-xs text-muted-foreground">Người chơi 2</div>
            {matchResult.player2_confirmed && (
              <CheckCircle className="h-4 w-4 text-green-500 mx-auto mt-1" />
            )}
          </div>
        </div>

        {/* Thông tin thêm */}
        {matchResult.match_notes && (
          <div>
            <span className="text-sm text-muted-foreground">Ghi chú:</span>
            <p className="text-sm mt-1 p-2 bg-muted/30 rounded">{matchResult.match_notes}</p>
          </div>
        )}

        {/* Action buttons */}
        {matchResult.result_status !== 'verified' && (
          <div className="flex gap-3 pt-2">
            {canConfirm && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" disabled={isProcessing}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Xác Nhận Kết Quả
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Xác nhận kết quả trận đấu</AlertDialogTitle>
                    <AlertDialogDescription>
                      Bạn có chắc chắn muốn xác nhận kết quả này không? 
                      Kết quả: {matchResult.player1_score} - {matchResult.player2_score}
                      {matchResult.winner_id === matchResult.player1_id 
                        ? ` (${matchResult.player1?.full_name} thắng)`
                        : matchResult.winner_id === matchResult.player2_id
                        ? ` (${matchResult.player2?.full_name} thắng)`
                        : ' (Hòa)'
                      }
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirm}>
                      Xác Nhận
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {(isPlayer1 || isPlayer2) && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDispute}
                className="text-destructive"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Khiếu Nại
              </Button>
            )}
          </div>
        )}

        {/* Verification status */}
        <div className="text-xs text-muted-foreground">
          {matchResult.result_status === 'verified' ? (
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              Đã xác thực lúc {new Date(matchResult.verified_at).toLocaleString('vi-VN')}
            </div>
          ) : (
            <div>
              Trạng thái: {matchResult.player1_confirmed ? '✓' : '○'} Người chơi 1 | 
              {matchResult.player2_confirmed ? ' ✓' : ' ○'} Người chơi 2
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};