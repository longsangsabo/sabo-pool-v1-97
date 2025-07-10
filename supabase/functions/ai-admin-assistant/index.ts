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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, context } = await req.json();
    
    // Get admin context data
    const adminContext = await getAdminContext();
    
    const systemPrompt = `Bạn là AI Assistant cho admin của nền tảng bi-a SPA Points. 
    
Nhiệm vụ của bạn:
- Trả lời câu hỏi về dữ liệu hệ thống
- Cung cấp insights và phân tích
- Hỗ trợ ra quyết định quản lý
- Giải thích số liệu và xu hướng

Dữ liệu hiện tại:
${JSON.stringify(adminContext, null, 2)}

Hãy trả lời bằng tiếng Việt, ngắn gọn và hữu ích. Nếu được hỏi về dữ liệu cụ thể, hãy tham khảo context above.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    const data = await response.json();
    const reply = data.choices[0].message.content;

    return new Response(JSON.stringify({ reply }), {
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

async function getAdminContext() {
  try {
    // Get key metrics for admin context
    const [
      { data: totalUsers },
      { data: totalMatches },
      { data: totalTournaments },
      { data: recentActivity },
      { data: clubStats }
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('match_results').select('id', { count: 'exact', head: true }),
      supabase.from('tournaments').select('id', { count: 'exact', head: true }),
      supabase.from('match_results')
        .select('*, profiles!match_results_player1_id_fkey(full_name), profiles!match_results_player2_id_fkey(full_name)')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase.from('club_profiles').select('*, club_stats(*)')
    ]);

    return {
      overview: {
        totalUsers: totalUsers?.length || 0,
        totalMatches: totalMatches?.length || 0,
        totalTournaments: totalTournaments?.length || 0,
        totalClubs: clubStats?.length || 0
      },
      recentActivity: recentActivity || [],
      clubs: clubStats || [],
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting admin context:', error);
    return { error: 'Unable to fetch admin context' };
  }
}