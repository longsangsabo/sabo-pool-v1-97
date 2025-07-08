import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Loader2, Users, UserPlus, AlertCircle, Info } from 'lucide-react';
import { useAvailableUsers, AvailableUser } from '@/hooks/useAvailableUsers';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AdminUserSelectorProps {
  tournamentId: string;
  onUsersAdded?: (result: any) => void;
  onClose?: () => void;
}

interface DiagnosticInfo {
  totalDemoUsers: number;
  usersInTournament: number;
  adminRole: string;
  isAdmin: boolean;
  availableUsers: number;
}

export const AdminUserSelector: React.FC<AdminUserSelectorProps> = ({
  tournamentId,
  onUsersAdded,
  onClose
}) => {
  const [selectedUsers, setSelectedUsers] = useState<AvailableUser[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [diagnostics, setDiagnostics] = useState<DiagnosticInfo | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const { availableUsers, loading, error, refreshUsers } = useAvailableUsers(tournamentId);

  const runDiagnostics = async () => {
    setShowDiagnostics(true);
    console.log('🔍 Running diagnostics...');
    
    try {
      // Check total demo users
      const { count: totalDemo, error: demoCountError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_demo_user', true);

      if (demoCountError) {
        console.error('❌ Demo count error:', demoCountError);
      }

      // Check tournament registrations
      const { count: registered, error: regCountError } = await supabase
        .from('tournament_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('tournament_id', tournamentId);

      if (regCountError) {
        console.error('❌ Registration count error:', regCountError);
      }

      // Check admin status
      const { data: { user } } = await supabase.auth.getUser();
      let profile = null;
      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role, is_admin')
          .eq('user_id', user.id)
          .single();
        
        if (profileError) {
          console.error('❌ Profile error:', profileError);
        } else {
          profile = profileData;
        }
      }

      const diagnosticData: DiagnosticInfo = {
        totalDemoUsers: totalDemo || 0,
        usersInTournament: registered || 0,
        adminRole: profile?.role || 'unknown',
        isAdmin: profile?.is_admin || false,
        availableUsers: availableUsers.length
      };

      setDiagnostics(diagnosticData);
      console.log('📊 Diagnostics:', diagnosticData);
    } catch (error) {
      console.error('❌ Diagnostics error:', error);
      toast.error('Không thể chạy diagnostics');
    }
  };

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
      console.log(`🚀 Starting to add ${selectedUsers.length} users to tournament...`);
      console.log(`🎯 Tournament ID: ${tournamentId}`);
      console.log(`👥 Selected users:`, selectedUsers.map(u => ({ id: u.id, name: u.display_name })));
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      console.log(`👤 Admin user: ${user.id}`);
      
      const { data, error } = await supabase.rpc('admin_add_users_to_tournament', {
        p_tournament_id: tournamentId,
        p_user_ids: selectedUsers.map(u => u.id),
        p_admin_id: user.id,
        p_notes: adminNotes || 'Added by admin via bulk selection'
      });
      
      console.log(`📨 Function response:`, data);
      
      if (error) {
        console.error(`❌ Supabase RPC error:`, error);
        throw new Error(`Database function error: ${error.message}`);
      }
      
      if (!data) {
        console.error(`❌ No data returned from function`);
        throw new Error('No response from database function');
      }
      
      const result = data as any;
      if (result?.success) {
        console.log(`✅ Successfully added ${result.added_count} users!`);
        toast.success(`✅ Đã thêm ${result.added_count} người chơi vào giải đấu!`);
        setSelectedUsers([]);
        setAdminNotes('');
        refreshUsers();
        onUsersAdded?.(result);
      } else {
        console.error(`❌ Function returned error:`, result?.error);
        if (result?.debug) {
          console.log(`🔍 Debug info:`, result.debug);
        }
        toast.error(`❌ ${result?.error || 'Unknown error'}`);
      }
      
    } catch (error) {
      console.error('💥 Caught exception:', error);
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
            <Button onClick={runDiagnostics} variant="outline" size="sm">
              <Info className="h-4 w-4 mr-1" />
              Diagnostics
            </Button>
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
        {/* Diagnostics Panel */}
        {showDiagnostics && diagnostics && (
          <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
              <Info className="h-4 w-4" />
              System Diagnostics
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-700">Total Demo Users</div>
                <div className="text-lg font-bold text-blue-600">{diagnostics.totalDemoUsers}</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">Users in Tournament</div>
                <div className="text-lg font-bold text-orange-600">{diagnostics.usersInTournament}</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">Available Users</div>
                <div className="text-lg font-bold text-green-600">{diagnostics.availableUsers}</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">Admin Role</div>
                <div className="text-sm font-bold text-purple-600">{diagnostics.adminRole}</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">Is Admin</div>
                <div className={`text-sm font-bold ${diagnostics.isAdmin ? 'text-green-600' : 'text-red-600'}`}>
                  {diagnostics.isAdmin ? 'Yes' : 'No'}
                </div>
              </div>
            </div>
            <Button 
              onClick={() => setShowDiagnostics(false)} 
              variant="outline" 
              size="sm" 
              className="mt-3"
            >
              Hide Diagnostics
            </Button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <h4 className="font-medium text-red-800">Error Loading Users</h4>
            </div>
            <p className="text-red-700 text-sm mb-3">{error}</p>
            <div className="text-red-700 text-sm mb-3">
              <strong>Possible causes:</strong>
              <ul className="list-disc list-inside mt-1">
                <li>Database connection issues</li>
                <li>RLS policy restrictions</li>
                <li>Invalid tournament ID</li>
                <li>Query syntax errors</li>
              </ul>
            </div>
            <Button onClick={refreshUsers} size="sm" variant="outline">
              Try Again
            </Button>
          </div>
        )}

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