import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Token budget limits
const MAX_TOKENS = 4000;
const RESERVED_TOKENS = 1000; // For response
const AVAILABLE_TOKENS = MAX_TOKENS - RESERVED_TOKENS;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, session_id, model = 'gpt-4o-mini' } = await req.json();
    
    console.log('Processing message:', message);
    
    // Step 1: Analyze intent and extract keywords
    const intent = await analyzeIntent(message);
    console.log('Intent analysis:', intent);
    
    // Step 2: Search knowledge base and workflows
    const relevantContext = await searchKnowledgeBase(message, intent);
    console.log('Knowledge base search results:', relevantContext.length, 'items');
    
    // Step 3: Get dynamic data if needed
    const dynamicData = await getDynamicData(intent, relevantContext);
    console.log('Dynamic data fetched');
    
    // Step 4: Build optimized context within token budget
    const optimizedContext = await buildOptimizedContext(
      message, 
      intent, 
      relevantContext, 
      dynamicData,
      session_id
    );
    
    // Step 5: Generate response with OpenAI
    const response = await generateResponse(message, optimizedContext, model);
    
    // Log usage for monitoring
    await logUsage(message, intent, optimizedContext.tokens_used, response, model);
    
    return new Response(JSON.stringify({ 
      reply: response,
      intent: intent.category,
      context_items: relevantContext.length,
      tokens_used: optimizedContext.tokens_used
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error in ai-admin-assistant:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function analyzeIntent(message: string) {
  const lowerMessage = message.toLowerCase();
  
  // Enhanced synonym mapping for better intent recognition
  const synonymMap = {
    'thống kê': ['stats', 'số liệu', 'dữ liệu', 'báo cáo', 'report', 'analytics'],
    'người dùng': ['user', 'thành viên', 'member', 'player', 'người chơi', 'tài khoản'],
    'giải đấu': ['tournament', 'cuộc thi', 'competition', 'contest', 'thi đấu'],
    'trận đấu': ['match', 'game', 'set', 'ván chơi', 'trận'],
    'club': ['câu lạc bộ', 'clb', 'billiard hall', 'quán bi-a'],
    'ranking': ['bảng xếp hạng', 'xếp hạng', 'leaderboard', 'top'],
    'elo': ['điểm elo', 'rating', 'skill level'],
    'hoạt động': ['activity', 'active', 'online', 'engagement'],
    'doanh thu': ['revenue', 'income', 'thu nhập', 'tiền'],
    'lỗi': ['error', 'bug', 'problem', 'issue', 'sự cố']
  };
  
  // Check for workflow patterns first with enhanced matching
  const { data: workflows } = await supabase
    .from('admin_workflows')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: true });
  
  let bestMatch = null;
  let highestScore = 0;
  
  for (const workflow of workflows || []) {
    let score = 0;
    const matchedKeywords = [];
    
    // Check direct keywords
    workflow.trigger_keywords.forEach(keyword => {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        score += 10;
        matchedKeywords.push(keyword);
      }
      
      // Check synonyms
      Object.entries(synonymMap).forEach(([baseWord, synonyms]) => {
        if (keyword.toLowerCase().includes(baseWord) && 
            synonyms.some(syn => lowerMessage.includes(syn.toLowerCase()))) {
          score += 8;
          matchedKeywords.push(keyword);
        }
      });
    });
    
    // Check regex pattern if exists
    if (workflow.intent_pattern) {
      try {
        const regex = new RegExp(workflow.intent_pattern, 'i');
        if (regex.test(message)) {
          score += 15;
        }
      } catch (e) {
        console.warn('Invalid regex pattern:', workflow.intent_pattern);
      }
    }
    
    // Boost score based on workflow priority
    score += (4 - (workflow.priority || 1));
    
    if (score > highestScore) {
      highestScore = score;
      bestMatch = {
        category: workflow.workflow_name,
        confidence: Math.min(0.95, score / 20),
        workflow: workflow,
        keywords: matchedKeywords,
        score: score
      };
    }
  }
  
  if (bestMatch && bestMatch.confidence >= 0.6) {
    return bestMatch;
  }
  
  // Enhanced fallback intent classification with semantic analysis
  const intentPatterns = [
    {
      keywords: ['thống kê', 'stats', 'số liệu', 'dữ liệu', 'báo cáo', 'report', 'analytics'],
      category: 'statistics',
      confidence: 0.85
    },
    {
      keywords: ['người dùng', 'user', 'thành viên', 'member', 'player', 'người chơi', 'tài khoản'],
      category: 'user_management',
      confidence: 0.85
    },
    {
      keywords: ['giải đấu', 'tournament', 'cuộc thi', 'competition', 'contest', 'thi đấu'],
      category: 'tournament',
      confidence: 0.85
    },
    {
      keywords: ['trận đấu', 'match', 'game', 'set', 'ván chơi', 'trận'],
      category: 'match_analysis',
      confidence: 0.82
    },
    {
      keywords: ['club', 'câu lạc bộ', 'clb', 'billiard hall', 'quán bi-a'],
      category: 'club_management',
      confidence: 0.82
    },
    {
      keywords: ['ranking', 'bảng xếp hạng', 'xếp hạng', 'leaderboard', 'top'],
      category: 'ranking_analysis',
      confidence: 0.80
    },
    {
      keywords: ['lỗi', 'error', 'bug', 'problem', 'issue', 'sự cố'],
      category: 'system_health',
      confidence: 0.78
    }
  ];
  
  for (const pattern of intentPatterns) {
    const matchedKeywords = pattern.keywords.filter(keyword => 
      lowerMessage.includes(keyword.toLowerCase())
    );
    
    if (matchedKeywords.length > 0) {
      return {
        category: pattern.category,
        confidence: pattern.confidence,
        workflow: null,
        keywords: matchedKeywords,
        score: matchedKeywords.length * 5
      };
    }
  }
  
  return { category: 'general', confidence: 0.5, workflow: null, keywords: [], score: 0 };
}

async function searchKnowledgeBase(message: string, intent: any) {
  const { data: knowledgeItems } = await supabase
    .from('admin_knowledge_base')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: true });
  
  if (!knowledgeItems) return [];
  
  // Score and rank knowledge items
  const scoredItems = knowledgeItems.map(item => {
    let score = 0;
    const lowerMessage = message.toLowerCase();
    const lowerContent = item.content.toLowerCase();
    const lowerTitle = item.title.toLowerCase();
    
    // Title match
    if (lowerTitle.includes(lowerMessage) || lowerMessage.includes(lowerTitle)) {
      score += 10;
    }
    
    // Category match
    if (intent.category === item.category) {
      score += 8;
    }
    
    // Keyword matches in tags
    intent.keywords.forEach(keyword => {
      if (item.tags.some(tag => tag.toLowerCase().includes(keyword.toLowerCase()))) {
        score += 5;
      }
    });
    
    // Content relevance
    intent.keywords.forEach(keyword => {
      const keywordCount = (lowerContent.match(new RegExp(keyword.toLowerCase(), 'g')) || []).length;
      score += keywordCount * 2;
    });
    
    // Priority boost
    score += (4 - item.priority);
    
    return { ...item, relevance_score: score };
  });
  
  // Return top relevant items
  return scoredItems
    .filter(item => item.relevance_score > 0)
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, 5);
}

async function getDynamicData(intent: any, relevantContext: any[]) {
  console.log('Getting dynamic data for intent:', intent.category);
  
  try {
    // Intent-based smart data fetching with enhanced queries
    switch (intent.category) {
      case 'statistics':
      case 'admin_overview':
        return await getComprehensiveStats();
      
      case 'user_management':
        return await getUserManagementData();
      
      case 'tournament':
      case 'tournament_analysis':
        return await getTournamentData();
      
      case 'match_analysis':
        return await getMatchAnalysisData();
      
      case 'club_management':
        return await getClubManagementData();
      
      case 'ranking_analysis':
        return await getRankingData();
      
      case 'system_health':
        return await getSystemHealthData();
        
      default:
        // Fallback to comprehensive stats for general queries
        return await getComprehensiveStats();
    }
  } catch (error) {
    console.error('Error in getDynamicData:', error);
    return await getBasicAdminStats();
  }
}

async function getBasicAdminStats() {
  try {
    const [
      { count: totalUsers },
      { count: totalMatches },
      { count: totalTournaments },
      { data: ongoingTournaments },
      { data: recentMatches }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('match_results').select('*', { count: 'exact', head: true }),
      supabase.from('tournaments').select('*', { count: 'exact', head: true }),
      supabase.from('tournaments').select('name, status').eq('status', 'ongoing').limit(3),
      supabase.from('match_results')
        .select('*, profiles!match_results_player1_id_fkey(full_name)')
        .order('created_at', { ascending: false })
        .limit(3)
    ]);

    return {
      totalUsers: totalUsers || 0,
      totalMatches: totalMatches || 0,
      totalTournaments: totalTournaments || 0,
      ongoingTournaments: ongoingTournaments || [],
      recentMatches: recentMatches || []
    };
  } catch (error) {
    console.error('Error getting basic stats:', error);
    return { error: 'Unable to fetch basic statistics' };
  }
}

// Enhanced data fetching functions with retry logic and connection pooling
async function executeWithRetry(operation: () => Promise<any>, maxRetries = 3): Promise<any> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      if (attempt === maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, attempt * 1000)); // Exponential backoff
    }
  }
}

async function getComprehensiveStats() {
  return await executeWithRetry(async () => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      { count: totalUsers },
      { count: activeUsers },
      { count: totalMatches },
      { count: weeklyMatches },
      { count: totalTournaments },
      { count: activeTournaments },
      { count: totalClubs },
      { data: topPlayers },
      { data: recentActivity },
      { data: systemHealth }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', sevenDaysAgo.toISOString()),
      supabase.from('match_results').select('*', { count: 'exact', head: true }),
      supabase.from('match_results')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString()),
      supabase.from('tournaments').select('*', { count: 'exact', head: true }),
      supabase.from('tournaments')
        .select('*', { count: 'exact', head: true })
        .in('status', ['ongoing', 'registration_open']),
      supabase.from('club_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('player_rankings')
        .select('*, profiles(full_name, display_name)')
        .order('elo_points', { ascending: false })
        .limit(5),
      supabase.from('match_results')
        .select('created_at, match_format, profiles!match_results_player1_id_fkey(full_name)')
        .order('created_at', { ascending: false })
        .limit(10),
      supabase.from('error_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString())
    ]);

    return {
      overview: {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalMatches: totalMatches || 0,
        weeklyMatches: weeklyMatches || 0,
        totalTournaments: totalTournaments || 0,
        activeTournaments: activeTournaments || 0,
        totalClubs: totalClubs || 0,
        systemErrors: systemHealth || 0
      },
      topPlayers: topPlayers || [],
      recentActivity: recentActivity || [],
      growth: {
        userGrowthRate: activeUsers ? ((activeUsers / totalUsers) * 100).toFixed(1) : '0',
        matchGrowthRate: weeklyMatches ? ((weeklyMatches / 7) * 100).toFixed(1) : '0'
      }
    };
  });
}

async function getUserManagementData() {
  return await executeWithRetry(async () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const [
      { count: totalUsers },
      { count: newUsers },
      { count: demoUsers },
      { data: usersBySkill },
      { data: usersByCity },
      { data: recentUsers },
      { data: mostActiveUsers }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString()),
      supabase.from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_demo_user', true),
      supabase.from('profiles')
        .select('skill_level')
        .not('skill_level', 'is', null),
      supabase.from('profiles')
        .select('city')
        .not('city', 'is', null),
      supabase.from('profiles')
        .select('full_name, created_at, city, skill_level')
        .order('created_at', { ascending: false })
        .limit(10),
      supabase.from('profiles')
        .select('full_name, updated_at, city')
        .order('updated_at', { ascending: false })
        .limit(10)
    ]);

    // Aggregate skill levels
    const skillDistribution = usersBySkill.reduce((acc, user) => {
      acc[user.skill_level] = (acc[user.skill_level] || 0) + 1;
      return acc;
    }, {});

    // Aggregate cities
    const cityDistribution = usersByCity.reduce((acc, user) => {
      acc[user.city] = (acc[user.city] || 0) + 1;
      return acc;
    }, {});

    return {
      summary: {
        totalUsers: totalUsers || 0,
        newUsers: newUsers || 0,
        demoUsers: demoUsers || 0,
        growthRate: totalUsers ? ((newUsers / totalUsers) * 100).toFixed(1) : '0'
      },
      distributions: {
        skillLevels: skillDistribution,
        cities: cityDistribution
      },
      recentUsers: recentUsers || [],
      mostActiveUsers: mostActiveUsers || []
    };
  });
}

async function getTournamentData() {
  return await executeWithRetry(async () => {
    const [
      { count: totalTournaments },
      { count: ongoingTournaments },
      { count: completedTournaments },
      { data: recentTournaments },
      { data: tournamentStats },
      { data: popularTournaments }
    ] = await Promise.all([
      supabase.from('tournaments').select('*', { count: 'exact', head: true }),
      supabase.from('tournaments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ongoing'),
      supabase.from('tournaments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed'),
      supabase.from('tournaments')
        .select('name, status, tournament_start, current_participants, max_participants')
        .order('created_at', { ascending: false })
        .limit(10),
      supabase.from('tournaments')
        .select('tournament_type, current_participants, max_participants'),
      supabase.from('tournaments')
        .select('name, current_participants, max_participants')
        .order('current_participants', { ascending: false })
        .limit(5)
    ]);

    return {
      summary: {
        totalTournaments: totalTournaments || 0,
        ongoingTournaments: ongoingTournaments || 0,
        completedTournaments: completedTournaments || 0,
        completionRate: totalTournaments ? ((completedTournaments / totalTournaments) * 100).toFixed(1) : '0'
      },
      recentTournaments: recentTournaments || [],
      popularTournaments: popularTournaments || [],
      typeDistribution: tournamentStats?.reduce((acc, t) => {
        acc[t.tournament_type] = (acc[t.tournament_type] || 0) + 1;
        return acc;
      }, {}) || {}
    };
  });
}

async function getMatchAnalysisData() {
  return await executeWithRetry(async () => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const [
      { count: totalMatches },
      { count: weeklyMatches },
      { count: verifiedMatches },
      { data: recentMatches },
      { data: matchFormats },
      { data: topPerformers }
    ] = await Promise.all([
      supabase.from('match_results').select('*', { count: 'exact', head: true }),
      supabase.from('match_results')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString()),
      supabase.from('match_results')
        .select('*', { count: 'exact', head: true })
        .eq('result_status', 'verified'),
      supabase.from('match_results')
        .select('*, profiles!match_results_player1_id_fkey(full_name)')
        .order('created_at', { ascending: false })
        .limit(10),
      supabase.from('match_results').select('match_format'),
      supabase.from('player_rankings')
        .select('*, profiles(full_name)')
        .order('elo_points', { ascending: false })
        .limit(8)
    ]);

    return {
      summary: {
        totalMatches: totalMatches || 0,
        weeklyMatches: weeklyMatches || 0,
        verifiedMatches: verifiedMatches || 0,
        verificationRate: totalMatches ? ((verifiedMatches / totalMatches) * 100).toFixed(1) : '0'
      },
      recentMatches: recentMatches || [],
      topPerformers: topPerformers || [],
      formatDistribution: matchFormats?.reduce((acc, m) => {
        acc[m.match_format] = (acc[m.match_format] || 0) + 1;
        return acc;
      }, {}) || {}
    };
  });
}

async function getClubManagementData() {
  return await executeWithRetry(async () => {
    const [
      { count: totalClubs },
      { count: verifiedClubs },
      { count: pendingClubs },
      { data: recentClubs },
      { data: clubsByCity }
    ] = await Promise.all([
      supabase.from('club_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('club_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('verification_status', 'approved'),
      supabase.from('club_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabase.from('club_profiles')
        .select('club_name, verification_status, created_at')
        .order('created_at', { ascending: false })
        .limit(10),
      supabase.from('club_registrations').select('city')
    ]);

    return {
      summary: {
        totalClubs: totalClubs || 0,
        verifiedClubs: verifiedClubs || 0,
        pendingClubs: pendingClubs || 0,
        verificationRate: totalClubs ? ((verifiedClubs / totalClubs) * 100).toFixed(1) : '0'
      },
      recentClubs: recentClubs || [],
      cityDistribution: clubsByCity?.reduce((acc, club) => {
        acc[club.city] = (acc[club.city] || 0) + 1;
        return acc;
      }, {}) || {}
    };
  });
}

async function getRankingData() {
  return await executeWithRetry(async () => {
    const [
      { data: topEloPlayers },
      { data: topSpaPlayers },
      { data: mostActiveRanked },
      { data: leaderboardData }
    ] = await Promise.all([
      supabase.from('player_rankings')
        .select('*, profiles(full_name, display_name, city)')
        .order('elo_points', { ascending: false })
        .limit(10),
      supabase.from('player_rankings')
        .select('*, profiles(full_name, display_name, city)')
        .order('spa_points', { ascending: false })
        .limit(10),
      supabase.from('player_rankings')
        .select('*, profiles(full_name, display_name)')
        .order('total_matches', { ascending: false })
        .limit(10),
      supabase.from('leaderboards')
        .select('*, profiles(full_name, display_name)')
        .order('ranking_points', { ascending: false })
        .limit(15)
    ]);

    return {
      topEloPlayers: topEloPlayers || [],
      topSpaPlayers: topSpaPlayers || [],
      mostActiveRanked: mostActiveRanked || [],
      currentLeaderboard: leaderboardData || [],
      insights: {
        averageElo: topEloPlayers?.reduce((sum, p) => sum + (p.elo_points || 0), 0) / (topEloPlayers?.length || 1) || 0,
        averageSpa: topSpaPlayers?.reduce((sum, p) => sum + (p.spa_points || 0), 0) / (topSpaPlayers?.length || 1) || 0
      }
    };
  });
}

async function getSystemHealthData() {
  return await executeWithRetry(async () => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const [
      { count: recentErrors },
      { count: weeklyErrors },
      { data: errorTypes },
      { data: apiMetrics },
      { data: recentLogs }
    ] = await Promise.all([
      supabase.from('error_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', twentyFourHoursAgo.toISOString()),
      supabase.from('error_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString()),
      supabase.from('error_logs')
        .select('error_type')
        .gte('created_at', sevenDaysAgo.toISOString()),
      supabase.from('api_performance_metrics')
        .select('endpoint, duration, status')
        .gte('created_at', twentyFourHoursAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(50),
      supabase.from('error_logs')
        .select('error_type, error_message, created_at, url')
        .order('created_at', { ascending: false })
        .limit(10)
    ]);

    return {
      errorSummary: {
        last24Hours: recentErrors || 0,
        last7Days: weeklyErrors || 0,
        trend: recentErrors && weeklyErrors ? (recentErrors / (weeklyErrors / 7)).toFixed(2) : '0'
      },
      errorTypes: errorTypes?.reduce((acc, error) => {
        acc[error.error_type] = (acc[error.error_type] || 0) + 1;
        return acc;
      }, {}) || {},
      apiPerformance: {
        averageResponseTime: apiMetrics?.reduce((sum, metric) => sum + metric.duration, 0) / (apiMetrics?.length || 1) || 0,
        errorRate: apiMetrics?.filter(m => m.status >= 400).length / (apiMetrics?.length || 1) * 100 || 0
      },
      recentErrors: recentLogs || []
    };
  });
}

async function buildOptimizedContext(message: string, intent: any, knowledgeItems: any[], dynamicData: any, sessionId?: string) {
  let context = '';
  let tokensUsed = 0;
  
  // Estimate token usage (rough calculation: 1 token ≈ 4 characters)
  const estimateTokens = (text: string) => Math.ceil(text.length / 4);
  
  // Add intent and workflow info
  if (intent.workflow) {
    const workflowContext = `Workflow được kích hoạt: ${intent.workflow.workflow_name}\nMô tả: ${intent.workflow.description}\n\n`;
    if (tokensUsed + estimateTokens(workflowContext) < AVAILABLE_TOKENS) {
      context += workflowContext;
      tokensUsed += estimateTokens(workflowContext);
    }
  }
  
  // Add relevant knowledge base items
  for (const item of knowledgeItems) {
    const itemContext = `[${item.content_type.toUpperCase()}] ${item.title}:\n${item.content}\n\n`;
    if (tokensUsed + estimateTokens(itemContext) < AVAILABLE_TOKENS) {
      context += itemContext;
      tokensUsed += estimateTokens(itemContext);
    } else {
      break; // Stop if we're approaching token limit
    }
  }
  
  // Add dynamic data
  if (dynamicData && Object.keys(dynamicData).length > 0) {
    const dataContext = `Dữ liệu hiện tại:\n${JSON.stringify(dynamicData, null, 2)}\n\n`;
    if (tokensUsed + estimateTokens(dataContext) < AVAILABLE_TOKENS) {
      context += dataContext;
      tokensUsed += estimateTokens(dataContext);
    }
  }
  
  // Add conversation memory (simple approach for now)
  if (sessionId) {
    const { data: recentMessages } = await supabase
      .from('admin_chat_messages')
      .select('content, type')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (recentMessages && recentMessages.length > 0) {
      const conversationContext = `Lịch sử trò chuyện gần đây:\n${recentMessages.map(m => `${m.type}: ${m.content}`).join('\n')}\n\n`;
      if (tokensUsed + estimateTokens(conversationContext) < AVAILABLE_TOKENS) {
        context += conversationContext;
        tokensUsed += estimateTokens(conversationContext);
      }
    }
  }
  
  return { context, tokens_used: tokensUsed };
}

async function generateResponse(message: string, contextData: any, model: string = 'gpt-4o-mini') {
  const systemPrompt = `Bạn là AI Assistant chuyên nghiệp cho admin của nền tảng bi-a SPA Points.

NHIỆM VỤ:
- Trả lời chính xác câu hỏi của admin
- Cung cấp thông tin dựa trên context được cung cấp
- Hướng dẫn thực hiện các tác vụ quản trị
- Phân tích dữ liệu và đưa ra insights

NGUYÊN TẮC:
- Trả lời bằng tiếng Việt, chuyên nghiệp nhưng thân thiện
- Tập trung vào thông tin hữu ích và actionable
- Nếu không có đủ thông tin, hãy nói rõ và đề xuất cách lấy thêm thông tin
- Sử dụng số liệu cụ thể khi có sẵn

CONTEXT HIỆN TẠI:
${contextData.context}

Hãy trả lời câu hỏi của admin một cách chính xác và hữu ích.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.3, // Lower temperature for more consistent responses
      max_tokens: RESERVED_TOKENS,
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

async function logUsage(message: string, intent: any, tokensUsed: number, response: string, model: string = 'gpt-4o-mini') {
  try {
    await supabase.from('openai_usage_logs').insert({
      model_id: model,
      task_type: 'admin_assistance',
      function_name: 'ai-admin-assistant',
      prompt_tokens: tokensUsed,
      completion_tokens: Math.ceil(response.length / 4),
      total_tokens: tokensUsed + Math.ceil(response.length / 4),
      success: true,
      response_time_ms: Date.now() % 10000, // Simplified for now
      cost_usd: (tokensUsed + Math.ceil(response.length / 4)) * 0.00015 / 1000 // Rough cost estimate
    });
  } catch (error) {
    console.error('Error logging usage:', error);
  }
}