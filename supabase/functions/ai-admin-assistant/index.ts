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
  
  // Check for workflow patterns first
  const { data: workflows } = await supabase
    .from('admin_workflows')
    .select('*')
    .eq('is_active', true);
  
  for (const workflow of workflows || []) {
    // Check keywords
    const hasKeyword = workflow.trigger_keywords.some(keyword => 
      lowerMessage.includes(keyword.toLowerCase())
    );
    
    // Check regex pattern if exists
    let matchesPattern = false;
    if (workflow.intent_pattern) {
      try {
        const regex = new RegExp(workflow.intent_pattern, 'i');
        matchesPattern = regex.test(message);
      } catch (e) {
        console.warn('Invalid regex pattern:', workflow.intent_pattern);
      }
    }
    
    if (hasKeyword || matchesPattern) {
      return {
        category: workflow.workflow_name,
        confidence: hasKeyword && matchesPattern ? 0.9 : 0.7,
        workflow: workflow,
        keywords: workflow.trigger_keywords.filter(k => 
          lowerMessage.includes(k.toLowerCase())
        )
      };
    }
  }
  
  // Fallback intent classification
  if (lowerMessage.includes('thống kê') || lowerMessage.includes('stats')) {
    return { category: 'statistics', confidence: 0.8, workflow: null, keywords: ['thống kê'] };
  }
  if (lowerMessage.includes('người dùng') || lowerMessage.includes('user')) {
    return { category: 'user_management', confidence: 0.8, workflow: null, keywords: ['người dùng'] };
  }
  if (lowerMessage.includes('giải đấu') || lowerMessage.includes('tournament')) {
    return { category: 'tournament', confidence: 0.8, workflow: null, keywords: ['giải đấu'] };
  }
  
  return { category: 'general', confidence: 0.5, workflow: null, keywords: [] };
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
  // Always use the safe admin stats function instead of dynamic SQL
  try {
    const { data: adminStats, error } = await supabase.rpc('get_admin_stats_safely');
    if (error) {
      console.error('Error getting admin stats:', error);
      return await getBasicAdminStats();
    }
    return adminStats || await getBasicAdminStats();
  } catch (error) {
    console.error('Error executing safe admin stats:', error);
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