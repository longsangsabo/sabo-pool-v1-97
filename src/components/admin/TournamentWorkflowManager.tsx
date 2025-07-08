import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  SkipForward, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Users,
  Trophy,
  Target,
  Settings,
  Eye,
  Zap
} from 'lucide-react';
import { useRealtimeTournamentSync } from '@/hooks/useRealtimeTournamentSync';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import TournamentAutomation from './TournamentAutomation';
import TournamentAnalytics from './TournamentAnalytics';

interface TournamentWorkflow {
  id: string;
  name: string;
  status: 'upcoming' | 'registration_open' | 'registration_closed' | 'ongoing' | 'completed' | 'cancelled';
  current_step: string;
  progress_percentage: number;
  participants_count: number;
  max_participants: number;
  start_date: string;
  end_date: string;
  entry_fee: number;
  prize_pool: number;
  club_name?: string;
  next_action?: string;
  can_advance: boolean;
  issues: string[];
}

const TournamentWorkflowManager: React.FC = () => {
  const [workflows, setWorkflows] = useState<TournamentWorkflow[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const { isConnected, lastUpdate } = useRealtimeTournamentSync(selectedTournament || undefined);

  useEffect(() => {
    fetchTournaments();
  }, [lastUpdate]);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      
      const { data: tournaments, error } = await supabase
        .from('tournaments')
        .select(`
          *,
          clubs(name)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Get registration counts
      const { data: registrations } = await supabase
        .from('tournament_registrations')
        .select('tournament_id, status')
        .in('tournament_id', tournaments?.map(t => t.id) || []);

      const registrationCounts = registrations?.reduce((acc, reg) => {
        if (!acc[reg.tournament_id]) acc[reg.tournament_id] = 0;
        if (reg.status === 'confirmed') acc[reg.tournament_id]++;
        return acc;
      }, {} as Record<string, number>) || {};

      const workflowData: TournamentWorkflow[] = tournaments?.map(tournament => {
        const participantCount = registrationCounts[tournament.id] || 0;
        const progress = getProgressPercentage(tournament.status);
        const issues = getWorkflowIssues(tournament, participantCount);
        
        return {
          id: tournament.id,
          name: tournament.name,
          status: tournament.status as TournamentWorkflow['status'],
          current_step: getCurrentStep(tournament.status),
          progress_percentage: progress,
          participants_count: participantCount,
          max_participants: tournament.max_participants || 0,
          start_date: tournament.start_date,
          end_date: tournament.end_date,
          entry_fee: tournament.entry_fee || 0,
          prize_pool: tournament.prize_pool || 0,
          club_name: tournament.clubs?.name,
          next_action: getNextAction(tournament.status, participantCount, tournament.max_participants),
          can_advance: canAdvanceWorkflow(tournament.status, participantCount),
          issues
        };
      }) || [];

      setWorkflows(workflowData);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      toast.error('Lỗi khi tải dữ liệu giải đấu');
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = (status: string): number => {
    switch (status) {
      case 'upcoming': return 10;
      case 'registration_open': return 30;
      case 'registration_closed': return 50;
      case 'ongoing': return 75;
      case 'completed': return 100;
      case 'cancelled': return 0;
      default: return 0;
    }
  };

  const getCurrentStep = (status: string): string => {
    switch (status) {
      case 'upcoming': return 'Waiting for Registration';
      case 'registration_open': return 'Registration Phase';
      case 'registration_closed': return 'Bracket Generation';
      case 'ongoing': return 'Tournament in Progress';
      case 'completed': return 'Tournament Completed';
      case 'cancelled': return 'Tournament Cancelled';
      default: return 'Unknown';
    }
  };

  const getNextAction = (status: string, participants: number, maxParticipants: number): string => {
    switch (status) {
      case 'upcoming': return 'Open Registration';
      case 'registration_open': 
        return participants >= 4 ? 'Close Registration & Generate Bracket' : `Wait for ${4 - participants} more participants`;
      case 'registration_closed': return 'Start Tournament';
      case 'ongoing': return 'Monitor Progress';
      case 'completed': return 'Review Results';
      case 'cancelled': return 'Archive Tournament';
      default: return 'Review Status';
    }
  };

  const canAdvanceWorkflow = (status: string, participants: number): boolean => {
    switch (status) {
      case 'upcoming': return true;
      case 'registration_open': return participants >= 4;
      case 'registration_closed': return participants >= 4;
      case 'ongoing': return false; // Let tournament run naturally
      default: return false;
    }
  };

  const getWorkflowIssues = (tournament: any, participants: number): string[] => {
    const issues: string[] = [];
    
    if (tournament.status === 'registration_open') {
      if (participants < 4) {
        issues.push(`Need ${4 - participants} more participants to start`);
      }
      if (new Date(tournament.registration_deadline) < new Date()) {
        issues.push('Registration deadline has passed');
      }
    }
    
    if (tournament.status === 'registration_closed' && participants < 4) {
      issues.push('Insufficient participants - consider cancelling');
    }
    
    if (tournament.status === 'ongoing') {
      // Check for stalled matches
      issues.push('Monitor for stalled matches');
    }
    
    return issues;
  };

  const advanceWorkflow = async (tournamentId: string) => {
    try {
      setActionLoading(tournamentId);
      
      const tournament = workflows.find(w => w.id === tournamentId);
      if (!tournament) return;

      let newStatus = tournament.status;
      let actionTaken = '';

      switch (tournament.status) {
        case 'upcoming':
          newStatus = 'registration_open';
          actionTaken = 'Registration opened';
          break;
        case 'registration_open':
          if (tournament.participants_count >= 4) {
            newStatus = 'registration_closed';
            actionTaken = 'Registration closed, generating bracket';
            
            // Generate bracket
            const { data, error } = await supabase.functions.invoke('auto-bracket-generation', {
              body: { tournament_id: tournamentId }
            });
            
            if (error) throw error;
          }
          break;
        case 'registration_closed':
          newStatus = 'ongoing';
          actionTaken = 'Tournament started';
          break;
      }

      if (newStatus !== tournament.status) {
        const { error } = await supabase
          .from('tournaments')
          .update({ 
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', tournamentId);

        if (error) throw error;

        toast.success(actionTaken);
        fetchTournaments(); // Refresh data
      }
    } catch (error) {
      console.error('Error advancing workflow:', error);
      toast.error('Lỗi khi thực hiện action');
    } finally {
      setActionLoading(null);
    }
  };

  const cancelTournament = async (tournamentId: string) => {
    try {
      setActionLoading(tournamentId);
      
      const { error } = await supabase
        .from('tournaments')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', tournamentId);

      if (error) throw error;

      toast.success('Tournament cancelled');
      fetchTournaments();
    } catch (error) {
      console.error('Error cancelling tournament:', error);
      toast.error('Lỗi khi hủy giải đấu');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'upcoming': return 'bg-blue-500';
      case 'registration_open': return 'bg-green-500';
      case 'registration_closed': return 'bg-yellow-500';
      case 'ongoing': return 'bg-purple-500';
      case 'completed': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="workflows" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="workflows">Tournament Workflows</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Tournament Workflows</h2>
              <p className="text-muted-foreground">Manage and monitor tournament progression</p>
            </div>
            <Button onClick={fetchTournaments} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          <div className="grid gap-4">
            {workflows.map((workflow) => (
              <Card key={workflow.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{workflow.name}</h3>
                        <Badge className={getStatusColor(workflow.status)}>
                          {workflow.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        {workflow.issues.length > 0 && (
                          <Badge variant="destructive">
                            {workflow.issues.length} Issues
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {workflow.participants_count}/{workflow.max_participants} players
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            Prize: {workflow.prize_pool.toLocaleString('vi-VN')} VND
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Fee: {workflow.entry_fee.toLocaleString('vi-VN')} VND</span>
                        </div>
                        {workflow.club_name && (
                          <div className="text-sm text-muted-foreground">
                            at {workflow.club_name}
                          </div>
                        )}
                      </div>

                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span>Current Step: {workflow.current_step}</span>
                          <span>{workflow.progress_percentage}%</span>
                        </div>
                        <Progress value={workflow.progress_percentage} className="h-2" />
                      </div>

                      {workflow.issues.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-destructive mb-2">Issues:</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {workflow.issues.map((issue, index) => (
                              <li key={index} className="flex items-center gap-2">
                                <AlertCircle className="h-3 w-3 text-destructive" />
                                {issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <p className="text-sm text-muted-foreground">
                        Next: {workflow.next_action}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTournament(workflow.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {workflow.can_advance && (
                        <Button
                          size="sm"
                          onClick={() => advanceWorkflow(workflow.id)}
                          disabled={actionLoading === workflow.id}
                        >
                          {actionLoading === workflow.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <SkipForward className="h-4 w-4 mr-1" />
                          )}
                          Advance
                        </Button>
                      )}
                      
                      {['upcoming', 'registration_open', 'registration_closed'].includes(workflow.status) && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => cancelTournament(workflow.id)}
                          disabled={actionLoading === workflow.id}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {workflows.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No tournaments found</h3>
                <p className="text-muted-foreground">Create your first tournament to get started</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="automation">
          <TournamentAutomation />
        </TabsContent>

        <TabsContent value="analytics">
          <TournamentAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TournamentWorkflowManager;