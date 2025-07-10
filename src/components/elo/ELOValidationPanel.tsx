import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Trophy, Calculator } from 'lucide-react';
import { RANK_ELO, TOURNAMENT_ELO_REWARDS, FIXED_K_FACTOR } from '@/utils/eloConstants';
import { getRankByElo } from '@/utils/rankUtils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ValidationResult {
  type: 'player_ranking' | 'tournament_result' | 'elo_history';
  id: string;
  issue: string;
  severity: 'error' | 'warning' | 'info';
  suggested_fix?: string;
  details?: any;
}

export const ELOValidationPanel: React.FC = () => {
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [stats, setStats] = useState({
    totalPlayers: 0,
    playersWithRankMismatch: 0,
    tournamentsToRecheck: 0,
    lastValidation: null as Date | null
  });
  const { toast } = useToast();

  const runValidation = async () => {
    setIsValidating(true);
    const results: ValidationResult[] = [];

    try {
      // 1. Validate player rankings vs ELO points
      const { data: players, error: playersError } = await supabase
        .from('player_rankings')
        .select(`
          player_id,
          elo_points,
          current_rank_id,
          ranks!inner(code)
        `);

      if (playersError) throw playersError;

      let rankMismatchCount = 0;
      players?.forEach(player => {
        const expectedRank = getRankByElo(player.elo_points);
        const currentRank = player.ranks.code;
        
        if (expectedRank !== currentRank) {
          rankMismatchCount++;
          results.push({
            type: 'player_ranking',
            id: player.player_id,
            issue: `Rank mismatch: Has ${currentRank} rank but ELO ${player.elo_points} should be ${expectedRank}`,
            severity: 'error',
            suggested_fix: `Update rank to ${expectedRank}`,
            details: {
              current_elo: player.elo_points,
              current_rank: currentRank,
              expected_rank: expectedRank
            }
          });
        }
      });

      // 2. Check for incomplete tournament results
      const { data: tournaments, error: tournamentsError } = await supabase
        .from('tournaments')
        .select('id, name, status')
        .eq('status', 'completed');

      if (tournamentsError) throw tournamentsError;

      // 3. Validate ELO history consistency
      const { data: recentHistory, error: historyError } = await supabase
        .from('elo_history')
        .select('*')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      if (historyError) throw historyError;

      recentHistory?.forEach(record => {
        const expectedChange = record.elo_after - record.elo_before;
        if (Math.abs(expectedChange - record.elo_change) > 1) {
          results.push({
            type: 'elo_history',
            id: record.id,
            issue: `ELO calculation inconsistency: Expected change ${expectedChange}, recorded ${record.elo_change}`,
            severity: 'warning',
            details: record
          });
        }
      });

      // Update stats
      setStats({
        totalPlayers: players?.length || 0,
        playersWithRankMismatch: rankMismatchCount,
        tournamentsToRecheck: tournaments?.length || 0,
        lastValidation: new Date()
      });

      setValidationResults(results);
      
      if (results.length === 0) {
        toast({
          title: "Validation Complete",
          description: "No issues found in ELO system",
        });
      } else {
        toast({
          title: "Validation Complete", 
          description: `Found ${results.length} issues to review`,
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Validation error:', error);
      toast({
        title: "Validation Failed",
        description: "Error during ELO system validation",
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  };

  const fixPlayerRank = async (playerId: string, expectedRank: string) => {
    try {
      const { data: rank, error: rankError } = await supabase
        .from('ranks')
        .select('id')
        .eq('code', expectedRank)
        .single();

      if (rankError) throw rankError;

      const { error: updateError } = await supabase
        .from('player_rankings')
        .update({ current_rank_id: rank.id })
        .eq('player_id', playerId);

      if (updateError) throw updateError;

      toast({
        title: "Fixed",
        description: `Player rank updated to ${expectedRank}`,
      });

      // Remove from results
      setValidationResults(prev => 
        prev.filter(result => !(result.type === 'player_ranking' && result.id === playerId))
      );

    } catch (error) {
      console.error('Fix error:', error);
      toast({
        title: "Fix Failed",
        description: "Failed to update player rank",
        variant: "destructive"
      });
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      error: 'destructive',
      warning: 'secondary', 
      info: 'default'
    } as const;
    
    return <Badge variant={variants[severity as keyof typeof variants]}>{severity}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.totalPlayers}</div>
            <p className="text-xs text-muted-foreground">Total Players</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.playersWithRankMismatch}</div>
            <p className="text-xs text-muted-foreground">Rank Mismatches</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{FIXED_K_FACTOR}</div>
            <p className="text-xs text-muted-foreground">Fixed K-Factor</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{Object.keys(RANK_ELO).length}</div>
            <p className="text-xs text-muted-foreground">Total Ranks</p>
          </CardContent>
        </Card>
      </div>

      {/* Validation Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            ELO System Validation
          </CardTitle>
          <CardDescription>
            Validate ELO calculations, rank assignments, and system consistency
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Button 
                onClick={runValidation} 
                disabled={isValidating}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isValidating ? 'animate-spin' : ''}`} />
                {isValidating ? 'Validating...' : 'Run Validation'}
              </Button>
              {stats.lastValidation && (
                <p className="text-sm text-muted-foreground mt-2">
                  Last validation: {stats.lastValidation.toLocaleString()}
                </p>
              )}
            </div>
            
            {validationResults.length === 0 && stats.lastValidation && (
              <Alert className="w-fit">
                <CheckCircle className="w-4 h-4" />
                <AlertDescription>
                  All ELO systems are consistent
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Validation Results */}
      {validationResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Validation Issues ({validationResults.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {validationResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getSeverityIcon(result.severity)}
                        {getSeverityBadge(result.severity)}
                        <Badge variant="outline">{result.type}</Badge>
                      </div>
                      <p className="text-sm font-medium mb-1">{result.issue}</p>
                      {result.suggested_fix && (
                        <p className="text-xs text-muted-foreground mb-2">
                          Suggested fix: {result.suggested_fix}
                        </p>
                      )}
                      {result.details && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-muted-foreground">
                            View details
                          </summary>
                          <pre className="mt-1 text-xs bg-muted p-2 rounded">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                    
                    {result.type === 'player_ranking' && result.details && (
                      <Button
                        size="sm"
                        onClick={() => fixPlayerRank(result.id, result.details.expected_rank)}
                        className="ml-4"
                      >
                        Quick Fix
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current ELO Rules Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Current ELO Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Rank Requirements</h4>
              <div className="space-y-2">
                {Object.entries(RANK_ELO).map(([rank, elo]) => (
                  <div key={rank} className="flex justify-between text-sm">
                    <span>{rank}</span>
                    <span>{elo}+ ELO</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Tournament Rewards</h4>
              <div className="space-y-2">
                {Object.entries(TOURNAMENT_ELO_REWARDS).map(([position, reward]) => (
                  <div key={position} className="flex justify-between text-sm">
                    <span>{position}</span>
                    <span>+{reward} ELO</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800">
              <strong>Simplified System:</strong> Fixed K-factor of {FIXED_K_FACTOR}, automatic rank promotion when ELO threshold is reached.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};