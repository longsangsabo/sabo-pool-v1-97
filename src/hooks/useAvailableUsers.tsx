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
    if (!tournamentId) {
      console.log('❌ No tournament ID provided');
      return;
    }
    
    setLoading(true);
    setError(null);
    console.log('🔍 Loading available users for tournament:', tournamentId);
    
    try {
      // Get users already registered in this tournament
      const { data: existingRegistrations, error: regError } = await supabase
        .from('tournament_registrations')
        .select('player_id')
        .eq('tournament_id', tournamentId);

      if (regError) {
        console.error('❌ Registration error:', regError);
        throw regError;
      }

      const excludedIds = existingRegistrations?.map(reg => reg.player_id) || [];
      console.log(`📋 Found ${excludedIds.length} users already registered`);

      // Get all demo users first
      const { data: allDemoUsers, error: demoError } = await supabase
        .from('profiles')
        .select('user_id, full_name, display_name, phone, skill_level, is_demo_user')
        .eq('is_demo_user', true)
        .eq('role', 'player');

      if (demoError) {
        console.error('❌ Demo users error:', demoError);
        throw demoError;
      }

      // Filter out already registered users
      const demoUsers = allDemoUsers?.filter(user => !excludedIds.includes(user.user_id)) || [];

      console.log(`👥 Found ${demoUsers?.length || 0} available demo users`);

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
        console.log(`📊 Loaded ELO data for ${Object.keys(eloData).length} users`);
      }

      // Get regular users (limited) - simplified query
      let regularUsersQuery = supabase
        .from('profiles')
        .select('user_id, full_name, display_name, phone, skill_level, is_demo_user')
        .eq('role', 'player')
        .eq('is_demo_user', false)
        .limit(10);

      // If there are excluded IDs, filter them out
      if (excludedIds.length > 0) {
        regularUsersQuery = regularUsersQuery.not('user_id', 'in', `(${excludedIds.map(id => `'${id}'`).join(',')})`);
      }

      const { data: regularUsers, error: regularError } = await regularUsersQuery;

      if (regularError) {
        console.error('❌ Regular users error:', regularError);
        // Don't throw error for regular users, just log it
        console.log('⚠️ Continuing without regular users');
      }

      console.log(`👤 Found ${regularUsers?.length || 0} available regular users`);

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

      console.log(`✅ Total available users: ${allUsers.length}`);
      setAvailableUsers(allUsers);
      
    } catch (error) {
      console.error('❌ Error loading available users:', error);
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