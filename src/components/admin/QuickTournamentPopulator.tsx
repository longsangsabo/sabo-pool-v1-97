import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, Zap, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface QuickTournamentPopulatorProps {
  tournamentId?: string;
  onPopulated?: (count: number) => void;
  addLog?: (message: string, type?: 'info' | 'error' | 'success') => void;
}

export const QuickTournamentPopulator: React.FC<QuickTournamentPopulatorProps> = ({
  tournamentId,
  onPopulated,
  addLog
}) => {
  const [isPopulating, setIsPopulating] = useState(false);
  const [selectedCount, setSelectedCount] = useState<number | null>(null);

  const log = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    if (addLog) {
      addLog(message, type);
    } else {
      console.log(`${type.toUpperCase()}: ${message}`);
    }
  };

  const populateWithDemoUsers = async (userCount: number) => {
    if (!tournamentId) {
      log('❌ No tournament selected', 'error');
      toast.error('No tournament selected');
      return;
    }

    setIsPopulating(true);
    setSelectedCount(userCount);
    log(`🎯 Populating tournament with ${userCount} demo users...`);
    
    try {
      // Get available demo users
      const { data: availableUsers, error: usersError } = await supabase
        .rpc('get_available_demo_users', { needed_count: userCount });
      
      if (usersError) {
        log(`❌ Error getting demo users: ${usersError.message}`, 'error');
        toast.error('Failed to get demo users');
        return;
      }

      if (!availableUsers || availableUsers.length < userCount) {
        log(`❌ Not enough demo users available. Need: ${userCount}, Available: ${availableUsers?.length || 0}`, 'error');
        toast.error(`Not enough demo users available (${availableUsers?.length || 0}/${userCount})`);
        return;
      }
      
      // Reserve users for this tournament
      const userIds = availableUsers.map((u: any) => u.user_id);
      const { error: reserveError } = await supabase.rpc('reserve_demo_users', {
        user_ids: userIds,
        tournament_id: tournamentId
      });

      if (reserveError) {
        log(`❌ Failed to reserve demo users: ${reserveError.message}`, 'error');
        toast.error('Failed to reserve demo users');
        return;
      }
      
      // Register users to tournament
      const registrations = userIds.map((userId: string) => ({
        tournament_id: tournamentId,
        player_id: userId,
        status: 'confirmed',
        registration_status: 'confirmed',
        payment_status: 'paid',
        registration_date: new Date().toISOString()
      }));
      
      const { error: regError } = await supabase
        .from('tournament_registrations')
        .insert(registrations);
      
      if (regError) {
        log(`❌ Registration failed: ${regError.message}`, 'error');
        toast.error('Registration failed');
        
        // Release the reserved users since registration failed
        await supabase.rpc('release_demo_users', {
          tournament_id: tournamentId
        });
        return;
      }
      
      // Update tournament participant count
      const { error: updateError } = await supabase
        .from('tournaments')
        .update({ current_participants: userCount })
        .eq('id', tournamentId);
      
      if (updateError) {
        log(`⚠️ Warning: Could not update participant count: ${updateError.message}`, 'error');
      }
      
      log(`✅ Tournament populated with ${userCount} demo users!`, 'success');
      toast.success(`Successfully populated tournament with ${userCount} demo users`);
      
      if (onPopulated) {
        onPopulated(userCount);
      }
      
    } catch (error: any) {
      log(`❌ Error populating tournament: ${error.message}`, 'error');
      toast.error('Error populating tournament');
    } finally {
      setIsPopulating(false);
      setSelectedCount(null);
    }
  };

  const populationSizes = [
    { count: 8, label: '8 Players', description: 'Small bracket' },
    { count: 16, label: '16 Players', description: 'Standard bracket' },
    { count: 24, label: '24 Players', description: 'Large bracket' },
    { count: 32, label: '32 Players', description: 'Full tournament' }
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-600" />
          <div>
            <CardTitle className="text-lg">Quick Tournament Population</CardTitle>
            <CardDescription>Instantly populate tournament with demo users</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!tournamentId && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-700 dark:text-yellow-300">
              Please select a tournament first
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {populationSizes.map(({ count, label, description }) => (
            <Button 
              key={count}
              onClick={() => populateWithDemoUsers(count)} 
              disabled={isPopulating || !tournamentId}
              variant={selectedCount === count ? "default" : "outline"}
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              {isPopulating && selectedCount === count ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Users className="h-5 w-5" />
              )}
              <div className="text-center">
                <div className="font-medium">{label}</div>
                <div className="text-xs opacity-70">{description}</div>
              </div>
            </Button>
          ))}
        </div>

        {/* Features Info */}
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
            🚀 Quick Population Features
          </h4>
          <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
            <div>• Automatically reserves available demo users</div>
            <div>• Instant registration with confirmed payment status</div>
            <div>• Updates tournament participant count</div>
            <div>• Balanced skill mix for realistic testing</div>
            <div>• Auto-cleanup if registration fails</div>
          </div>
        </div>

        {/* Usage Tips */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
            💡 Usage Tips
          </h4>
          <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <div>• Use 8 players for quick bracket testing</div>
            <div>• Use 16+ players for comprehensive tournament simulation</div>
            <div>• Demo users are automatically released after tournament cleanup</div>
            <div>• Check demo user availability before large populations</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};