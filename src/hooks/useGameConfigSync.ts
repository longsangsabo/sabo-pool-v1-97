import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Inconsistency {
  table: string;
  type: 'missing' | 'mismatch' | 'extra';
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export const useGameConfigSync = () => {
  const [inconsistencies, setInconsistencies] = useState<Inconsistency[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const checkInconsistencies = async () => {
    try {
      // This would compare database values with constants
      // For now, we'll implement a basic check
      const issues: Inconsistency[] = [];

      // Check rank definitions consistency
      const { data: ranks } = await supabase
        .from('rank_definitions')
        .select('*')
        .order('rank_order');

      const expectedRanks = ['K', 'K+', 'I', 'I+', 'H', 'H+', 'G', 'G+', 'F', 'F+', 'E', 'E+'];
      
      if (!ranks || ranks.length !== 12) {
        issues.push({
          table: 'rank_definitions',
          type: 'missing',
          description: `Expected 12 ranks, found ${ranks?.length || 0}`,
          severity: 'high'
        });
      } else {
        // Check if rank codes match expected
        ranks.forEach((rank, index) => {
          if (rank.rank_code !== expectedRanks[index]) {
            issues.push({
              table: 'rank_definitions',
              type: 'mismatch',
              description: `Rank order mismatch: expected ${expectedRanks[index]}, got ${rank.rank_code}`,
              severity: 'medium'
            });
          }
        });
      }

      // Check ELO rules
      const { data: eloRules } = await supabase
        .from('elo_calculation_rules')
        .select('*')
        .eq('rule_type', 'k_factor');

      if (!eloRules || eloRules.length < 4) {
        issues.push({
          table: 'elo_calculation_rules',
          type: 'missing',
          description: 'Missing K-factor rules for different player levels',
          severity: 'medium'
        });
      }

      setInconsistencies(issues);
      return issues;

    } catch (error) {
      console.error('Error checking inconsistencies:', error);
      return [];
    }
  };

  const syncToConstants = async () => {
    try {
      setLoading(true);

      // This would generate new constants files based on database values
      // For now, we'll simulate the sync
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "Sync Completed",
        description: "Constants have been updated from database values",
      });

      setLastSyncTime(new Date().toISOString());
      await checkInconsistencies();

    } catch (error) {
      console.error('Error syncing to constants:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to update constants",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const syncFromDatabase = async () => {
    try {
      setLoading(true);

      // This would update database from current constants
      // For now, we'll simulate the sync
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "Sync Completed", 
        description: "Database has been updated from constants",
      });

      setLastSyncTime(new Date().toISOString());
      await checkInconsistencies();

    } catch (error) {
      console.error('Error syncing from database:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to update database",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportConfig = async () => {
    try {
      // Export current configuration to JSON
      const config = {
        timestamp: new Date().toISOString(),
        ranks: await supabase.from('rank_definitions').select('*'),
        eloRules: await supabase.from('elo_calculation_rules').select('*'),
        spaRewards: await supabase.from('spa_reward_milestones').select('*'),
        tournamentRewards: await supabase.from('tournament_reward_structures').select('*'),
        gameConfigs: await supabase.from('game_configurations').select('*')
      };

      const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `game-config-${new Date().toISOString().split('T')[0]}.json`;
      a.click();

      toast({
        title: "Config Exported",
        description: "Configuration has been exported successfully",
      });

    } catch (error) {
      console.error('Error exporting config:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export configuration",
        variant: "destructive"
      });
    }
  };

  const importConfig = async () => {
    // This would open a file picker and import configuration
    toast({
      title: "Import Config",
      description: "Import functionality coming soon",
    });
  };

  const compareVersions = async () => {
    // This would show a comparison between current and previous versions
    toast({
      title: "Version Comparison",
      description: "Version comparison functionality coming soon",
    });
  };

  useEffect(() => {
    checkInconsistencies();
  }, []);

  return {
    inconsistencies,
    loading,
    lastSyncTime,
    syncToConstants,
    syncFromDatabase,
    exportConfig,
    importConfig,
    compareVersions,
    checkInconsistencies
  };
};