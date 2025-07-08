import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  CreditCard, 
  Check, 
  X, 
  Clock, 
  Users, 
  Trophy,
  DollarSign,
  AlertCircle,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Registration {
  registration_id: string;
  player_id: string;
  tournament_id?: string;
  payment_status: string;
  registration_status: string;
  registration_date: string;
  player_name: string;
  elo_rating: number;
  priority_order: number;
  payment_method?: string;
  admin_notes?: string;
}

interface Tournament {
  id: string;
  name: string;
  max_participants: number;
  current_participants: number;
  status: string;
  entry_fee: number;
}

const TournamentPaymentManager: React.FC = () => {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');

  // Fetch tournaments owned by this club
  const fetchTournaments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .eq('created_by', user.id)
        .in('status', ['registration_open', 'registration_closed'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTournaments(data || []);
      
      if (data && data.length > 0 && !selectedTournament) {
        setSelectedTournament(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      toast.error('Lỗi khi tải danh sách giải đấu');
    }
  };

  // Fetch registration priority list
  const fetchRegistrations = async () => {
    if (!selectedTournament) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_tournament_registration_priority', {
        p_tournament_id: selectedTournament
      });

      if (error) throw error;
      setRegistrations(data || []);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast.error('Lỗi khi tải danh sách đăng ký');
    } finally {
      setLoading(false);
    }
  };

  // Confirm payment
  const confirmPayment = async (registrationId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('club_confirm_payment', {
        p_registration_id: registrationId,
        p_club_user_id: user.id,
        p_payment_method: paymentMethod,
        p_notes: notes
      });

      if (error) throw error;

      if (data && typeof data === 'object' && 'error' in data) {
        toast.error(String(data.error));
        return;
      }

      toast.success('Đã xác nhận thanh toán thành công!');
      setConfirmingPayment(null);
      setNotes('');
      await fetchRegistrations();
      await fetchTournaments();
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast.error('Lỗi khi xác nhận thanh toán');
    }
  };

  // Real-time subscriptions
  useEffect(() => {
    fetchTournaments();
  }, [user]);

  useEffect(() => {
    fetchRegistrations();
  }, [selectedTournament]);

  useEffect(() => {
    if (!selectedTournament) return;

    // Subscribe to tournament registration changes
    const channel = supabase
      .channel(`tournament-registrations-${selectedTournament}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament_registrations',
          filter: `tournament_id=eq.${selectedTournament}`
        },
        () => {
          fetchRegistrations();
          fetchTournaments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedTournament]);

  const selectedTournamentData = tournaments.find(t => t.id === selectedTournament);
  const paidRegistrations = registrations.filter(r => r.payment_status === 'paid');
  const pendingRegistrations = registrations.filter(r => r.payment_status === 'pending');

  const getStatusBadge = (paymentStatus: string, registrationStatus: string) => {
    if (paymentStatus === 'paid' && registrationStatus === 'confirmed') {
      return <Badge className="bg-green-100 text-green-800">Đã thanh toán</Badge>;
    }
    if (paymentStatus === 'pending') {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Chờ thanh toán</Badge>;
    }
    if (registrationStatus === 'waitlisted') {
      return <Badge variant="secondary">Danh sách chờ</Badge>;
    }
    return <Badge variant="outline">Chưa xác định</Badge>;
  };

  const getPriorityColor = (order: number, maxParticipants: number) => {
    if (order <= maxParticipants) {
      return 'text-green-600 font-semibold';
    }
    return 'text-orange-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Quản lý Thanh toán Giải đấu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Tournament Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Chọn giải đấu:</label>
              <Select value={selectedTournament} onValueChange={setSelectedTournament}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn giải đấu..." />
                </SelectTrigger>
                <SelectContent>
                  {tournaments.map((tournament) => (
                    <SelectItem key={tournament.id} value={tournament.id}>
                      {tournament.name} ({tournament.current_participants}/{tournament.max_participants})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tournament Stats */}
            {selectedTournamentData && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <Trophy className="h-6 w-6 mx-auto mb-1 text-amber-500" />
                  <p className="text-sm text-muted-foreground">Trạng thái</p>
                  <p className="font-semibold">{selectedTournamentData.status}</p>
                </div>
                <div className="text-center">
                  <Users className="h-6 w-6 mx-auto mb-1 text-blue-500" />
                  <p className="text-sm text-muted-foreground">Đã đăng ký</p>
                  <p className="font-semibold">{registrations.length}</p>
                </div>
                <div className="text-center">
                  <Check className="h-6 w-6 mx-auto mb-1 text-green-500" />
                  <p className="text-sm text-muted-foreground">Đã thanh toán</p>
                  <p className="font-semibold">{paidRegistrations.length}/{selectedTournamentData.max_participants}</p>
                </div>
                <div className="text-center">
                  <DollarSign className="h-6 w-6 mx-auto mb-1 text-emerald-500" />
                  <p className="text-sm text-muted-foreground">Lệ phí</p>
                  <p className="font-semibold">{selectedTournamentData.entry_fee?.toLocaleString()}đ</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Registration Management */}
      {selectedTournament && (
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Chờ xác nhận ({pendingRegistrations.length})
            </TabsTrigger>
            <TabsTrigger value="confirmed" className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              Đã xác nhận ({paidRegistrations.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  Danh sách chờ xác nhận thanh toán
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : pendingRegistrations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Không có đăng ký nào chờ xác nhận
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingRegistrations.map((registration) => (
                      <div key={registration.registration_id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className={`text-lg font-bold ${getPriorityColor(registration.priority_order, selectedTournamentData?.max_participants || 16)}`}>
                            #{registration.priority_order}
                          </div>
                          <div>
                            <p className="font-medium">{registration.player_name}</p>
                            <p className="text-sm text-muted-foreground">
                              ELO: {registration.elo_rating} • Đăng ký: {new Date(registration.registration_date).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {getStatusBadge(registration.payment_status, registration.registration_status)}
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                onClick={() => setConfirmingPayment(registration.registration_id)}
                                disabled={registration.payment_status === 'paid'}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Xác nhận
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Xác nhận thanh toán</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <p><strong>Người chơi:</strong> {registration.player_name}</p>
                                  <p><strong>Lệ phí:</strong> {selectedTournamentData?.entry_fee?.toLocaleString()}đ</p>
                                </div>
                                
                                <div>
                                  <label className="text-sm font-medium">Phương thức thanh toán:</label>
                                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="cash">Tiền mặt</SelectItem>
                                      <SelectItem value="bank_transfer">Chuyển khoản</SelectItem>
                                      <SelectItem value="momo">MoMo</SelectItem>
                                      <SelectItem value="other">Khác</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <div>
                                  <label className="text-sm font-medium">Ghi chú:</label>
                                  <Textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Ghi chú về thanh toán..."
                                    rows={3}
                                  />
                                </div>
                                
                                <div className="flex gap-2">
                                  <Button 
                                    onClick={() => confirmPayment(registration.registration_id)}
                                    className="flex-1"
                                  >
                                    Xác nhận đã thanh toán
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    onClick={() => setConfirmingPayment(null)}
                                  >
                                    Hủy
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="confirmed">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  Danh sách đã xác nhận thanh toán
                </CardTitle>
              </CardHeader>
              <CardContent>
                {paidRegistrations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Chưa có ai thanh toán
                  </div>
                ) : (
                  <div className="space-y-3">
                    {paidRegistrations.map((registration) => (
                      <div key={registration.registration_id} className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                        <div className="flex items-center space-x-4">
                          <div className="text-lg font-bold text-green-600">
                            #{registration.priority_order}
                          </div>
                          <div>
                            <p className="font-medium">{registration.player_name}</p>
                            <p className="text-sm text-muted-foreground">
                              ELO: {registration.elo_rating} • Đã thanh toán: {registration.payment_method}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {getStatusBadge(registration.payment_status, registration.registration_status)}
                          <Badge variant="outline" className="border-green-500 text-green-700">
                            Đã xác nhận
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default TournamentPaymentManager;