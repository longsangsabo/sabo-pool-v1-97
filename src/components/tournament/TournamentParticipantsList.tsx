import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Trophy, Clock, CheckCircle, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface TournamentParticipant {
  id: string;
  user_id: string;
  registration_date: string;
  status: string;
  payment_status: string;
  user_profile: {
    user_id: string;
    full_name: string;
    display_name: string;
    avatar_url?: string;
    verified_rank?: string;
  };
}

interface TournamentParticipantsListProps {
  tournamentId: string;
  maxParticipants: number;
}

export const TournamentParticipantsList: React.FC<TournamentParticipantsListProps> = ({
  tournamentId,
  maxParticipants
}) => {
  const { user } = useAuth();
  const [participants, setParticipants] = useState<TournamentParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingPayment, setConfirmingPayment] = useState<string | null>(null);

  useEffect(() => {
    fetchParticipants();
  }, [tournamentId]);

  const fetchParticipants = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc(
        'get_tournament_registrations',
        { tournament_uuid: tournamentId }
      );

      if (error) throw error;

      const transformedParticipants = (data || []).map((reg: any) => ({
        id: reg.id,
        user_id: reg.user_id,
        registration_date: reg.registration_date,
        status: reg.status || 'registered',
        payment_status: reg.payment_status || 'pending',
        user_profile: typeof reg.user_profile === 'object' ? reg.user_profile : {
          user_id: reg.user_id,
          full_name: 'Unknown',
          display_name: 'Unknown',
          avatar_url: undefined,
          verified_rank: undefined
        }
      }));

      setParticipants(transformedParticipants);
    } catch (error) {
      console.error('Error fetching participants:', error);
      toast.error('Không thể tải danh sách người tham gia');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'registered': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'cash_pending': return 'bg-orange-100 text-orange-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Đã xác nhận';
      case 'registered': return 'Đã đăng ký';
      case 'pending': return 'Chờ xác nhận';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Đã thanh toán';
      case 'cash_pending': return 'Thanh toán tại CLB';
      case 'pending': return 'Chờ thanh toán';
      case 'processing': return 'Đang xử lý';
      default: return status;
    }
  };

  const handleConfirmPayment = async (participantId: string) => {
    try {
      setConfirmingPayment(participantId);
      
      const { error } = await supabase
        .from('tournament_registrations')
        .update({ 
          payment_status: 'paid',
          registration_status: 'confirmed',
          status: 'confirmed' 
        })
        .eq('id', participantId);

      if (error) throw error;
      
      toast.success('Đã xác nhận thanh toán thành công!');
      fetchParticipants(); // Refresh data
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast.error('Có lỗi khi xác nhận thanh toán');
    } finally {
      setConfirmingPayment(null);
    }
  };

  // Allow all logged-in users to confirm payments (simplified for demo)
  const canConfirmPayments = !!user;

  const confirmedParticipants = participants.filter(p => p.status === 'confirmed');
  const pendingParticipants = participants.filter(p => p.status === 'registered' || p.status === 'pending');

  const handleFinalizeRegistration = async () => {
    try {
      // Get 16 earliest paid participants
      const paidParticipants = participants
        .filter(p => p.payment_status === 'paid')
        .sort((a, b) => new Date(a.registration_date).getTime() - new Date(b.registration_date).getTime())
        .slice(0, 16);

      if (paidParticipants.length < 16) {
        toast.error(`Chỉ có ${paidParticipants.length} người đã thanh toán. Cần tối thiểu 16 người.`);
        return;
      }

      // Update selected 16 to confirmed, remove others
      const { error: removeError } = await supabase
        .from('tournament_registrations')
        .delete()
        .eq('tournament_id', tournamentId)
        .not('id', 'in', `(${paidParticipants.map(p => `"${p.id}"`).join(',')})`);

      if (removeError) throw removeError;

      // Confirm the selected 16
      const { error: confirmError } = await supabase
        .from('tournament_registrations')
        .update({ 
          status: 'confirmed',
          registration_status: 'confirmed'
        })
        .in('id', paidParticipants.map(p => p.id));

      if (confirmError) throw confirmError;

      // Update tournament status
      const { error: tournamentError } = await supabase
        .from('tournaments')
        .update({ 
          status: 'registration_closed',
          current_participants: 16
        })
        .eq('id', tournamentId);

      if (tournamentError) throw tournamentError;

      toast.success('Đã chốt sổ thành công! 16 người thanh toán sớm nhất được chọn.');
      fetchParticipants();
    } catch (error) {
      console.error('Error finalizing registration:', error);
      toast.error('Có lỗi khi chốt sổ');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tổng đăng ký</p>
                <p className="text-2xl font-bold">{participants.length}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Đã xác nhận</p>
                <p className="text-2xl font-bold text-green-600">{confirmedParticipants.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Chờ xác nhận</p>
                <p className="text-2xl font-bold text-blue-600">{pendingParticipants.length}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Participants List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Danh sách người tham gia ({participants.length}/{maxParticipants})
            </CardTitle>
            
            {/* Admin finalize button */}
            {canConfirmPayments && participants.filter(p => p.payment_status === 'paid').length >= 16 && (
              <Button
                variant="default"
                onClick={handleFinalizeRegistration}
                className="bg-primary hover:bg-primary/90"
              >
                <Trophy className="h-4 w-4 mr-2" />
                Chốt sổ 16 người
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {participants.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Chưa có người tham gia nào</p>
            </div>
          ) : (
            <div className="space-y-4">
              {participants.map((participant, index) => (
                <div key={participant.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground min-w-[2rem]">
                        #{index + 1}
                      </span>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={participant.user_profile.avatar_url} />
                        <AvatarFallback>
                          {participant.user_profile.full_name?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    
                    <div>
                      <p className="font-medium">
                        {participant.user_profile.display_name || participant.user_profile.full_name}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Đăng ký: {new Date(participant.registration_date).toLocaleDateString('vi-VN')}</span>
                        {participant.user_profile.verified_rank && (
                          <Badge variant="outline" className="text-xs">
                            Rank: {participant.user_profile.verified_rank}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(participant.status)}>
                      {getStatusText(participant.status)}
                    </Badge>
                    <Badge className={getPaymentStatusColor(participant.payment_status)}>
                      {getPaymentStatusText(participant.payment_status)}
                    </Badge>
                    
                    {/* Payment Confirmation Button */}
                    {canConfirmPayments && participant.payment_status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleConfirmPayment(participant.id)}
                        disabled={confirmingPayment === participant.id}
                        className="ml-2 text-xs"
                      >
                        <CreditCard className="h-3 w-3 mr-1" />
                        {confirmingPayment === participant.id ? 'Đang xác nhận...' : 'Xác nhận'}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TournamentParticipantsList;