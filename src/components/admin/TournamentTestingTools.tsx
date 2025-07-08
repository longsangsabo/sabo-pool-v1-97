import React, { useState, useEffect } from 'react';
import { Trophy, Users, Loader2, Play, Eye, GitBranch, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

const MatchTester = ({ 
  tournamentId, 
  bracket, 
  loadBracket, 
  addLog 
}: { 
  tournamentId: string;
  bracket: any[];
  loadBracket: () => void;
  addLog: (message: string, type?: 'info' | 'error' | 'success') => void;
}) => {
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [isReporting, setIsReporting] = useState(false);

  const reportMatchResult = async (matchId: string, winnerId: string, score: { player1: number; player2: number }) => {
    setIsReporting(true);
    try {
      addLog(`🎯 Báo kết quả Match ${selectedMatch.match_number}...`);
      
      // Update match result
      const { error: matchError } = await supabase
        .from('tournament_matches')
        .update({
          winner_id: winnerId,
          score_player1: score.player1,
          score_player2: score.player2,
          status: 'completed',
          actual_end_time: new Date().toISOString()
        })
        .eq('id', matchId);

      if (matchError) throw matchError;
      addLog(`✅ Match result updated`);

      // Trigger advancement logic
      const { data: advancement, error: advError } = await supabase
        .rpc('advance_tournament_winner', {
          p_match_id: matchId,
          p_tournament_id: tournamentId
        });

      if (advError) throw advError;
      
      const advResult = advancement as any;
      if (advResult.success) {
        if (advResult.advancement?.tournament_complete) {
          addLog(`🏆 Tournament completed! Champion: ${selectedMatch.player1_id === winnerId ? selectedMatch.player1?.display_name : selectedMatch.player2?.display_name}`, 'success');
        } else {
          addLog(`✅ Winner advanced to Round ${advResult.advancement?.next_round} Match ${advResult.advancement?.next_match_number}`, 'success');
        }
        addLog(`🔄 Bracket updated automatically`, 'success');
      } else {
        throw new Error(advResult.error || 'Advancement failed');
      }
      
      // Clear selection and reload bracket
      setSelectedMatch(null);
      loadBracket();
      
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`, 'error');
      toast.error('Lỗi báo kết quả: ' + error.message);
    } finally {
      setIsReporting(false);
    }
  };

  const availableMatches = bracket.filter(m => 
    m.status === 'scheduled' && 
    m.player1_id && 
    m.player2_id &&
    !m.winner_id
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          ⚾ Match Result Tester
        </CardTitle>
        <CardDescription>
          Test match reporting and winner advancement logic
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Chọn trận để test:</label>
          <Select 
            value={selectedMatch?.id || ''} 
            onValueChange={(value) => {
              const match = availableMatches.find(m => m.id === value);
              setSelectedMatch(match);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="-- Chọn trận đấu --" />
            </SelectTrigger>
            <SelectContent>
              {availableMatches.map(match => (
                <SelectItem key={match.id} value={match.id}>
                  R{match.round_number} M{match.match_number}: {match.player1?.display_name || match.player1?.full_name} vs {match.player2?.display_name || match.player2?.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedMatch && (
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h4 className="font-medium mb-3">Test Match Result</h4>
            <div className="bg-white dark:bg-gray-700 p-3 rounded mb-3">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Round {selectedMatch.round_number} - Match {selectedMatch.match_number}
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {selectedMatch.player1?.display_name || selectedMatch.player1?.full_name}
                  {selectedMatch.player1?.profile_type === 'test' && (
                    <span className="text-orange-500 ml-1 text-xs">[TEST]</span>
                  )}
                </span>
                <span className="text-gray-400">vs</span>
                <span className="font-medium">
                  {selectedMatch.player2?.display_name || selectedMatch.player2?.full_name}
                  {selectedMatch.player2?.profile_type === 'test' && (
                    <span className="text-orange-500 ml-1 text-xs">[TEST]</span>
                  )}
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex gap-3">
                <Button 
                  onClick={() => reportMatchResult(selectedMatch.id, selectedMatch.player1_id, {player1: 2, player2: 1})}
                  disabled={isReporting}
                  className="flex-1"
                  variant="default"
                >
                  {isReporting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    "🏆"
                  )}
                  {selectedMatch.player1?.display_name || selectedMatch.player1?.full_name} Wins (2-1)
                </Button>
                <Button 
                  onClick={() => reportMatchResult(selectedMatch.id, selectedMatch.player2_id, {player1: 1, player2: 2})}
                  disabled={isReporting}
                  className="flex-1"
                  variant="default"
                >
                  {isReporting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    "🏆"
                  )}
                  {selectedMatch.player2?.display_name || selectedMatch.player2?.full_name} Wins (1-2)
                </Button>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded text-sm">
                <div className="font-medium mb-1">🔍 What will happen:</div>
                <ul className="text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Match result will be recorded</li>
                  <li>• Winner advances to Round {selectedMatch.round_number + 1}</li>
                  <li>• Bracket updates automatically</li>
                  <li>• Real-time verification of tournament logic</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {availableMatches.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            No matches available for testing. 
            {bracket.length === 0 ? ' Load bracket first.' : ' All matches completed or not ready.'}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const BracketVerification = ({ tournamentId, addLog }: { tournamentId: string; addLog: (message: string, type?: 'info' | 'error' | 'success') => void }) => {
  const [bracket, setBracket] = useState<any[]>([]);
  const [seeding, setSeeding] = useState<any[]>([]);
  const [bracketData, setBracketData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadBracket = async () => {
    setLoading(true);
    try {
      // Load tournament matches with player info from all_profiles view
      const { data: matches, error: matchError } = await supabase
        .from('tournament_matches')
        .select(`
          *,
          player1:all_profiles!tournament_matches_player1_id_fkey(user_id, full_name, display_name, profile_type),
          player2:all_profiles!tournament_matches_player2_id_fkey(user_id, full_name, display_name, profile_type)
        `)
        .eq('tournament_id', tournamentId)
        .order('round_number', { ascending: true })
        .order('match_number', { ascending: true });

      if (matchError) throw matchError;

      // Load seeding data
      const { data: seedingData, error: seedError } = await supabase
        .from('tournament_seeding')
        .select(`
          *,
          player:all_profiles!tournament_seeding_player_id_fkey(user_id, full_name, display_name, profile_type)
        `)
        .eq('tournament_id', tournamentId)
        .order('seed_position', { ascending: true });

      if (seedError) throw seedError;

      // Load bracket metadata
      const { data: bracketMeta, error: bracketError } = await supabase
        .from('tournament_brackets')
        .select('*')
        .eq('tournament_id', tournamentId)
        .single();

      if (bracketError && bracketError.code !== 'PGRST116') throw bracketError;

      setBracket(matches || []);
      setSeeding(seedingData || []);
      setBracketData(bracketMeta);
    } catch (error) {
      console.error('Error loading bracket:', error);
      toast.error('Lỗi load bracket: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getRoundName = (round: number, totalRounds: number) => {
    const remaining = Math.pow(2, totalRounds - round + 1);
    switch (remaining) {
      case 2: return 'Final';
      case 4: return 'Semifinal';
      case 8: return 'Quarterfinal';
      default: return `Round ${round} (${remaining}→${remaining/2})`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          🏆 Bracket Verification
        </CardTitle>
        <CardDescription>
          Verify tournament bracket structure and seeding
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Tournament Bracket</h3>
          <Button onClick={loadBracket} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Load Bracket
              </>
            )}
          </Button>
        </div>

        {seeding.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-medium mb-3">🎯 Seeding Order (Top 8)</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {seeding.slice(0, 8).map((seed) => (
                <div key={seed.seed_position} className="flex justify-between p-2 bg-white dark:bg-gray-800 rounded">
                  <span className="font-medium">#{seed.seed_position}</span>
                  <span>
                    {seed.player?.display_name || seed.player?.full_name || 'BYE'}
                    {seed.player?.profile_type === 'test' && (
                      <span className="text-orange-500 ml-1">[TEST]</span>
                    )}
                  </span>
                  <span className="text-gray-500">{seed.elo_rating} ELO</span>
                </div>
              ))}
            </div>
            {seeding.length > 8 && (
              <div className="text-center mt-2 text-gray-500 text-sm">
                ... và {seeding.length - 8} players khác
              </div>
            )}
          </div>
        )}

        {bracket.length > 0 && (
          <div className="space-y-4">
            {/* Bracket Structure */}
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.max(...bracket.map(m => m.round_number))}, 1fr)` }}>
              {[...Array(Math.max(...bracket.map(m => m.round_number)))].map((_, roundIndex) => {
                const round = roundIndex + 1;
                const roundMatches = bracket.filter(m => m.round_number === round);
                const totalRounds = Math.max(...bracket.map(m => m.round_number));
                
                return (
                  <div key={round}>
                    <h4 className="font-medium mb-2 text-center">
                      {getRoundName(round, totalRounds)}
                    </h4>
                    <div className="space-y-2">
                      {roundMatches.map(match => (
                        <div key={match.id} className="p-3 border rounded-lg bg-white dark:bg-gray-800">
                          <div className="text-xs text-gray-500 mb-1">
                            Match {match.match_number}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">
                                {match.player1?.display_name || match.player1?.full_name || 'TBD'}
                                {match.player1?.profile_type === 'test' && (
                                  <span className="text-orange-500 ml-1 text-xs">[TEST]</span>
                                )}
                              </span>
                              {match.winner_id === match.player1_id && (
                                <span className="text-green-500 text-xs">✓</span>
                              )}
                              {match.score_player1 !== null && (
                                <span className="text-xs text-gray-500">{match.score_player1}</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400">vs</div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">
                                {match.player2?.display_name || match.player2?.full_name || 'TBD'}
                                {match.player2?.profile_type === 'test' && (
                                  <span className="text-orange-500 ml-1 text-xs">[TEST]</span>
                                )}
                              </span>
                              {match.winner_id === match.player2_id && (
                                <span className="text-green-500 text-xs">✓</span>
                              )}
                              {match.score_player2 !== null && (
                                <span className="text-xs text-gray-500">{match.score_player2}</span>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1 flex justify-between">
                            <span>Status: {match.status}</span>
                            {match.winner_id && (
                              <span className="text-green-600 font-medium">COMPLETED</span>
                            )}
                          </div>
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
                  <div className="font-medium">Players Seeded</div>
                  <div className="text-gray-600">{seeding.length}</div>
                </div>
                <div>
                  <div className="font-medium">Completed Matches</div>
                  <div className="text-gray-600">{bracket.filter(m => m.status === 'completed').length}</div>
                </div>
                <div>
                  <div className="font-medium">Pending Matches</div>
                  <div className="text-gray-600">{bracket.filter(m => m.status === 'scheduled' && m.player1_id && m.player2_id).length}</div>
                </div>
              </div>
            </div>

            {/* Real-time Match Testing */}
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <h4 className="font-medium mb-2">⚡ Real-time Testing</h4>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Use the Match Tester below to:
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Report match results and see instant bracket updates</li>
                  <li>Verify winner advancement logic</li>
                  <li>Test tournament progression from Round 1 to Final</li>
                  <li>Confirm automatic status updates</li>
                </ul>
              </div>
            </div>

            {/* Verification Checklist */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <h4 className="font-medium mb-2">✅ Verification Checklist</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className={seeding.length === 16 ? "text-green-500" : "text-red-500"}>
                    {seeding.length === 16 ? "✅" : "❌"}
                  </span>
                  <span>All 16 players properly seeded: {seeding.length}/16</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={bracket.filter(m => m.round_number === 1).length === 8 ? "text-green-500" : "text-red-500"}>
                    {bracket.filter(m => m.round_number === 1).length === 8 ? "✅" : "❌"}
                  </span>
                  <span>Round 1 has 8 matches: {bracket.filter(m => m.round_number === 1).length}/8</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={bracketData?.bracket_data?.tournament_type === 'single_elimination' ? "text-green-500" : "text-yellow-500"}>
                    {bracketData?.bracket_data?.tournament_type === 'single_elimination' ? "✅" : "⚠️"}
                  </span>
                  <span>Tournament format: {bracketData?.bracket_data?.tournament_type || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={bracket.length === 15 ? "text-green-500" : "text-red-500"}>
                    {bracket.length === 15 ? "✅" : "❌"}
                  </span>
                  <span>Total matches for 16-player bracket: {bracket.length}/15</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={bracket.filter(m => m.player1_id && m.player2_id).length >= 8 ? "text-green-500" : "text-red-500"}>
                    {bracket.filter(m => m.player1_id && m.player2_id).length >= 8 ? "✅" : "❌"}
                  </span>
                  <span>Ready matches: {bracket.filter(m => m.player1_id && m.player2_id).length}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && bracket.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Click "Load Bracket" to verify tournament structure
          </div>
        )}
        
        {/* Match Tester Integration */}
        {bracket.length > 0 && (
          <MatchTester 
            tournamentId={tournamentId}
            bracket={bracket}
            loadBracket={loadBracket}
            addLog={addLog}
          />
        )}
      </CardContent>
    </Card>
  );
};

const TournamentTestingTools = () => {
  const { t } = useLanguage();
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedTournament, setSelectedTournament] = useState('');
  const [isPopulating, setIsPopulating] = useState(false);
  const [logs, setLogs] = useState<Array<{message: string, type: 'info' | 'error' | 'success', timestamp: string}>>([]);

  // Load tournaments
  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('id, name, current_participants, max_participants, status')
        .in('status', ['upcoming', 'registration_open', 'registration_closed'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTournaments(data || []);
    } catch (error) {
      console.error('Error loading tournaments:', error);
    }
  };

  const addLog = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    const timestamp = new Date().toLocaleTimeString('vi-VN');
    setLogs(prev => [...prev, { message, type, timestamp }]);
  };

  const populateTournamentForTesting = async () => {
    if (!selectedTournament) {
      toast.error('Vui lòng chọn giải đấu trước');
      return;
    }

    setIsPopulating(true);
    setLogs([]);
    
    try {
      addLog('🚀 Bắt đầu tạo 16 test users...');
      
      // Step 1: Create 16 fake users using admin function (bypasses wallet triggers)
      const fakeUsersData = Array.from({length: 16}, (_, i) => ({
        phone: `090${String(Date.now() + i).slice(-7)}`,
        full_name: `Test Player ${i + 1}`,
        display_name: `Player${i + 1}`,
        role: 'player',
        skill_level: ['beginner', 'intermediate', 'advanced'][i % 3],
        city: 'Hồ Chí Minh',
        district: 'Quận 1',
        bio: `Auto-generated test user ${i + 1} for tournament testing - NO WALLET`,
        activity_status: 'active'
      }));

      // Use new safe admin function to create test users without wallet triggers
      const { data: createResult, error: userError } = await supabase
        .rpc('admin_create_test_users_safe', {
          user_data: fakeUsersData
        });

      if (userError) throw userError;
      
      // Type cast the result since RPC returns Json type
      const result = createResult as any;
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create test users');
      }

      const users = result.users;
      addLog(`✅ Đã tạo ${users.length} test users thành công`);

      // Step 2: Create rankings for test users
      addLog('🏆 Tạo ranking cho test users...');
      const rankings = users.map(user => ({
        player_id: user.user_id,
        elo: 1000 + Math.floor(Math.random() * 200),
        spa_points: Math.floor(Math.random() * 100),
        total_matches: Math.floor(Math.random() * 10),
        wins: Math.floor(Math.random() * 5),
        losses: Math.floor(Math.random() * 5)
      }));

      const { error: rankingError } = await supabase
        .from('test_player_rankings')
        .insert(rankings);

      if (rankingError) {
        addLog(`⚠️ Lỗi tạo ranking: ${rankingError.message}`, 'error');
      } else {
        addLog('✅ Ranking được tạo thành công');
      }

      // Step 3: Register users to tournament using admin function
      addLog('📝 Đăng ký users vào giải đấu...');
      const testUserIds = users.map(user => user.user_id);
      
      const { data: regResult, error: regError } = await supabase
        .rpc('admin_register_test_users_to_tournament_final', {
          p_tournament_id: selectedTournament,
          p_test_user_ids: testUserIds
        });

      if (regError) throw regError;
      
      // Type cast the result since RPC returns Json type
      const regResultData = regResult as any;
      
      if (!regResultData.success) {
        throw new Error(regResultData.error || 'Failed to register test users');
      }
      
      addLog(`✅ Đã đăng ký ${regResultData.registrations_created} users vào giải`);

      // Step 4: Update tournament status
      addLog('🔄 Cập nhật trạng thái giải đấu...');
      const { error: tournamentError } = await supabase
        .from('tournaments')
        .update({
          current_participants: 16,
          status: 'registration_closed',
          management_status: 'locked'
        })
        .eq('id', selectedTournament);

      if (tournamentError) throw tournamentError;
      addLog('✅ Giải đấu đã đầy 16/16 players');

      // Step 5: Generate bracket
      addLog('🎯 Tạo bracket tự động...');
      const { data: bracketResult, error: bracketError } = await supabase
        .rpc('generate_advanced_tournament_bracket', {
          p_tournament_id: selectedTournament,
          p_seeding_method: 'elo_ranking',
          p_force_regenerate: true
        });

      if (bracketError) throw bracketError;
      addLog('🏆 Bracket đã được tạo thành công!', 'success');
      addLog('🎉 Tournament sẵn sàng để test!', 'success');
      
      toast.success('Tournament đã được populate thành công!');
      loadTournaments(); // Refresh tournament list

    } catch (error) {
      addLog(`❌ Lỗi: ${error.message}`, 'error');
      toast.error(`Lỗi: ${error.message}`);
      console.error('Tournament populate error:', error);
    } finally {
      setIsPopulating(false);
    }
  };

  const cleanupTestData = async () => {
    try {
      addLog('🧹 Bắt đầu xóa test data...');
      
      // First get test user IDs from test_profiles table
      const { data: testUsers, error: getUserError } = await supabase
        .from('test_profiles')
        .select('user_id');

      if (getUserError) throw getUserError;
      
      if (testUsers && testUsers.length > 0) {
        const testUserIds = testUsers.map(u => u.user_id);
        
        // Delete test tournament registrations first
        const { error: testRegError } = await supabase
          .from('test_tournament_registrations')
          .delete()
          .in('player_id', testUserIds);

        if (testRegError) {
          addLog(`⚠️ Lỗi xóa test registrations: ${testRegError.message}`, 'error');
        }

        // Delete tournament registrations (if any exist in production table)
        const { error: regError } = await supabase
          .from('tournament_registrations')
          .delete()
          .in('player_id', testUserIds);

        if (regError) {
          addLog(`⚠️ Lỗi xóa registrations: ${regError.message}`, 'error');
        }

        // Delete test rankings
        const { error: rankError } = await supabase
          .from('test_player_rankings')
          .delete()
          .in('player_id', testUserIds);

        if (rankError) {
          addLog(`⚠️ Lỗi xóa rankings: ${rankError.message}`, 'error');
        }

        // Delete test users
        const { error: userError } = await supabase
          .from('test_profiles')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

        if (userError) throw userError;
        
        addLog(`✅ Đã xóa ${testUsers.length} test users và related data`, 'success');
      } else {
        addLog('ℹ️ Không tìm thấy test users để xóa', 'info');
      }
      
      toast.success('Test data đã được xóa');
      loadTournaments(); // Refresh tournament list
    } catch (error) {
      addLog(`❌ Lỗi xóa test data: ${error.message}`, 'error');
      toast.error(`Lỗi xóa test data: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Công Cụ Test Tournament
          </CardTitle>
          <CardDescription>
            Tạo 16 test users và populate tournament để test bracket generation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Chọn giải đấu để test:</label>
              <Select value={selectedTournament} onValueChange={setSelectedTournament}>
                <SelectTrigger>
                  <SelectValue placeholder="-- Chọn giải đấu --" />
                </SelectTrigger>
                <SelectContent>
                  {tournaments.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} ({t.current_participants || 0}/{t.max_participants || 16})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          <div className="flex gap-3">
            <Button 
              onClick={populateTournamentForTesting}
              disabled={!selectedTournament || isPopulating}
              className="flex-1"
            >
              {isPopulating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tạo test data...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  🎯 Populate Tournament với 16 Users
                </>
              )}
            </Button>

            <Button 
              onClick={cleanupTestData}
              disabled={isPopulating}
              variant="outline"
            >
              🧹 Cleanup Test Data
            </Button>
          </div>
        </div>

        {/* Real-time logs */}
        {logs.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border max-h-60 overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">
                Tiến trình ({logs.length})
              </h4>
              <button 
                onClick={() => setLogs([])}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Clear
              </button>
            </div>
            <div className="space-y-1">
              {logs.map((log, index) => (
                <div 
                  key={index} 
                  className={`text-xs font-mono flex items-start gap-2 p-2 rounded ${
                    log.type === 'error' 
                      ? 'bg-red-50 text-red-700 border-l-2 border-red-300' 
                      : log.type === 'success'
                      ? 'bg-green-50 text-green-700 border-l-2 border-green-300'
                      : 'bg-blue-50 text-blue-700 border-l-2 border-blue-300'
                  }`}
                >
                  <span className="text-gray-500 min-w-fit">
                    [{log.timestamp}]
                  </span>
                  <span className="flex-1">
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
            {logs.length === 0 && (
              <p className="text-sm text-gray-500 italic">Chưa có log nào...</p>
            )}
          </div>
        )}
        </CardContent>
      </Card>

      {/* Bracket Verification Section */}
      {selectedTournament && (
        <BracketVerification tournamentId={selectedTournament} addLog={addLog} />
      )}
    </div>
  );
};

export default TournamentTestingTools;