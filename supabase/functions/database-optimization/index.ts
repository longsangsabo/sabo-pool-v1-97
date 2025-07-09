import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { action, params } = await req.json()

    let result;

    switch (action) {
      case 'cleanup_old_data':
        // Run the cleanup function
        const { error: cleanupError } = await supabaseClient.rpc('cleanup_old_data');
        if (cleanupError) throw cleanupError;
        
        result = {
          success: true,
          message: 'Old data cleanup completed successfully',
          timestamp: new Date().toISOString()
        };
        break;

      case 'refresh_materialized_view':
        // Refresh the materialized view
        const { error: refreshError } = await supabaseClient.rpc('refresh_leaderboard_stats');
        if (refreshError) throw refreshError;
        
        result = {
          success: true,
          message: 'Materialized view refreshed successfully',
          timestamp: new Date().toISOString()
        };
        break;

      case 'analyze_tables':
        // Run ANALYZE on key tables for query optimization
        const tables = ['leaderboards', 'profiles', 'player_rankings', 'matches', 'tournaments'];
        
        for (const table of tables) {
          const { error } = await supabaseClient.rpc('execute_sql', { 
            sql: `ANALYZE ${table};` 
          });
          if (error) console.error(`Failed to analyze table ${table}:`, error);
        }
        
        result = {
          success: true,
          message: 'Table analysis completed',
          analyzed_tables: tables,
          timestamp: new Date().toISOString()
        };
        break;

      case 'get_database_stats':
        // Get database performance statistics
        const { data: dbStats, error: statsError } = await supabaseClient
          .from('pg_stat_database')
          .select('*')
          .eq('datname', 'postgres')
          .single();

        if (statsError) throw statsError;

        // Get table sizes
        const { data: tableSizes, error: sizeError } = await supabaseClient.rpc('get_table_sizes');
        if (sizeError) throw sizeError;

        result = {
          success: true,
          database_stats: dbStats,
          table_sizes: tableSizes,
          timestamp: new Date().toISOString()
        };
        break;

      case 'optimize_queries':
        // Get slow query recommendations
        const optimizationTips = [
          {
            table: 'leaderboards',
            recommendation: 'Ensure ranking_points index is used for sorting',
            impact: 'high'
          },
          {
            table: 'profiles', 
            recommendation: 'Use GIN indexes for full-text search on names',
            impact: 'medium'
          },
          {
            table: 'matches',
            recommendation: 'Composite index on (player1_id, player2_id, created_at)',
            impact: 'high'
          }
        ];

        result = {
          success: true,
          optimization_tips: optimizationTips,
          timestamp: new Date().toISOString()
        };
        break;

      case 'monitor_performance':
        // Monitor current database performance
        const { data: activeQueries, error: queryError } = await supabaseClient
          .from('pg_stat_activity')
          .select('*')
          .neq('state', 'idle')
          .limit(10);

        if (queryError) throw queryError;

        // Get cache hit ratio
        const { data: cacheStats, error: cacheError } = await supabaseClient.rpc('get_cache_hit_ratio');
        if (cacheError) throw cacheError;

        result = {
          success: true,
          active_queries: activeQueries?.length || 0,
          cache_hit_ratio: cacheStats,
          recommendations: activeQueries?.length > 5 ? ['Consider query optimization'] : ['Performance looks good'],
          timestamp: new Date().toISOString()
        };
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Database optimization error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})