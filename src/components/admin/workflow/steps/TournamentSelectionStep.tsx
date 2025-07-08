import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Target, Eye, GitBranch } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TournamentSelectionStepProps {
  onComplete: (results: any) => void;
  onTournamentSelect: (tournamentId: string | null) => void;
  updateSharedData: (key: string, data: any) => void;
  sharedData: any;
  addLog: (message: string, type?: 'info' | 'error' | 'success') => void;
}

export const TournamentSelectionStep: React.FC<TournamentSelectionStepProps> = ({
  onComplete,
  onTournamentSelect,
  updateSharedData,
  sharedData,
  addLog
}) => {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [loadingBracket, setLoadingBracket] = useState(false);
  const [generatingBracket, setGeneratingBracket] = useState(false);
  const [bracketData, setBracketData] = useState<any>(null);
  const [bracket, setBracket] = useState<any[]>([]);
  const [seeding, setSeeding] = useState<any[]>([]);

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTournaments(data || []);
    } catch (error: any) {
      addLog(`❌ Error loading tournaments: ${error.message}`, 'error');
    }
  };

  const handleTournamentSelect = async (tournamentId: string) => {
    setSelectedTournament(tournamentId);
    onTournamentSelect(tournamentId);
    
    // Load tournament details
    const tournament = tournaments.find(t => t.id === tournamentId);
    if (tournament) {
      updateSharedData('tournament', tournament);
      addLog(`🏆 Selected tournament: ${tournament.name}`, 'info');
    }
  };

  const generateSampleBracket = async () => {
    console.log('🎯 Generate Sample Bracket clicked!', { selectedTournament, generatingBracket });
    
    if (!selectedTournament) {
      addLog('❌ Please select a tournament first', 'error');
      return;
    }

    setGeneratingBracket(true);
    addLog('🔧 Generating sample bracket...', 'info');

    try {
      // Debug: Check tournament exists
      const { data: tournament, error: tournamentError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', selectedTournament)
        .single();
      
      if (tournamentError) {
        addLog(`❌ Tournament not found: ${tournamentError.message}`, 'error');
        return;
      }
      
      addLog(`🎯 Tournament found: ${tournament.name}`, 'info');
      
      // Debug: Check existing matches BEFORE generation
      const { count: existingMatches } = await supabase
        .from('tournament_matches')
        .select('*', { count: 'exact', head: true })
        .eq('tournament_id', selectedTournament);
      
      addLog(`📊 Existing matches before: ${existingMatches || 0}`, 'info');

      const { data, error } = await supabase.rpc('generate_advanced_tournament_bracket', {
        p_tournament_id: selectedTournament,
        p_seeding_method: 'elo_ranking',
        p_force_regenerate: true
      });

      if (error) throw error;

      addLog(`🔧 Bracket function result: ${JSON.stringify(data)}`, 'info');
      
      // Debug: Check matches AFTER generation
      const { count: newMatches } = await supabase
        .from('tournament_matches')
        .select('*', { count: 'exact', head: true })
        .eq('tournament_id', selectedTournament);
      
      addLog(`📊 Matches after generation: ${newMatches || 0}`, 'info');
      
      if ((newMatches || 0) > (existingMatches || 0)) {
        addLog(`✅ Sample bracket generated successfully! Created ${(newMatches || 0) - (existingMatches || 0)} matches`, 'success');
      } else {
        addLog(`⚠️ No new matches created. Function may have failed silently.`, 'error');
      }
      
      // Auto-load bracket after generation
      setTimeout(() => loadBracket(), 1000);
    } catch (error: any) {
      addLog(`❌ Error generating bracket: ${error.message}`, 'error');
    } finally {
      setGeneratingBracket(false);
    }
  };

  const loadBracket = async () => {
    console.log('👁️ Load Bracket clicked!', { selectedTournament, loadingBracket });
    
    if (!selectedTournament) {
      addLog('❌ Please select a tournament first', 'error');
      return;
    }

    setLoadingBracket(true);
    addLog('🔄 Loading bracket...', 'info');
    
    try {
      // Load tournament matches
      const { data: matches, error: matchError } = await supabase
        .from('tournament_matches')
        .select('*')
        .eq('tournament_id', selectedTournament)
        .order('round_number', { ascending: true })
        .order('match_number', { ascending: true });

      if (matchError) throw matchError;

      // Get player profiles
      const playerIds = new Set<string>();
      matches?.forEach(match => {
        if (match.player1_id) playerIds.add(match.player1_id);
        if (match.player2_id) playerIds.add(match.player2_id);
      });

      let playerProfiles: any[] = [];
      if (playerIds.size > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, display_name')
          .in('user_id', Array.from(playerIds));
        playerProfiles = profiles || [];
      }

      // Combine matches with player data
      const matchesWithPlayers = matches?.map(match => ({
        ...match,
        player1: match.player1_id 
          ? playerProfiles.find(p => p.user_id === match.player1_id)
          : null,
        player2: match.player2_id 
          ? playerProfiles.find(p => p.user_id === match.player2_id)
          : null
      }));

      // Load seeding data
      const { data: seedingData } = await supabase
        .from('tournament_seeding')
        .select('*')
        .eq('tournament_id', selectedTournament)
        .order('seed_position', { ascending: true });

      const seedingWithPlayers = seedingData?.map(seed => ({
        ...seed,
        player: seed.player_id 
          ? playerProfiles.find(p => p.user_id === seed.player_id)
          : null
      }));

      // Load bracket metadata
      const { data: bracketMeta } = await supabase
        .from('tournament_brackets')
        .select('*')
        .eq('tournament_id', selectedTournament)
        .single();

      setBracket(matchesWithPlayers || []);
      setSeeding(seedingWithPlayers || []);
      setBracketData(bracketMeta);
      
      // Update shared data
      updateSharedData('bracket', matchesWithPlayers || []);
      updateSharedData('seeding', seedingWithPlayers || []);
      updateSharedData('matches', matchesWithPlayers || []);

      if (!matchesWithPlayers || matchesWithPlayers.length === 0) {
        addLog('⚠️ Tournament has no bracket. Please generate bracket first.', 'error');
      } else {
        addLog(`✅ Bracket loaded: ${matchesWithPlayers.length} matches, ${seedingData?.length || 0} seeded players`, 'success');
        
        // Auto-complete step if bracket is successfully loaded
        const results = {
          tournament: tournaments.find(t => t.id === selectedTournament),
          bracket: matchesWithPlayers,
          seeding: seedingWithPlayers,
          bracketData: bracketMeta,
          totalMatches: matchesWithPlayers.length,
          totalRounds: Math.max(...matchesWithPlayers.map(m => m.round_number)),
          completedAt: new Date().toISOString()
        };
        
        onComplete(results);
        toast.success('🎉 Step 1 completed! Auto-advancing to Step 2...');
      }
    } catch (error: any) {
      addLog(`❌ Error loading bracket: ${error.message}`, 'error');
    } finally {
      setLoadingBracket(false);
    }
  };

  const getRoundName = (round: number, totalRounds: number) => {
    const remaining = Math.pow(2, totalRounds - round + 1);
    switch (remaining) {
      case 2: return 'Final';
      case 4: return 'Semi-Final';
      case 8: return 'Quarter-Final';
      default: return `Round ${round}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tournament Selection */}
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Select Tournament:</label>
          <Select value={selectedTournament} onValueChange={handleTournamentSelect}>
            <SelectTrigger>
              <SelectValue placeholder="-- Select Tournament --" />
            </SelectTrigger>
            <SelectContent>
              {tournaments.map(tournament => (
                <SelectItem key={tournament.id} value={tournament.id}>
                  {tournament.name} ({tournament.status})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={(e) => {
              console.log('Load Bracket button clicked!', e);
              loadBracket();
            }} 
            disabled={loadingBracket || !selectedTournament} 
            className="flex-1"
          >
            {loadingBracket ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
            {loadingBracket ? 'Loading...' : 'Load Bracket'}
          </Button>
          <Button 
            onClick={(e) => {
              console.log('Generate Sample Bracket button clicked!', e);
              generateSampleBracket();
            }} 
            disabled={generatingBracket || !selectedTournament} 
            variant="outline"
          >
            {generatingBracket ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Target className="mr-2 h-4 w-4" />}
            {generatingBracket ? 'Generating...' : 'Generate Sample Bracket'}
          </Button>
        </div>
        
        {/* Debug Info */}
        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
          Debug: Selected={selectedTournament ? '✅' : '❌'} | Loading={loadingBracket ? '🔄' : '✅'} | Generating={generatingBracket ? '🔄' : '✅'}
        </div>
      </div>

      {/* Bracket Display */}
      {bracket.length > 0 && (
        <div className="space-y-4">
          {/* Seeding Display */}
          {seeding.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                🎯 Seeding Order (Top 8)
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {seeding.slice(0, 8).map((seed) => (
                  <div key={seed.seed_position} className="flex justify-between p-2 bg-white dark:bg-gray-800 rounded">
                    <span className="font-medium">#{seed.seed_position}</span>
                    <span>{seed.player?.display_name || seed.player?.full_name || 'BYE'}</span>
                    <span className="text-gray-500">{seed.elo_rating} ELO</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bracket Statistics */}
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h4 className="font-medium mb-2">📊 Bracket Statistics</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium">Total Matches</div>
                <div className="text-gray-600">{bracket.length}</div>
              </div>
              <div>
                <div className="font-medium">Rounds</div>
                <div className="text-gray-600">{Math.max(...bracket.map(m => m.round_number))}</div>
              </div>
              <div>
                <div className="font-medium">Completed</div>
                <div className="text-gray-600">{bracket.filter(m => m.status === 'completed').length}</div>
              </div>
              <div>
                <div className="font-medium">Pending</div>
                <div className="text-gray-600">{bracket.filter(m => m.status === 'scheduled' && m.player1_id && m.player2_id).length}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};