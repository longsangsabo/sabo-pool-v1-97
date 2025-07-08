import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserPlus, Trash2, RefreshCw } from 'lucide-react';
import { AdminUserSelector } from './AdminUserSelector';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TournamentPlayerManagementProps {
  tournament: {
    id: string;
    name: string;
    max_participants: number;
    current_participants: number;
  };
  onParticipantsUpdated?: () => void;
}

interface TournamentRegistration {
  id: string;
  player_id: string;
  registration_status: string;
  payment_status: string;
  registration_date: string;
  added_by_admin?: string;
  admin_notes?: string;
  player?: {
    user_id: string;
    full_name: string;
    display_name: string;
    skill_level: string;
    is_demo_user: boolean;
  };
  added_by?: {
    display_name: string;
  };
}

export const TournamentPlayerManagement: React.FC<TournamentPlayerManagementProps> = ({
  tournament,
  onParticipantsUpdated
}) => {
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [currentParticipants, setCurrentParticipants] = useState<TournamentRegistration[]>([]);
  const [loading, setLoading] = useState(false);

  const loadCurrentParticipants = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tournament_registrations')
        .select(`
          *,
          player:profiles!tournament_registrations_player_id_fkey(
            user_id, full_name, display_name, skill_level, is_demo_user
          ),
          added_by:profiles!tournament_registrations_added_by_admin_fkey(
            display_name
          )
        `)
        .eq('tournament_id', tournament.id)
        .order('registration_date', { ascending: false });
      
      if (error) throw error;
      setCurrentParticipants((data as any) || []);
    } catch (error) {
      console.error('Error loading participants:', error);
      toast.error('Không thể tải danh sách người chơi');
    } finally {
      setLoading(false);
    }
  };

  const handleUsersAdded = (result: any) => {
    toast.success(`Đã thêm ${result.added_count} người chơi`);
    loadCurrentParticipants();
    onParticipantsUpdated?.();
    setShowUserSelector(false);
  };

  const removeParticipant = async (registrationId: string, playerName: string) => {
    if (!confirm(`Bạn có chắc muốn xóa ${playerName} khỏi giải đấu?`)) return;

    try {
      const { error } = await supabase
        .from('tournament_registrations')
        .delete()
        .eq('id', registrationId);

      if (error) throw error;

      // Update tournament participant count
      await supabase
        .from('tournaments')
        .update({
          current_participants: Math.max(0, tournament.current_participants - 1)
        })
        .eq('id', tournament.id);

      toast.success(`Đã xóa ${playerName} khỏi giải đấu`);
      loadCurrentParticipants();
      onParticipantsUpdated?.();
    } catch (error) {
      console.error('Error removing participant:', error);
      toast.error('Không thể xóa người chơi');
    }
  };

  useEffect(() => {
    loadCurrentParticipants();
  }, [tournament.id]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Quản lý người chơi
              <Badge variant="outline">
                {currentParticipants.length}/{tournament.max_participants}
              </Badge>
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                onClick={loadCurrentParticipants} 
                variant="outline" 
                size="sm"
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
              <Button 
                onClick={() => setShowUserSelector(!showUserSelector)}
                variant={showUserSelector ? "outline" : "default"}
                disabled={currentParticipants.length >= tournament.max_participants}
              >
                <UserPlus className="h-4 w-4 mr-1" />
                {showUserSelector ? 'Đóng' : 'Thêm người chơi'}
              </Button>
            </div>
          </div>
          {currentParticipants.length >= tournament.max_participants && (
            <p className="text-sm text-amber-600">
              ⚠️ Giải đấu đã đầy. Cần xóa người chơi trước khi thêm mới.
            </p>
          )}
        </CardHeader>

        {showUserSelector && (
          <CardContent>
            <AdminUserSelector 
              tournamentId={tournament.id}
              onUsersAdded={handleUsersAdded}
              onClose={() => setShowUserSelector(false)}
            />
          </CardContent>
        )}
      </Card>

      {/* Current Participants List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách người chơi hiện tại</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Đang tải...</p>
            </div>
          ) : currentParticipants.length > 0 ? (
            <div className="space-y-3">
              {currentParticipants.map((registration, index) => (
                <div key={registration.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-full text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {registration.player?.display_name || registration.player?.full_name}
                        {registration.player?.is_demo_user && (
                          <Badge variant="secondary" className="text-xs">
                            Demo
                          </Badge>
                        )}
                        <Badge 
                          variant={registration.registration_status === 'confirmed' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {registration.registration_status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {registration.player?.skill_level} • 
                        Đăng ký: {new Date(registration.registration_date).toLocaleDateString('vi-VN')}
                        {registration.added_by_admin && registration.added_by && (
                          <span className="text-blue-600 ml-2">
                            (Thêm bởi: {registration.added_by.display_name})
                          </span>
                        )}
                      </div>
                      {registration.admin_notes && (
                        <div className="text-xs text-muted-foreground mt-1">
                          📝 {registration.admin_notes}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => removeParticipant(
                      registration.id, 
                      registration.player?.display_name || registration.player?.full_name || 'Unknown'
                    )}
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Chưa có người chơi nào đăng ký</p>
              <p className="text-sm">Nhấn "Thêm người chơi" để bắt đầu</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};