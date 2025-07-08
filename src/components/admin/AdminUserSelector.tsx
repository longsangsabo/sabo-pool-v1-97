import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Loader2, Users, UserPlus } from 'lucide-react';
import { useAvailableUsers, AvailableUser } from '@/hooks/useAvailableUsers';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AdminUserSelectorProps {
  tournamentId: string;
  onUsersAdded?: (result: any) => void;
  onClose?: () => void;
}

export const AdminUserSelector: React.FC<AdminUserSelectorProps> = ({
  tournamentId,
  onUsersAdded,
  onClose
}) => {
  const [selectedUsers, setSelectedUsers] = useState<AvailableUser[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const { availableUsers, loading, refreshUsers } = useAvailableUsers(tournamentId);

  const handleUserToggle = (user: AvailableUser) => {
    setSelectedUsers(prev => {
      const exists = prev.find(u => u.id === user.id);
      if (exists) {
        return prev.filter(u => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const addUsersToTournament = async () => {
    if (selectedUsers.length === 0) return;
    
    setIsAdding(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase.rpc('admin_add_users_to_tournament', {
        p_tournament_id: tournamentId,
        p_user_ids: selectedUsers.map(u => u.id),
        p_admin_id: user.id,
        p_notes: adminNotes || 'Added by admin'
      });
      
      if (error) throw error;
      
      const result = data as any;
      if (result?.success) {
        toast.success(`✅ Đã thêm ${result.added_count} người chơi vào giải đấu!`);
        setSelectedUsers([]);
        setAdminNotes('');
        refreshUsers();
        onUsersAdded?.(result);
      } else {
        toast.error(`❌ ${result?.error || 'Unknown error'}`);
      }
      
    } catch (error) {
      console.error('Error adding users:', error);
      toast.error(`❌ Lỗi: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAdding(false);
    }
  };

  const selectDemoUsers = (count: number) => {
    const demoUsers = availableUsers
      .filter(u => u.is_demo_user)
      .slice(0, count);
    setSelectedUsers(demoUsers);
  };

  const selectAllDemoUsers = () => {
    const allDemoUsers = availableUsers.filter(u => u.is_demo_user);
    setSelectedUsers(allDemoUsers);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Thêm Người Chơi Vào Giải
          </CardTitle>
          <div className="flex gap-2">
            <Button onClick={refreshUsers} variant="outline" size="sm" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : '🔄'}
              Refresh
            </Button>
            {onClose && (
              <Button onClick={onClose} variant="outline" size="sm">
                Đóng
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick Select Demo Users */}
        <div className="bg-blue-50 p-4 rounded-lg border">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            ⚡ Chọn nhanh Demo Users:
            <Badge variant="secondary">
              {availableUsers.filter(u => u.is_demo_user).length} có sẵn
            </Badge>
          </h4>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => selectDemoUsers(4)} variant="outline">
              4 Users
            </Button>
            <Button size="sm" onClick={() => selectDemoUsers(8)} variant="outline">
              8 Users
            </Button>
            <Button size="sm" onClick={() => selectDemoUsers(16)} variant="outline">
              16 Users
            </Button>
            <Button size="sm" onClick={selectAllDemoUsers} variant="outline">
              Tất cả Demo ({availableUsers.filter(u => u.is_demo_user).length})
            </Button>
          </div>
        </div>
        
        {/* User Selection Grid */}
        <div className="border rounded-lg">
          <div className="p-3 border-b bg-muted/50">
            <div className="flex justify-between items-center">
              <span className="font-medium">
                Chọn người chơi ({selectedUsers.length} đã chọn)
              </span>
              <Button 
                size="sm" 
                onClick={() => setSelectedUsers([])}
                variant="outline"
                disabled={selectedUsers.length === 0}
              >
                Clear All
              </Button>
            </div>
          </div>
          
          <div className="max-h-80 overflow-y-auto p-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Đang tải...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {availableUsers.map(user => {
                  const isSelected = selectedUsers.find(u => u.id === user.id);
                  return (
                    <div 
                      key={user.id}
                      className={`p-3 border rounded cursor-pointer transition-all hover:shadow-sm ${
                        isSelected 
                          ? 'bg-primary/10 border-primary/30 shadow-sm' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => handleUserToggle(user)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium flex items-center gap-2">
                            {user.display_name || user.full_name}
                            {user.is_demo_user && (
                              <Badge variant="secondary" className="text-xs">
                                Demo
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {user.full_name} • {user.skill_level} • ELO: {user.elo}
                          </div>
                          {user.phone && (
                            <div className="text-xs text-muted-foreground">
                              📱 {user.phone}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center">
                          {isSelected && (
                            <CheckCircle className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {availableUsers.length === 0 && !loading && (
              <div className="text-center py-8 text-muted-foreground">
                Không có người chơi nào khả dụng
              </div>
            )}
          </div>
        </div>
        
        {/* Admin Notes */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Ghi chú admin (tùy chọn):
          </label>
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Lý do thêm vào giải đấu hoặc ghi chú khác..."
            className="w-full p-3 border rounded-md resize-none"
            rows={2}
          />
        </div>
        
        {/* Add Button */}
        <Button 
          onClick={addUsersToTournament}
          disabled={selectedUsers.length === 0 || isAdding}
          className="w-full"
          size="lg"
        >
          {isAdding ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang thêm...
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-4 w-4" />
              Thêm {selectedUsers.length} người chơi vào giải
            </>
          )}
        </Button>

        {/* Selected Users Summary */}
        {selectedUsers.length > 0 && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <h5 className="font-medium mb-2">Đã chọn ({selectedUsers.length}):</h5>
            <div className="flex flex-wrap gap-1">
              {selectedUsers.map(user => (
                <Badge key={user.id} variant="outline" className="text-xs">
                  {user.display_name}
                  {user.is_demo_user && ' (Demo)'}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};