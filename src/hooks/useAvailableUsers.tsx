import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AvailableUser {
  id: string;
  full_name: string;
  display_name: string;
  phone: string;
  skill_level: string;
  elo: number;
  is_demo_user: boolean;
}

export const useAvailableUsers = (tournamentId: string) => {
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAvailableUsers = async () => {
    if (!tournamentId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Get users not already in this tournament
      const { data: existingRegistrations, error: regError } = await supabase
        .from('tournament_registrations')
        .select('player_id')
        .eq('tournament_id', tournamentId);

      if (regError) throw regError;

      const excludedIds = existingRegistrations?.map(reg => reg.player_id) || [];

      // Get demo users first
      const { data: demoUsers, error: demoError } = await supabase
        .from('profiles')
        .select('user_id, full_name, display_name, phone, skill_level, is_demo_user')
        .eq('is_demo_user', true)
        .eq('role', 'player')
        .not('user_id', 'in', `(${excludedIds.length > 0 ? excludedIds.map(id => `'${id}'`).join(',') : "'00000000-0000-0000-0000-000000000000'"})`);

      if (demoError) throw demoError;

      // Get ELO data for demo users
      const demoUserIds = demoUsers?.map(u => u.user_id) || [];
      let eloData: Record<string, number> = {};
      
      if (demoUserIds.length > 0) {
        const { data: eloRecords, error: eloError } = await supabase
          .from('player_rankings')
          .select('player_id, elo_points')
          .in('player_id', demoUserIds);

        if (!eloError && eloRecords) {
          eloData = eloRecords.reduce((acc, record) => {
            acc[record.player_id] = record.elo_points || 1000;
            return acc;
          }, {} as Record<string, number>);
        }
      }

      // Get regular users (limited)
      const { data: regularUsers, error: regularError } = await supabase
        .from('profiles')
        .select('user_id, full_name, display_name, phone, skill_level, is_demo_user')
        .eq('role', 'player')
        .eq('is_demo_user', false)
        .not('user_id', 'in', `(${excludedIds.length > 0 ? excludedIds.map(id => `'${id}'`).join(',') : "'00000000-0000-0000-0000-000000000000'"})`)
        .limit(10);

      if (regularError) throw regularError;

      // Combine and format users
      const allUsers = [
        ...(demoUsers || []).map(user => ({
          id: user.user_id,
          full_name: user.full_name || '',
          display_name: user.display_name || '',
          phone: user.phone || '',
          skill_level: user.skill_level || 'beginner',
          elo: eloData[user.user_id] || 1000,
          is_demo_user: user.is_demo_user
        })),
        ...(regularUsers || []).map(user => ({
          id: user.user_id,
          full_name: user.full_name || '',
          display_name: user.display_name || '',
          phone: user.phone || '',
          skill_level: user.skill_level || 'beginner',
          elo: 1000, // Default ELO for regular users
          is_demo_user: user.is_demo_user
        }))
      ];

      setAvailableUsers(allUsers);
      
    } catch (error) {
      console.error('Error loading available users:', error);
      setError(error instanceof Error ? error.message : 'Failed to load users');
      toast.error('Không thể tải danh sách người chơi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tournamentId) {
      loadAvailableUsers();
    }
  }, [tournamentId]);

  return { 
    availableUsers, 
    loading, 
    error,
    refreshUsers: loadAvailableUsers 
  };
};