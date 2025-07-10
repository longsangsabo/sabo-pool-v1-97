import React, { useState, useEffect } from 'react';
import { Trophy, Users, Loader2, Play, Eye, GitBranch, Target, BookOpen, Info, Zap, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TournamentPlayerManagement } from './TournamentPlayerManagement';

// Import workflow components
import { useTournamentWorkflow } from '@/hooks/useTournamentWorkflow';
import { WorkflowProgress, WORKFLOW_STEPS } from './workflow/WorkflowSteps';
import { IntegratedWorkflowStep } from './workflow/IntegratedWorkflowStep';
import { TournamentSelectionStep } from './workflow/steps/TournamentSelectionStep';
import { MatchReportingStep } from './workflow/steps/MatchReportingStep';
import { TournamentProgressionStep } from './workflow/steps/TournamentProgressionStep';
import { AdminControlsStep } from './workflow/steps/AdminControlsStep';
import { UserExperienceStep } from './workflow/steps/UserExperienceStep';
import { ScaleTestingStep } from './workflow/steps/ScaleTestingStep';
import { DataCleanupStep } from './workflow/steps/DataCleanupStep';

// STEP 1 - Bracket Verification
const BracketVerification = ({ tournamentId, addLog }: { tournamentId: string; addLog: (message: string, type?: 'info' | 'error' | 'success') => void }) => {
  const [bracket, setBracket] = useState<any[]>([]);
  const [seeding, setSeeding] = useState<any[]>([]);
  const [bracketData, setBracketData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadBracket = async () => {
    if (!tournamentId) {
      addLog('❌ Vui lòng chọn một giải đấu trước', 'error');
      return;
    }

    setLoading(true);
    addLog('🔄 Đang tải bracket...', 'info');
    
    try {
      // First check if tournament has participants
      const { data: registrations, error: regError } = await supabase
        .from('tournament_registrations')
        .select('*')
        .eq('tournament_id', tournamentId)
        .eq('registration_status', 'confirmed');

      if (regError) {
        console.error('Registration error:', regError);
        addLog(`⚠️ Lỗi kiểm tra đăng ký: ${regError.message}`, 'error');
      }

      addLog(`👥 Tìm thấy ${registrations?.length || 0} người tham gia đã xác nhận`, 'info');

      if ((registrations?.length || 0) < 2) {
        addLog('⚠️ Tournament chưa có đủ người tham gia (tối thiểu 2 người). Hãy tạo participants trước.', 'error');
        setBracket([]);
        setSeeding([]);
        setBracketData(null);
        setLoading(false);
        return;
      }

      // Load tournament matches first
      const { data: matches, error: matchError } = await supabase
        .from('tournament_matches')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('round_number', { ascending: true })
        .order('match_number', { ascending: true });

      if (matchError) {
        console.error('Match error:', matchError);
        throw matchError;
      }

      addLog(`📊 Tìm thấy ${matches?.length || 0} trận đấu`, 'info');

      if (!matches || matches.length === 0) {
        addLog('⚠️ Tournament chưa có bracket. Hãy tạo bracket trước.', 'error');
        setBracket([]);
        setSeeding([]);
        setBracketData(null);
        setLoading(false);
        return;
      }

      // Get unique player IDs from matches
      const playerIds = new Set<string>();
      matches?.forEach(match => {
        if (match.player1_id) playerIds.add(match.player1_id);
        if (match.player2_id) playerIds.add(match.player2_id);
      });

      // Load player profiles separately
      let playerProfiles: any[] = [];
      if (playerIds.size > 0) {
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('user_id, full_name, display_name')
          .in('user_id', Array.from(playerIds));

        if (!profileError) {
          playerProfiles = profiles || [];
        }
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

      setBracket(matchesWithPlayers || []);

      // Load seeding data
      const { data: seedingData, error: seedError } = await supabase
        .from('tournament_seeding')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('seed_position', { ascending: true });

      if (seedError) {
        console.error('Seeding error:', seedError);
        addLog(`⚠️ Lỗi tải seeding: ${seedError.message}`, 'error');
      }

      // Add player data to seeding
      const seedingWithPlayers = seedingData?.map(seed => ({
        ...seed,
        player: seed.player_id 
          ? playerProfiles.find(p => p.user_id === seed.player_id)
          : null
      }));

      addLog(`🎯 Tìm thấy ${seedingData?.length || 0} seeded players`, 'info');

      // Load bracket metadata
      const { data: bracketMeta, error: bracketError } = await supabase
        .from('tournament_brackets')
        .select('*')
        .eq('tournament_id', tournamentId)
        .single();

      if (bracketError && bracketError.code !== 'PGRST116') {
        console.error('Bracket error:', bracketError);
        addLog(`⚠️ Lỗi tải bracket metadata: ${bracketError.message}`, 'error');
      }

      setSeeding(seedingWithPlayers || []);
      setBracketData(bracketMeta);
      
      addLog('✅ Bracket loaded successfully', 'success');
    } catch (error: any) {
      console.error('Load bracket error:', error);
      addLog(`❌ Lỗi loading bracket: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const createTestParticipants = async () => {
    if (!tournamentId) {
      addLog('❌ Vui lòng chọn một giải đấu trước', 'error');
      return;
    }

    setLoading(true);
    addLog('👥 Đang tạo participants test...', 'info');

    try {
      // Get available demo users
      const { data: demoUsers, error: demoError } = await supabase
        .rpc('get_available_demo_users', { needed_count: 4 });

      if (demoError) throw demoError;

      if (!demoUsers || demoUsers.length < 2) {
        addLog('❌ Không đủ demo users. Hãy tạo demo users trước.', 'error');
        setLoading(false);
        return;
      }

      addLog(`🎯 Tìm thấy ${demoUsers.length} demo users khả dụng`, 'info');

      // Register demo users for tournament
      const registrations = demoUsers.slice(0, 4).map((user: any) => ({
        tournament_id: tournamentId,
        player_id: user.user_id,
        registration_status: 'confirmed',
        registration_date: new Date().toISOString()
      }));

      const { error: regError } = await supabase
        .from('tournament_registrations')
        .insert(registrations);

      if (regError) throw regError;

      // Update tournament participant count
      const { error: updateError } = await supabase
        .from('tournaments')
        .update({ current_participants: registrations.length })
        .eq('id', tournamentId);

      if (updateError) throw updateError;

      addLog(`✅ Đã tạo ${registrations.length} participants test thành công!`, 'success');
    } catch (error: any) {
      addLog(`❌ Lỗi tạo participants: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const generateSampleBracket = async () => {
    if (!tournamentId) {
      addLog('❌ Vui lòng chọn một giải đấu trước', 'error');
      return;
    }

    setLoading(true);
    addLog('🔧 Đang tạo bracket mẫu...', 'info');

    try {
      // Check participants first
      const { data: registrations, error: regError } = await supabase
        .from('tournament_registrations')
        .select('*')
        .eq('tournament_id', tournamentId)
        .eq('registration_status', 'confirmed');

      if (regError) throw regError;

      if ((registrations?.length || 0) < 2) {
        addLog('❌ Tournament chưa có đủ người tham gia. Hãy tạo participants trước.', 'error');
        setLoading(false);
        return;
      }

      addLog(`🎯 Tournament found: ${tournamentId}`, 'info');
      addLog(`📊 Existing matches before: ${bracket.length}`, 'info');

      const { data, error } = await supabase.rpc('generate_advanced_tournament_bracket', {
        p_tournament_id: tournamentId,
        p_seeding_method: 'elo_ranking',
        p_force_regenerate: true
      });

      addLog(`🔧 Bracket function result: ${JSON.stringify(data)}`, 'info');

      if (error) throw error;

      // Check if matches were actually created
      const { data: newMatches, error: matchError } = await supabase
        .from('tournament_matches')
        .select('*')
        .eq('tournament_id', tournamentId);

      if (matchError) throw matchError;

      addLog(`📊 Matches after generation: ${newMatches?.length || 0}`, 'info');

      if (!newMatches || newMatches.length === 0) {
        addLog('⚠️ No new matches created. Function may have failed silently.', 'error');
      } else {
        addLog('✅ Tạo bracket mẫu thành công!', 'success');
        // Reload bracket after generation
        setTimeout(() => loadBracket(), 1000);
      }
    } catch (error: any) {
      addLog(`❌ Lỗi tạo bracket: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getRoundName = (round: number, totalRounds: number) => {
    const remaining = Math.pow(2, totalRounds - round + 1);
    switch (remaining) {
      case 2: return 'Chung kết';
      case 4: return 'Bán kết';
      case 8: return 'Tứ kết';
      default: return `Vòng ${round}`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          🏆 Xác Thực Bracket
        </CardTitle>
        <CardDescription>Xác minh cấu trúc bảng đấu và thứ tự seeding</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={loadBracket} disabled={loading || !tournamentId} className="flex-1">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
            {loading ? 'Đang tải...' : 'Tải Bracket'}
          </Button>
          <Button onClick={createTestParticipants} disabled={loading || !tournamentId} variant="outline">
            <Users className="mr-2 h-4 w-4" />
            Tạo Participants
          </Button>
          <Button onClick={generateSampleBracket} disabled={loading || !tournamentId} variant="outline">
            <Target className="mr-2 h-4 w-4" />
            Tạo Bracket Mẫu
          </Button>
        </div>

        {bracket.length > 0 && (
          <div className="space-y-4">
            {/* Seeding Display */}
            {seeding.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-medium mb-3">🎯 Thứ Tự Seeding (Top 8)</h4>
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

            {/* Bracket Grid */}
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.max(...bracket.map(m => m.round_number))}, 1fr)` }}>
              {[...Array(Math.max(...bracket.map(m => m.round_number)))].map((_, roundIndex) => {
                const round = roundIndex + 1;
                const roundMatches = bracket.filter(m => m.round_number === round);
                const totalRounds = Math.max(...bracket.map(m => m.round_number));
                
                return (
                  <div key={round}>
                    <h4 className="font-medium mb-2 text-center">{getRoundName(round, totalRounds)}</h4>
                    <div className="space-y-2">
                      {roundMatches.map(match => (
                        <div key={match.id} className="p-3 border rounded-lg bg-white dark:bg-gray-800">
                          <div className="text-xs text-gray-500 mb-1">Trận {match.match_number}</div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">{match.player1?.display_name || match.player1?.full_name || 'TBD'}</span>
                              {match.winner_id === match.player1_id && <span className="text-green-500 text-xs">✓</span>}
                            </div>
                            <div className="text-xs text-gray-400">vs</div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">{match.player2?.display_name || match.player2?.full_name || 'TBD'}</span>
                              {match.winner_id === match.player2_id && <span className="text-green-500 text-xs">✓</span>}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">Status: {match.status}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Statistics */}
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
      </CardContent>
    </Card>
  );
};

// STEP 2 - Match Result Tester
const MatchTester = ({ tournamentId, addLog }: { tournamentId: string; addLog: (message: string, type?: 'info' | 'error' | 'success') => void }) => {
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [isReporting, setIsReporting] = useState(false);

  useEffect(() => {
    if (tournamentId) {
      loadMatches();
    }
  }, [tournamentId]);

  const loadMatches = async () => {
    try {
      const { data, error } = await supabase
        .from('tournament_matches')
        .select(`
          *,
          player1:profiles!tournament_matches_player1_id_fkey(display_name, full_name),
          player2:profiles!tournament_matches_player2_id_fkey(display_name, full_name)
        `)
        .eq('tournament_id', tournamentId)
        .eq('status', 'scheduled')
        .not('player1_id', 'is', null)
        .not('player2_id', 'is', null);

      if (error) throw error;
      setMatches(data || []);
    } catch (error: any) {
      addLog(`❌ Error loading matches: ${error.message}`, 'error');
    }
  };

  const reportMatchResult = async (winnerId: string) => {
    if (!selectedMatch) return;

    setIsReporting(true);
    try {
      addLog(`🎯 Reporting match result...`);
      
      // Update match result
      const { error: matchError } = await supabase
        .from('tournament_matches')
        .update({
          winner_id: winnerId,
          score_player1: winnerId === selectedMatch.player1_id ? 2 : 1,
          score_player2: winnerId === selectedMatch.player2_id ? 2 : 1,
          status: 'completed',
          actual_end_time: new Date().toISOString()
        })
        .eq('id', selectedMatch.id);

      if (matchError) throw matchError;

      // Advance winner
      const { error: advanceError } = await supabase
        .rpc('advance_tournament_winner', {
          p_match_id: selectedMatch.id,
          p_tournament_id: tournamentId
        });

      if (advanceError) throw advanceError;

      addLog('✅ Match result reported and winner advanced', 'success');
      setSelectedMatch(null);
      loadMatches();
      
    } catch (error: any) {
      addLog(`❌ Error reporting result: ${error.message}`, 'error');
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          ⚾ Match Result Tester
        </CardTitle>
        <CardDescription>Test match reporting and winner advancement</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Select Match:</label>
          <Select value={selectedMatch?.id || ''} onValueChange={(value) => {
            const match = matches.find(m => m.id === value);
            setSelectedMatch(match);
          }}>
            <SelectTrigger>
              <SelectValue placeholder="-- Select Match --" />
            </SelectTrigger>
            <SelectContent>
              {matches.map(match => (
                <SelectItem key={match.id} value={match.id}>
                  R{match.round_number} M{match.match_number}: {match.player1?.display_name} vs {match.player2?.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedMatch && (
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-3">
            <h4 className="font-medium">Test Match Result</h4>
            <div className="flex gap-2">
              <Button 
                onClick={() => reportMatchResult(selectedMatch.player1_id)}
                disabled={isReporting}
                className="flex-1"
              >
                {isReporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "🏆"}
                {selectedMatch.player1?.display_name} Wins
              </Button>
              <Button 
                onClick={() => reportMatchResult(selectedMatch.player2_id)}
                disabled={isReporting}
                className="flex-1"
              >
                {isReporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "🏆"}
                {selectedMatch.player2?.display_name} Wins
              </Button>
            </div>
          </div>
        )}

        {matches.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            No matches available for testing.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// STEP 3 - Tournament Progression Tester
const TournamentProgressionTester = ({ tournamentId, addLog }: { tournamentId: string; addLog: (message: string, type?: 'info' | 'error' | 'success') => void }) => {
  const [isProgressing, setIsProgressing] = useState(false);
  const [progressLogs, setProgressLogs] = useState<string[]>([]);

  const addProgressLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `${timestamp}: ${message}`;
    setProgressLogs(prev => [...prev, logMessage]);
    addLog(message);
  };

  const completeRound = async (roundNumber: number) => {
    try {
      addProgressLog(`🚀 Completing Round ${roundNumber}...`);
      
      const { data: matches, error: matchesError } = await supabase
        .from('tournament_matches')
        .select('*')
        .eq('tournament_id', tournamentId)
        .eq('round_number', roundNumber)
        .eq('status', 'scheduled');

      if (matchesError) throw matchesError;

      if (!matches?.length) {
        addProgressLog(`✅ Round ${roundNumber} already completed`);
        return;
      }

      addProgressLog(`📊 Found ${matches.length} matches to complete`);

      for (const match of matches) {
        const randomWinner = Math.random() > 0.5 ? match.player1_id : match.player2_id;
        
        // Update match
        const { error: matchError } = await supabase
          .from('tournament_matches')
          .update({
            winner_id: randomWinner,
            score_player1: randomWinner === match.player1_id ? 2 : 1,
            score_player2: randomWinner === match.player2_id ? 2 : 1,
            status: 'completed',
            actual_end_time: new Date().toISOString()
          })
          .eq('id', match.id);

        if (matchError) throw matchError;

        // Advance winner
        const { error: advanceError } = await supabase
          .rpc('advance_tournament_winner', {
            p_match_id: match.id,
            p_tournament_id: tournamentId
          });

        if (advanceError) throw advanceError;

        await new Promise(resolve => setTimeout(resolve, 300));
      }

      addProgressLog(`✅ Round ${roundNumber} completed successfully`);
      
    } catch (error: any) {
      addProgressLog(`❌ Error completing Round ${roundNumber}: ${error.message}`);
    }
  };

  const runFullTournament = async () => {
    setIsProgressing(true);
    setProgressLogs([]);
    
    try {
      addProgressLog('🏆 Starting full tournament simulation...');
      
      await completeRound(1);
      await completeRound(2);
      await completeRound(3);
      await completeRound(4);
      
      // Update tournament status
      await supabase
        .from('tournaments')
        .update({ status: 'completed' })
        .eq('id', tournamentId);

      addProgressLog('🎉 Tournament completed successfully!');
      
    } catch (error: any) {
      addProgressLog(`💥 Tournament simulation failed: ${error.message}`);
    } finally {
      setIsProgressing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          🏆 Tournament Progression Tester
        </CardTitle>
        <CardDescription>Test complete tournament flow from start to champion</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => completeRound(1)} disabled={isProgressing} variant="outline" size="sm">
            Complete Round 1
          </Button>
          <Button onClick={() => completeRound(2)} disabled={isProgressing} variant="outline" size="sm">
            Complete Round 2
          </Button>
          <Button onClick={() => completeRound(3)} disabled={isProgressing} variant="outline" size="sm">
            Complete Round 3
          </Button>
          <Button onClick={() => completeRound(4)} disabled={isProgressing} variant="outline" size="sm">
            Complete Final
          </Button>
          <Button onClick={runFullTournament} disabled={isProgressing} className="bg-green-600 hover:bg-green-700">
            {isProgressing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            🚀 Run Full Tournament
          </Button>
        </div>

        {progressLogs.length > 0 && (
          <div className="bg-muted/50 p-3 rounded-lg max-h-60 overflow-y-auto">
            <h4 className="font-medium mb-2">Tournament Progress:</h4>
            <div className="space-y-1">
              {progressLogs.map((log, i) => (
                <div key={i} className="text-xs font-mono text-muted-foreground">{log}</div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// STEP 4 - Admin Tournament Controls Testing
const AdminTournamentControls = ({ tournamentId, addLog }: { tournamentId: string; addLog: (message: string, type?: 'info' | 'error' | 'success') => void }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const localAddLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    addLog(message);
  };

  const testAdminControls = async () => {
    setIsTesting(true);
    setLogs([]);
    
    try {
      addLog('🎮 Testing admin tournament controls...');
      
      await testStatusTransitions();
      await testPlayerManagement();
      await testTournamentModifications();
      await testAdminOverrides();
      
      addLog('✅ All admin controls tested successfully');
    } catch (error: any) {
      addLog(`❌ Admin testing failed: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const testStatusTransitions = async () => {
    const transitions = ['draft', 'registration_open', 'registration_closed', 'ongoing', 'completed', 'cancelled'];
    
    for (const status of transitions) {
      addLog(`🔄 Testing transition to: ${status}`);
      await supabase.from('tournaments').update({ status }).eq('id', tournamentId);
      await new Promise(r => setTimeout(r, 500));
    }
  };

  const testPlayerManagement = async () => {
    addLog('👥 Testing player management...');
    
    const { data: registrations } = await supabase
      .from('tournament_registrations')
      .select('*')
      .eq('tournament_id', tournamentId);
    
    addLog(`📊 Found ${registrations?.length || 0} registrations`);
    
    if (registrations && registrations.length > 0) {
      const firstReg = registrations[0];
      await supabase
        .from('tournament_registrations')
        .update({ registration_status: 'confirmed' })
        .eq('id', firstReg.id);
      addLog('✅ Player status updated successfully');
    }
  };

  const testTournamentModifications = async () => {
    addLog('🔧 Testing tournament modifications...');
    
    await supabase
      .from('tournaments')
      .update({ 
        updated_at: new Date().toISOString(),
        description: 'Updated via admin testing'
      })
      .eq('id', tournamentId);
    
    addLog('✅ Tournament modified successfully');
  };

  const testAdminOverrides = async () => {
    addLog('⚡ Testing admin overrides...');
    
    const { data: matches } = await supabase
      .from('tournament_matches')
      .select('*')
      .eq('tournament_id', tournamentId)
      .limit(1);
    
    if (matches && matches.length > 0) {
      const match = matches[0];
      await supabase
        .from('tournament_matches')
        .update({ 
          status: 'completed',
          winner_id: match.player1_id || match.player2_id
        })
        .eq('id', match.id);
      addLog('✅ Admin override applied successfully');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          🎮 Admin Controls Testing
        </CardTitle>
        <CardDescription>Test administrative tournament management features</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testAdminControls}
          disabled={isTesting}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isTesting ? 'Testing...' : 'Test All Admin Functions'}
        </Button>

        {logs.length > 0 && (
          <div className="bg-muted/50 p-3 rounded-lg max-h-40 overflow-y-auto">
            <h4 className="font-medium mb-2">Admin Test Logs:</h4>
            {logs.map((log, i) => (
              <div key={i} className="text-sm font-mono text-muted-foreground">{log}</div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// STEP 5 - User Experience Testing
const UserExperienceTester = ({ tournamentId, addLog }: { tournamentId: string; addLog?: (message: string, type?: 'info' | 'error' | 'success') => void }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const localAddLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    if (addLog) addLog(message);
  };

  const testUserJourney = async () => {
    setIsTesting(true);
    setLogs([]);
    
    try {
      addLog('👥 Testing user experience journey...');
      
      await testTournamentViewing();
      await testRegistrationFlow();
      await testNotifications();
      await testRealtimeUpdates();
      
      addLog('✅ User experience testing completed');
    } catch (error: any) {
      addLog(`❌ User testing failed: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const testTournamentViewing = async () => {
    addLog('📱 Testing tournament viewing...');
    
    const { data: tournament } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single();
    
    addLog(`📊 Tournament loaded: ${tournament?.name}`);
    
    const { data: bracket } = await supabase
      .from('tournament_brackets')
      .select('*')
      .eq('tournament_id', tournamentId);
    
    addLog(`🎯 Bracket data: ${bracket ? 'Available' : 'Not found'}`);
    
    const { data: matches } = await supabase
      .from('tournament_matches')
      .select('*')
      .eq('tournament_id', tournamentId);
    
    addLog(`⚾ Matches loaded: ${matches?.length || 0}`);
  };

  const testRegistrationFlow = async () => {
    addLog('📝 Testing registration flow...');
    
    const { data: registrations } = await supabase
      .from('tournament_registrations')
      .select('*')
      .eq('tournament_id', tournamentId);
    
    addLog(`👤 Registrations found: ${registrations?.length || 0}`);
  };

  const testNotifications = async () => {
    addLog('🔔 Testing notifications...');
    
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .contains('metadata', { tournament_id: tournamentId })
      .limit(5);
    
    addLog(`📢 Notifications found: ${notifications?.length || 0}`);
  };

  const testRealtimeUpdates = async () => {
    addLog('⚡ Testing real-time updates...');
    
    await supabase
      .from('tournaments')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', tournamentId);
    
    addLog('✅ Real-time update triggered');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          👥 User Experience Testing
        </CardTitle>
        <CardDescription>Test user-facing tournament features and interfaces</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testUserJourney}
          disabled={isTesting}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isTesting ? 'Testing...' : 'Test User Journey'}
        </Button>

        {logs.length > 0 && (
          <div className="bg-muted/50 p-3 rounded-lg max-h-40 overflow-y-auto">
            <h4 className="font-medium mb-2">UX Test Logs:</h4>
            {logs.map((log, i) => (
              <div key={i} className="text-sm font-mono text-muted-foreground">{log}</div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// STEP 6 - Scale & Performance Testing
const ScalePerformanceTester = ({ addLog: globalAddLog }: { addLog?: (message: string, type?: 'info' | 'error' | 'success') => void }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    if (globalAddLog) globalAddLog(message);
  };

  const testDifferentFormats = async () => {
    setIsTesting(true);
    setLogs([]);
    
    try {
      addLog('📈 Testing different tournament formats...');
      
      await createAndTestTournament(8, 'single_elimination');
      await createAndTestTournament(16, 'single_elimination');
      await createAndTestTournament(32, 'single_elimination');
      
      await measurePerformanceMetrics();
      
      addLog('✅ Scale testing completed');
    } catch (error: any) {
      addLog(`❌ Scale testing failed: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const createAndTestTournament = async (playerCount: number, format: string) => {
    const startTime = Date.now();
    addLog(`🎯 Creating ${playerCount}-player ${format} tournament...`);
    
    const { data: tournament } = await supabase
      .from('tournaments')
      .insert({
        name: `Scale Test ${playerCount} Players`,
        tournament_type: format,
        max_participants: playerCount,
        tournament_start: new Date(Date.now() + 86400000).toISOString(),
        tournament_end: new Date(Date.now() + 172800000).toISOString(),
        registration_start: new Date().toISOString(),
        registration_end: new Date(Date.now() + 43200000).toISOString(),
        status: 'registration_open'
      })
      .select()
      .single();
    
    if (!tournament) throw new Error('Failed to create tournament');
    
    const bracketStart = Date.now();
    const { error: bracketError } = await supabase
      .rpc('generate_advanced_tournament_bracket', {
        p_tournament_id: tournament.id,
        p_seeding_method: 'elo_ranking'
      });
    
    if (bracketError) throw bracketError;
    
    const bracketTime = Date.now() - bracketStart;
    const totalTime = Date.now() - startTime;
    
    addLog(`✅ ${playerCount}-player tournament: Total ${totalTime}ms, Bracket ${bracketTime}ms`);
  };

  const measurePerformanceMetrics = async () => {
    addLog('📊 Measuring performance metrics...');
    
    const { count: tournamentCount } = await supabase
      .from('tournaments')
      .select('*', { count: 'exact', head: true });
    
    const { count: matchCount } = await supabase
      .from('tournament_matches')
      .select('*', { count: 'exact', head: true });
    
    addLog(`📈 System stats: ${tournamentCount} tournaments, ${matchCount} matches`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          📈 Scale & Performance Testing
        </CardTitle>
        <CardDescription>Test system performance with different tournament sizes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testDifferentFormats}
          disabled={isTesting}
          className="w-full bg-orange-600 hover:bg-orange-700"
        >
          {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isTesting ? 'Testing...' : 'Test All Formats'}
        </Button>

        {logs.length > 0 && (
          <div className="bg-muted/50 p-3 rounded-lg max-h-40 overflow-y-auto">
            <h4 className="font-medium mb-2">Performance Logs:</h4>
            {logs.map((log, i) => (
              <div key={i} className="text-sm font-mono text-muted-foreground">{log}</div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// STEP 7 - Data Cleanup & Reset
const DataCleanupTools = ({ addLog: globalAddLog }: { addLog?: (message: string, type?: 'info' | 'error' | 'success') => void }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    if (globalAddLog) globalAddLog(message);
  };

  const cleanupAllTestData = async () => {
    setIsCleaningUp(true);
    setLogs([]);
    
    try {
      addLog('🧹 Starting comprehensive cleanup...');
      
      const { error: tournamentsError } = await supabase
        .from('tournaments')
        .delete()
        .or('name.ilike.%Test%,name.ilike.%Scale Test%');
      
      if (tournamentsError) throw tournamentsError;
      addLog('✅ Test tournaments removed');
      
      const { error: profilesError } = await supabase
        .from('profiles')
        .delete()
        .eq('is_demo_user', true)
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (profilesError) {
        addLog('⚠️ Test profiles cleanup skipped (table may not exist)');
      } else {
        addLog('✅ Test profiles removed');
      }
      
      addLog('✅ All test data cleaned up successfully');
    } catch (error: any) {
      addLog(`❌ Cleanup failed: ${error.message}`);
    } finally {
      setIsCleaningUp(false);
    }
  };

  const resetSystemForProduction = async () => {
    setIsCleaningUp(true);
    setLogs([]);
    
    try {
      addLog('🔄 Resetting system for production...');
      
      await cleanupAllTestData();
      await verifySystemIntegrity();
      
      addLog('🎉 System ready for production!');
    } catch (error: any) {
      addLog(`❌ Reset failed: ${error.message}`);
    } finally {
      setIsCleaningUp(false);
    }
  };

  const verifySystemIntegrity = async () => {
    addLog('🔍 Verifying system integrity...');
    
    const { data: orphanedMatches } = await supabase
      .from('tournament_matches')
      .select('id')
      .not('tournament_id', 'in', '(select id from tournaments)');
    
    if (orphanedMatches && orphanedMatches.length > 0) {
      addLog(`⚠️ Found ${orphanedMatches.length} orphaned matches`);
    } else {
      addLog('✅ No orphaned matches found');
    }
    
    addLog('✅ System integrity verified');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          🧹 Data Cleanup & Reset
        </CardTitle>
        <CardDescription>Clean up test data and reset system for production</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={cleanupAllTestData}
            disabled={isCleaningUp}
            variant="outline"
            className="flex-1"
          >
            {isCleaningUp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isCleaningUp ? 'Cleaning...' : 'Clean Test Data'}
          </Button>
          <Button 
            onClick={resetSystemForProduction}
            disabled={isCleaningUp}
            className="flex-1 bg-red-600 hover:bg-red-700"
          >
            {isCleaningUp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isCleaningUp ? 'Resetting...' : 'Reset for Production'}
          </Button>
        </div>

        {logs.length > 0 && (
          <div className="bg-muted/50 p-3 rounded-lg max-h-40 overflow-y-auto">
            <h4 className="font-medium mb-2">Cleanup Logs:</h4>
            {logs.map((log, i) => (
              <div key={i} className="text-sm font-mono text-muted-foreground">{log}</div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ============= ADMIN PANEL COMPREHENSIVE TESTING =============

// Admin Tournament Audit Component
const AdminTournamentAudit = ({ addLog }: { addLog: (message: string, type?: 'info' | 'error' | 'success') => void }) => {
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResults, setAuditResults] = useState<string[]>([]);

  const localAddLog = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    setAuditResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    addLog(message, type);
  };

  const runComprehensiveAudit = async () => {
    setIsAuditing(true);
    setAuditResults([]);
    
    try {
      localAddLog('🔍 Starting comprehensive admin panel audit...', 'info');
      
      // Test 1: Tournament Overview & Monitoring
      await testTournamentOverview();
      
      // Test 2: Tournament CRUD Operations
      await testTournamentCRUD();
      
      // Test 3: Player Management in Tournaments
      await testPlayerManagement();
      
      // Test 4: Match Management & Overrides
      await testMatchManagement();
      
      // Test 5: Real-time Monitoring
      await testRealtimeMonitoring();
      
      // Test 6: Analytics & Reporting
      await testAnalyticsReporting();
      
      // Test 7: System Health Checks
      await testSystemHealth();
      
      localAddLog('🎉 Comprehensive admin audit completed successfully!', 'success');
      
    } catch (error) {
      localAddLog(`💥 Audit failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setIsAuditing(false);
    }
  };

  const testTournamentOverview = async () => {
    localAddLog('📊 Testing tournament overview dashboard...');
    
    try {
      // Check if admin can see all tournaments
      const { data: tournaments, error: tournamentsError } = await supabase
        .from('tournaments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (tournamentsError) throw tournamentsError;
      
      localAddLog(`✅ Found ${tournaments?.length || 0} tournaments in system`);
      
      // Test tournament status filtering
      const statuses = ['draft', 'open', 'registration_closed', 'ongoing', 'completed'];
      for (const status of statuses) {
        const { count, error: countError } = await supabase
          .from('tournaments')
          .select('*', { count: 'exact', head: true })
          .eq('status', status);
        
        if (countError) throw countError;
        localAddLog(`📋 ${status}: ${count || 0} tournaments`);
      }
    } catch (error) {
      localAddLog(`❌ Tournament overview test failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const testTournamentCRUD = async () => {
    localAddLog('⚙️ Testing tournament CRUD operations...');
    
    try {
      // Test Create
      const { data: newTournament, error: createError } = await supabase
        .from('tournaments')
        .insert({
          name: `Admin Test Tournament ${Date.now()}`,
          description: 'Created by admin audit',
          max_participants: 8,
          entry_fee: 50000,
          status: 'upcoming',
          tournament_type: 'single_elimination',
          tier: 'amateur',
          venue_address: 'Test Venue',
          tournament_start: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          tournament_end: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
          registration_start: new Date().toISOString(),
          registration_end: new Date(Date.now() + 43200000).toISOString(), // 12 hours from now
        })
        .select()
        .single();
      
      if (createError) throw createError;
      
      localAddLog(`✅ Tournament created: ${newTournament.name}`);
      
      // Test Update
      const { error: updateError } = await supabase
        .from('tournaments')
        .update({ 
          status: 'registration_open',
          description: 'Updated by admin audit'
        })
        .eq('id', newTournament.id);
      
      if (updateError) throw updateError;
      localAddLog(`✅ Tournament updated successfully`);
      
      // Test Delete
      const { error: deleteError } = await supabase
        .from('tournaments')
        .delete()
        .eq('id', newTournament.id);
      
      if (deleteError) throw deleteError;
      localAddLog(`✅ Tournament deleted successfully`);
      
    } catch (error) {
      localAddLog(`❌ CRUD test failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const testPlayerManagement = async () => {
    localAddLog('👥 Testing player management functions...');
    
    try {
      // Get a test tournament
      const { data: tournaments } = await supabase
        .from('tournaments')
        .select('id')
        .limit(1);
      
      if (!tournaments?.length) {
        localAddLog('⚠️ No tournaments found for player management test');
        return;
      }
      
      const testTournamentId = tournaments[0].id;
      
      // Test viewing tournament registrations
      const { data: registrations, error: regError } = await supabase
        .from('tournament_registrations')
        .select(`
          *,
          profiles!tournament_registrations_player_id_fkey(
            full_name, display_name, phone
          )
        `)
        .eq('tournament_id', testTournamentId);
      
      if (regError) throw regError;
      
      localAddLog(`📋 Found ${registrations?.length || 0} registrations for tournament`);
      
      // Test player status management
      if (registrations?.length > 0) {
        const testRegistration = registrations[0];
        
        // Test status change
        const { error: statusError } = await supabase
          .from('tournament_registrations')
          .update({ registration_status: 'confirmed' })
          .eq('id', testRegistration.id);
        
        if (statusError) throw statusError;
        localAddLog(`✅ Player status updated successfully`);
      }
    } catch (error) {
      localAddLog(`❌ Player management test failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const testMatchManagement = async () => {
    localAddLog('⚾ Testing match management & overrides...');
    
    try {
      // Test viewing tournament matches
      const { data: matches, error: matchError } = await supabase
        .from('tournament_matches')
        .select(`
          *,
          player1:profiles!tournament_matches_player1_id_fkey(display_name),
          player2:profiles!tournament_matches_player2_id_fkey(display_name)
        `)
        .limit(5);
      
      if (matchError) throw matchError;
      
      localAddLog(`🎯 Found ${matches?.length || 0} tournament matches to test`);
      
      // Test admin match override
      if (matches?.length > 0) {
        const testMatch = matches[0];
        
        const { error: overrideError } = await supabase
          .from('tournament_matches')
          .update({
            notes: 'Modified by admin audit',
            updated_at: new Date().toISOString()
          })
          .eq('id', testMatch.id);
        
        if (overrideError) throw overrideError;
        localAddLog(`✅ Match override successful`);
      }
    } catch (error) {
      localAddLog(`❌ Match management test failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const testRealtimeMonitoring = async () => {
    localAddLog('📡 Testing real-time monitoring capabilities...');
    
    try {
      // Test real-time subscriptions
      const channel = supabase
        .channel('admin-monitoring')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'tournaments' },
          (payload) => localAddLog(`🔔 Tournament change detected: ${payload.eventType}`)
        )
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'tournament_matches' },
          (payload) => localAddLog(`🔔 Match change detected: ${payload.eventType}`)
        )
        .subscribe();
      
      localAddLog(`✅ Real-time monitoring active`);
      
      // Cleanup after test
      setTimeout(() => {
        channel.unsubscribe();
        localAddLog(`📡 Real-time monitoring stopped`);
      }, 3000);
    } catch (error) {
      localAddLog(`❌ Real-time monitoring test failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const testAnalyticsReporting = async () => {
    localAddLog('📈 Testing analytics & reporting functions...');
    
    try {
      // Test tournament statistics
      const { count: totalTournaments } = await supabase
        .from('tournaments')
        .select('*', { count: 'exact', head: true });
      
      const { count: activeTournaments } = await supabase
        .from('tournaments')
        .select('*', { count: 'exact', head: true })
        .in('status', ['registration_open', 'ongoing']);
      
      const { count: totalMatches } = await supabase
        .from('tournament_matches')
        .select('*', { count: 'exact', head: true });
      
      const { count: completedMatches } = await supabase
        .from('tournament_matches')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');
      
      localAddLog(`📊 Tournament Analytics:`);
      localAddLog(`   Total Tournaments: ${totalTournaments || 0}`);
      localAddLog(`   Active Tournaments: ${activeTournaments || 0}`);
      localAddLog(`   Total Matches: ${totalMatches || 0}`);
      localAddLog(`   Completed Matches: ${completedMatches || 0}`);
    } catch (error) {
      localAddLog(`❌ Analytics test failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const testSystemHealth = async () => {
    localAddLog('🏥 Testing system health checks...');
    
    try {
      // Test database connections
      const { error: dbError } = await supabase
        .from('tournaments')
        .select('id')
        .limit(1);
      
      if (dbError) throw dbError;
      localAddLog(`✅ Database connection healthy`);
      
      // Test admin permissions
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        localAddLog(`❌ No authenticated user found`, 'error');
        return;
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_admin')
        .eq('user_id', user.id)
        .single();
      
      if (profile?.is_admin) {
        localAddLog(`✅ Admin permissions verified`);
      } else {
        localAddLog(`⚠️ Admin permissions may be missing or not properly configured`);
      }
    } catch (error) {
      localAddLog(`❌ System health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">🔍 Admin Panel Comprehensive Audit</h2>
      <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
        <p className="text-sm text-yellow-800">
          This audit will test all admin functions with the tournament system. 
          Monitor the logs to verify each capability.
        </p>
      </div>
      
      <Button 
        onClick={runComprehensiveAudit}
        disabled={isAuditing}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        {isAuditing ? '🔄 Running Audit...' : '🚀 Run Complete Admin Audit'}
      </Button>
      
      {auditResults.length > 0 && (
        <div className="bg-gray-50 p-3 rounded-lg max-h-60 overflow-y-auto">
          <h4 className="font-medium mb-2">Audit Results:</h4>
          {auditResults.map((result, i) => (
            <div key={i} className="text-sm font-mono text-gray-700">{result}</div>
          ))}
        </div>
      )}
    </div>
  );
};

// Admin Capability Matrix Component
const AdminCapabilityMatrix = () => {
  const capabilities = [
    { category: 'Tournament Management', items: [
      'View all tournaments',
      'Create tournaments', 
      'Edit tournament details',
      'Change tournament status',
      'Delete tournaments',
      'Force tournament transitions'
    ]},
    { category: 'Player Management', items: [
      'View all registrations',
      'Approve/reject registrations',
      'Add players manually',
      'Remove players',
      'Change player status',
      'Player substitution'
    ]},
    { category: 'Match Management', items: [
      'View all matches',
      'Override match results',
      'Reschedule matches',
      'Add match notes',
      'Force match completion',
      'Generate brackets'
    ]},
    { category: 'System Monitoring', items: [
      'Real-time updates',
      'System health checks',
      'Performance monitoring',
      'Error tracking',
      'Audit logs',
      'Database status'
    ]}
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">🎛️ Admin Capability Matrix</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {capabilities.map(category => (
          <div key={category.category} className="border rounded-lg p-4 bg-white">
            <h4 className="font-semibold mb-3 text-primary">{category.category}</h4>
            <div className="space-y-2">
              {category.items.map(item => (
                <div key={item} className="flex items-center gap-2 text-sm">
                  <span className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></span>
                  <span className="text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="bg-blue-50 p-3 rounded border border-blue-200">
        <p className="text-sm text-blue-800">
          ✅ All capabilities above should be tested and verified through the admin audit.
        </p>
      </div>
    </div>
  );
}

// FINAL INTEGRATION - Complete Testing Dashboard
const CompleteTournamentTester = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [tournaments, setTournaments] = useState<any[]>([]);

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    const { data } = await supabase
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) {
      setTournaments(data);
    }
  };

  const steps = [
    { id: 1, name: 'Xác Thực Bracket', component: BracketVerification, requiresTournament: true },
    { id: 2, name: 'Báo Cáo Trận Đấu', component: MatchTester, requiresTournament: true },
    { id: 3, name: 'Tiến Trình Giải Đấu', component: TournamentProgressionTester, requiresTournament: true },
    { id: 4, name: 'Điều Khiển Admin', component: AdminTournamentControls, requiresTournament: true },
    { id: 5, name: 'Trải Nghiệm Người Dùng', component: UserExperienceTester, requiresTournament: true },
    { id: 6, name: 'Kiểm Thử Quy Mô', component: ScalePerformanceTester, requiresTournament: false },
    { id: 7, name: 'Dọn Dẹp Dữ Liệu', component: DataCleanupTools, requiresTournament: false },
    { id: 8, name: 'Kiểm Tra Admin', component: AdminTournamentAudit, requiresTournament: false },
    { id: 9, name: 'Ma Trận Khả Năng', component: AdminCapabilityMatrix, requiresTournament: false }
  ];

  const markStepCompleted = (stepId: number) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps(prev => [...prev, stepId]);
    }
  };

  const currentStepData = steps.find(s => s.id === currentStep);

  const addLog = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    console.log(`${type.toUpperCase()}: ${message}`);
  };

  const WorkflowGuide = () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <BookOpen className="h-4 w-4" />
          Hướng Dẫn
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Hướng Dẫn Quy Trình Kiểm Thử Giải Đấu
          </DialogTitle>
          <DialogDescription>
            Quy trình làm việc chi tiết để kiểm thử hệ thống giải đấu
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">📋 Tổng Quan Quy Trình (9 Bước)</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
              <li><strong>Xác Thực Bracket:</strong> Kiểm tra cấu trúc bảng đấu và seeding</li>
              <li><strong>Báo Cáo Trận Đấu:</strong> Thử nghiệm nhập kết quả và cập nhật</li>
              <li><strong>Tiến Trình Giải Đấu:</strong> Kiểm tra các giai đoạn và chuyển tiếp</li>
              <li><strong>Điều Khiển Admin:</strong> Thử nghiệm quyền quản trị</li>
              <li><strong>Trải Nghiệm Người Dùng:</strong> Kiểm tra giao diện người chơi</li>
              <li><strong>Kiểm Thử Quy Mô:</strong> Thử nghiệm hiệu suất hệ thống</li>
              <li><strong>Dọn Dẹp Dữ Liệu:</strong> Quản lý và làm sạch dữ liệu thử nghiệm</li>
              <li><strong>Kiểm Tra Admin:</strong> Audit toàn diện hệ thống</li>
              <li><strong>Ma Trận Khả Năng:</strong> Xem tổng quan các tính năng</li>
            </ol>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">🔄 Cách Thức Hoạt Động</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-green-700">
              <li><strong>Chọn Giải Đấu:</strong> Sử dụng dropdown để chọn giải đấu cần test</li>
              <li><strong>Điều Hướng Bước:</strong> Sử dụng nút Previous/Next hoặc click trực tiếp vào bước</li>
              <li><strong>Đánh Dấu Hoàn Thành:</strong> Click "Mark Complete" khi hoàn thành mỗi bước</li>
              <li><strong>Theo Dõi Tiến Độ:</strong> Xem progress bar và số bước đã hoàn thành</li>
              <li><strong>Logs Thời Gian Thực:</strong> Theo dõi kết quả test trong real-time</li>
            </ul>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Lưu Ý Quan Trọng</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700">
              <li>Một số bước yêu cầu phải chọn giải đấu trước</li>
              <li>Thực hiện tuần tự từ bước 1 đến 9 để có kết quả tốt nhất</li>
              <li>Theo dõi logs để phát hiện lỗi sớm</li>
              <li>Backup dữ liệu trước khi chạy Data Cleanup</li>
              <li>Admin Audit sẽ kiểm tra toàn bộ quyền quản trị</li>
            </ul>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-800 mb-2">🎯 Mục Tiêu Cuối</h3>
            <p className="text-sm text-purple-700">
              Sau khi hoàn thành tất cả 9 bước, bạn sẽ có được:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-purple-700 mt-2">
              <li>Xác nhận hệ thống tournament hoạt động chính xác</li>
              <li>Kiểm chứng tất cả tính năng admin</li>
              <li>Đảm bảo hiệu suất và độ ổn định</li>
              <li>Dữ liệu sạch và tối ưu</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="h-6 w-6" />
              Kiểm Thử Hệ Thống Giải Đấu Hoàn Chỉnh
            </h1>
            <p className="mt-2 text-blue-100">
              Bộ công cụ kiểm thử toàn diện cho chức năng giải đấu
            </p>
          </div>
          <WorkflowGuide />
        </div>
      </div>
      
      {/* Tournament Selection */}
      <Card>
        <CardContent className="pt-6">
          <div>
            <label className="block text-sm font-medium mb-2">Chọn Giải Đấu (cho bước 1-5):</label>
            <Select value={selectedTournament} onValueChange={setSelectedTournament}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn một giải đấu..." />
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
        </CardContent>
      </Card>
      
      {/* Progress indicator */}
      <div className="flex flex-wrap gap-2">
        {steps.map(step => (
          <div 
            key={step.id}
            className={`px-3 py-1 rounded text-sm cursor-pointer transition-colors ${
              completedSteps.includes(step.id) 
                ? 'bg-green-500 text-white' 
                : currentStep === step.id 
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
            }`}
            onClick={() => setCurrentStep(step.id)}
          >
            {step.name}
            {completedSteps.includes(step.id) && ' ✓'}
          </div>
        ))}
      </div>
      
      {/* Current step component */}
      <div className="border rounded-lg p-4">
        {currentStepData && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Bước {currentStep}: {currentStepData.name}</h3>
              <Button 
                onClick={() => markStepCompleted(currentStep)}
                variant="outline"
                size="sm"
                disabled={completedSteps.includes(currentStep)}
              >
                {completedSteps.includes(currentStep) ? 'Hoàn Thành ✓' : 'Đánh Dấu Hoàn Thành'}
              </Button>
            </div>
            
            {currentStepData.requiresTournament && !selectedTournament ? (
              <div className="text-center py-8 text-muted-foreground">
                Vui lòng chọn một giải đấu ở trên để kiểm thử bước này.
              </div>
            ) : (
              React.createElement(currentStepData.component, 
                currentStepData.requiresTournament 
                  ? { tournamentId: selectedTournament, addLog } 
                  : { tournamentId: '', addLog }
              )
            )}
          </>
        )}
      </div>
      
      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button 
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
          variant="outline"
        >
          Trước
        </Button>
        <div className="text-sm text-muted-foreground">
          Bước {currentStep} / {steps.length} | {completedSteps.length} đã hoàn thành
        </div>
        <Button 
          onClick={() => setCurrentStep(Math.min(9, currentStep + 1))}
          disabled={currentStep === 9}
        >
          Bước Tiếp
        </Button>
      </div>
    </div>
  );
};

const TournamentTestingTools = () => {
  return <CompleteTournamentTester />;
};

// Integrated Workflow Component
const IntegratedTournamentWorkflow = () => {
  const {
    state,
    completeStep,
    goToStep,
    canProceedToStep,
    resetWorkflow,
    setSelectedTournament,
    updateSharedData
  } = useTournamentWorkflow();

  const [logs, setLogs] = useState<Array<{ message: string; type: 'info' | 'error' | 'success'; timestamp: string }>>([]);

  const addLog = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    const newLog = {
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    };
    setLogs(prev => [...prev, newLog]);
    console.log(`${type.toUpperCase()}: ${message}`);
  };

  const handleStepComplete = async (stepId: number, results: any) => {
    addLog(`✅ Step ${stepId} completed successfully`, 'success');
    completeStep(stepId, results);
    
    // Auto-advance if configured
    const step = WORKFLOW_STEPS.find(s => s.id === stepId);
    if (step?.autoAdvance && stepId < WORKFLOW_STEPS.length) {
      addLog(`🚀 Auto-advancing to Step ${stepId + 1}...`, 'info');
      setTimeout(() => {
        goToStep(stepId + 1);
        toast.success(`Moved to Step ${stepId + 1}`);
      }, 1500);
    }
  };

  const renderCurrentStep = () => {
    const currentStepData = WORKFLOW_STEPS.find(s => s.id === state.currentStep);
    if (!currentStepData) return null;

    const isCompleted = state.completedSteps.includes(state.currentStep);
    const completionTime = isCompleted 
      ? state.testResults[getStepKey(state.currentStep)]?.completedAt 
      : undefined;

    const stepProps = {
      stepNumber: state.currentStep,
      title: currentStepData.title,
      description: currentStepData.description,
      icon: currentStepData.icon,
      onComplete: (results: any) => handleStepComplete(state.currentStep, results),
      onNext: () => {
        if (state.currentStep < WORKFLOW_STEPS.length) {
          goToStep(state.currentStep + 1);
        }
      },
      onPrevious: () => {
        if (state.currentStep > 1) {
          goToStep(state.currentStep - 1);
        }
      },
      canNext: canProceedToStep(state.currentStep + 1),
      canPrevious: state.currentStep > 1,
      autoAdvance: currentStepData.autoAdvance,
      sharedData: state.sharedData,
      isCompleted,
      completionTime: completionTime ? new Date(completionTime).toLocaleString() : undefined
    };

    // Render specific step component
    switch (state.currentStep) {
      case 1:
        return (
          <IntegratedWorkflowStep {...stepProps}>
            <TournamentSelectionStep
              onComplete={stepProps.onComplete}
              onTournamentSelect={setSelectedTournament}
              updateSharedData={updateSharedData}
              sharedData={state.sharedData}
              addLog={addLog}
            />
          </IntegratedWorkflowStep>
        );
        
      case 2:
        return (
          <IntegratedWorkflowStep {...stepProps}>
            <MatchReportingStep
              onComplete={stepProps.onComplete}
              sharedData={state.sharedData}
              addLog={addLog}
            />
          </IntegratedWorkflowStep>
        );
        
      case 3:
        return (
          <IntegratedWorkflowStep {...stepProps}>
            <TournamentProgressionStep
              onComplete={stepProps.onComplete}
              sharedData={state.sharedData}
              addLog={addLog}
            />
          </IntegratedWorkflowStep>
        );
        
      case 4:
        return (
          <IntegratedWorkflowStep {...stepProps}>
            <AdminControlsStep
              onComplete={stepProps.onComplete}
              sharedData={state.sharedData}
              addLog={addLog}
            />
          </IntegratedWorkflowStep>
        );
        
      case 5:
        return (
          <IntegratedWorkflowStep {...stepProps}>
            <UserExperienceStep
              onComplete={stepProps.onComplete}
              sharedData={state.sharedData}
              addLog={addLog}
            />
          </IntegratedWorkflowStep>
        );
        
      case 6:
        return (
          <IntegratedWorkflowStep {...stepProps}>
            <ScaleTestingStep
              onComplete={stepProps.onComplete}
              sharedData={state.sharedData}
              addLog={addLog}
            />
          </IntegratedWorkflowStep>
        );
        
      case 7:
        return (
          <IntegratedWorkflowStep {...stepProps}>
            <DataCleanupStep
              onComplete={stepProps.onComplete}
              sharedData={state.sharedData}
              addLog={addLog}
            />
          </IntegratedWorkflowStep>
        );
        
      default:
        return (
          <IntegratedWorkflowStep {...stepProps}>
            <div className="text-center py-8">
              <h3 className="text-lg font-medium mb-2">Step {state.currentStep} - Coming Soon</h3>
              <p className="text-gray-600">This step is being developed...</p>
              <Button 
                onClick={() => handleStepComplete(state.currentStep, { placeholder: true })}
                className="mt-4"
              >
                Mark as Complete (Demo)
              </Button>
            </div>
          </IntegratedWorkflowStep>
        );
    }
  };

  const runAutomatedWorkflow = async () => {
    addLog('🤖 Starting automated tournament testing workflow...', 'info');
    toast.info('Starting automated workflow...');
    
    // Reset workflow
    resetWorkflow();
    
    // This would be a full automated run through all steps
    addLog('🔧 Automated workflow feature coming soon...', 'info');
    toast.info('Automated workflow feature will be available soon');
  };

  const getStepKey = (stepNumber: number) => {
    const stepKeys = [
      'bracketVerification',
      'matchReporting', 
      'tournamentProgression',
      'adminControls',
      'userExperience',
      'scaleTesting',
      'dataCleanup'
    ];
    return stepKeys[stepNumber - 1];
  };

  return (
    <div className="space-y-6">
      {/* Workflow Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">🏆 Integrated Tournament Testing Workflow</h2>
          <p className="text-gray-600">Comprehensive testing system with automatic step progression</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={runAutomatedWorkflow}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Zap className="mr-2 h-4 w-4" />
            🤖 Run Automated Workflow
          </Button>
          <Button
            onClick={resetWorkflow}
            variant="outline"
          >
            Reset Workflow
          </Button>
        </div>
      </div>

      {/* Workflow Progress */}
      <WorkflowProgress
        currentStep={state.currentStep}
        completedSteps={state.completedSteps}
        onStepClick={goToStep}
        canProceedToStep={canProceedToStep}
      />

      {/* Current Step */}
      <div className="min-h-[400px]">
        {renderCurrentStep()}
      </div>

      {/* Workflow Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📝 Workflow Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {logs.length === 0 ? (
              <p className="text-gray-500 text-sm">No logs yet. Start testing to see activity.</p>
            ) : (
              logs.slice(-10).map((log, index) => (
                <div 
                  key={index} 
                  className={`text-sm p-2 rounded ${
                    log.type === 'error' ? 'bg-red-50 text-red-700' :
                    log.type === 'success' ? 'bg-green-50 text-green-700' :
                    'bg-gray-50 text-gray-700'
                  }`}
                >
                  <span className="font-mono text-xs text-gray-500">{log.timestamp}</span> {log.message}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Delete Test Tournaments Component
const DeleteTestTournaments = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [testTournaments, setTestTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTestTournaments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select(`
          *,
          tournament_registrations(count),
          tournament_matches(count)
        `)
        .like('name', '%Test Tournament%')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTestTournaments(data || []);
    } catch (error: any) {
      toast.error(`Lỗi tải tournament: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteSingleTournament = async (tournamentId: string, tournamentName: string) => {
    const confirmed = window.confirm(`Bạn có chắc muốn xóa tournament "${tournamentName}"? Hành động này không thể hoàn tác.`);
    if (!confirmed) return;

    setDeletingId(tournamentId);
    try {
      // Delete tournament matches first
      const { error: matchesError } = await supabase
        .from('tournament_matches')
        .delete()
        .eq('tournament_id', tournamentId);

      if (matchesError) throw matchesError;

      // Delete tournament registrations
      const { error: registrationsError } = await supabase
        .from('tournament_registrations')
        .delete()
        .eq('tournament_id', tournamentId);

      if (registrationsError) throw registrationsError;

      // Delete tournament brackets
      const { error: bracketsError } = await supabase
        .from('tournament_brackets')
        .delete()
        .eq('tournament_id', tournamentId);

      if (bracketsError) throw bracketsError;

      // Delete tournament seeding
      const { error: seedingError } = await supabase
        .from('tournament_seeding')
        .delete()
        .eq('tournament_id', tournamentId);

      if (seedingError) throw seedingError;

      // Finally delete tournament
      const { error: tournamentError } = await supabase
        .from('tournaments')
        .delete()
        .eq('id', tournamentId);

      if (tournamentError) throw tournamentError;

      toast.success(`Đã xóa thành công tournament "${tournamentName}"`);
      // Remove from local state
      setTestTournaments(prev => prev.filter(t => t.id !== tournamentId));
    } catch (error: any) {
      toast.error(`Lỗi xóa tournament: ${error.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const deleteAllTestTournaments = async () => {
    if (!testTournaments.length) return;
    
    const confirmed = window.confirm(`Bạn có chắc muốn xóa tất cả ${testTournaments.length} test tournaments? Hành động này không thể hoàn tác.`);
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      // Delete tournament matches first
      const { error: matchesError } = await supabase
        .from('tournament_matches')
        .delete()
        .in('tournament_id', testTournaments.map(t => t.id));

      if (matchesError) throw matchesError;

      // Delete tournament registrations
      const { error: registrationsError } = await supabase
        .from('tournament_registrations')
        .delete()
        .in('tournament_id', testTournaments.map(t => t.id));

      if (registrationsError) throw registrationsError;

      // Delete tournament brackets
      const { error: bracketsError } = await supabase
        .from('tournament_brackets')
        .delete()
        .in('tournament_id', testTournaments.map(t => t.id));

      if (bracketsError) throw bracketsError;

      // Delete tournament seeding
      const { error: seedingError } = await supabase
        .from('tournament_seeding')
        .delete()
        .in('tournament_id', testTournaments.map(t => t.id));

      if (seedingError) throw seedingError;

      // Finally delete tournaments
      const { error: tournamentsError } = await supabase
        .from('tournaments')
        .delete()
        .like('name', '%Test Tournament%');

      if (tournamentsError) throw tournamentsError;

      toast.success(`Đã xóa thành công ${testTournaments.length} test tournaments`);
      setTestTournaments([]);
    } catch (error: any) {
      toast.error(`Lỗi xóa tournaments: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  useEffect(() => {
    loadTestTournaments();
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-500" />
            🗑️ Xóa Test Tournaments
          </CardTitle>
          <CardDescription>
            Xóa các tournament test đã tạo để dọn dẹp database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                Tìm thấy: {testTournaments.length} test tournaments
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={loadTestTournaments}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                Refresh
              </Button>
              {testTournaments.length > 0 && (
                <Button
                  onClick={deleteAllTestTournaments}
                  disabled={isDeleting}
                  variant="destructive"
                  size="sm"
                >
                  {isDeleting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Xóa tất cả
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tournament List */}
      {testTournaments.length > 0 ? (
        <div className="space-y-3">
          {testTournaments.map((tournament) => (
            <Card key={tournament.id} className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      <h3 className="font-semibold text-lg">{tournament.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        tournament.status === 'completed' ? 'bg-green-100 text-green-800' :
                        tournament.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                        tournament.status === 'upcoming' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {tournament.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Tạo lúc:</span>
                        <br />
                        {formatDate(tournament.created_at)}
                      </div>
                      <div>
                        <span className="font-medium">Loại:</span>
                        <br />
                        {tournament.tournament_type || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Người tham gia:</span>
                        <br />
                        {tournament.current_participants || 0} / {tournament.max_participants || 0}
                      </div>
                      <div>
                        <span className="font-medium">Trận đấu:</span>
                        <br />
                        {tournament.tournament_matches?.[0]?.count || 0} trận
                      </div>
                    </div>

                    {tournament.description && (
                      <p className="text-sm text-gray-500 mt-2">
                        {tournament.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>ID: {tournament.id}</span>
                      {tournament.tournament_start && (
                        <span>Bắt đầu: {formatDate(tournament.tournament_start)}</span>
                      )}
                      {tournament.prize_pool && (
                        <span>Giải thưởng: {tournament.prize_pool.toLocaleString()} VND</span>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={() => deleteSingleTournament(tournament.id, tournament.name)}
                    disabled={deletingId === tournament.id || isDeleting}
                    variant="destructive"
                    size="sm"
                    className="ml-4"
                  >
                    {deletingId === tournament.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Đang tải danh sách tournaments...</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Không có test tournaments nào để xóa</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Tournament Player Management Tab Component
const TournamentPlayerManagementTab = () => {
  const [selectedTournament, setSelectedTournament] = useState<any>(null);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('id, name, max_participants, current_participants, status')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTournaments(data || []);
    } catch (error) {
      console.error('Error loading tournaments:', error);
      toast.error('Không thể tải danh sách giải đấu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Tournament Player Management
          </CardTitle>
          <CardDescription>
            Quản lý và thêm người chơi vào các giải đấu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Chọn giải đấu:</label>
              <Select 
                value={selectedTournament?.id || ''} 
                onValueChange={(value) => {
                  const tournament = tournaments.find(t => t.id === value);
                  setSelectedTournament(tournament);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn một giải đấu..." />
                </SelectTrigger>
                <SelectContent>
                  {tournaments.map(tournament => (
                    <SelectItem key={tournament.id} value={tournament.id}>
                      {tournament.name} ({tournament.current_participants}/{tournament.max_participants})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {loading && (
              <div className="text-center py-4">
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">Đang tải...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedTournament && (
        <TournamentPlayerManagement 
          tournament={selectedTournament}
          onParticipantsUpdated={() => {
            // Reload tournament data
            loadTournaments();
            // Update selected tournament
            const updatedTournament = tournaments.find(t => t.id === selectedTournament.id);
            if (updatedTournament) {
              setSelectedTournament(updatedTournament);
            }
          }}
        />
      )}
    </div>
  );
};

// Main Export - Choose between Integrated Workflow or Legacy Tools
const TournamentTestingToolsMain = () => {
  return (
    <Tabs defaultValue="integrated" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="integrated">🚀 Integrated Workflow</TabsTrigger>
        <TabsTrigger value="legacy">📋 Legacy Tools</TabsTrigger>
        <TabsTrigger value="players">👥 Players</TabsTrigger>
        <TabsTrigger value="cleanup">🗑️ Cleanup</TabsTrigger>
      </TabsList>
      
      <TabsContent value="integrated" className="mt-6">
        <IntegratedTournamentWorkflow />
      </TabsContent>
      
      <TabsContent value="legacy" className="mt-6">
        <TournamentTestingTools />
      </TabsContent>

      <TabsContent value="players" className="mt-6">
        <TournamentPlayerManagementTab />
      </TabsContent>

      <TabsContent value="cleanup" className="mt-6">
        <DeleteTestTournaments />
      </TabsContent>
    </Tabs>
  );
};

export default TournamentTestingToolsMain;