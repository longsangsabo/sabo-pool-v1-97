import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Create admin client for internal operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface AdminMessage {
  sessionId: string;
  message: string;
  adminId: string;
}

// Advanced knowledge base fetcher with admin privileges
async function getAdvancedKnowledgeBase(intent: string, message: string): Promise<string> {
  try {
    // Fetch from both admin and user knowledge bases
    const { data: adminKnowledge } = await supabase
      .from('admin_knowledge_base')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: true });

    const { data: userKnowledge } = await supabase
      .from('user_knowledge_base')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: true });

    const allKnowledge = [...(adminKnowledge || []), ...(userKnowledge || [])];

    if (allKnowledge.length === 0) {
      return getDefaultAdminKnowledgeBase();
    }

    // Score and filter relevant knowledge items
    const relevantItems = allKnowledge
      .map(item => {
        let score = 0;
        const lowerMessage = message.toLowerCase();
        const lowerContent = item.content.toLowerCase();
        const lowerTitle = item.title.toLowerCase();

        // Direct title/content match
        if (lowerTitle.includes(lowerMessage) || lowerMessage.includes(lowerTitle)) {
          score += 10;
        }

        // Tag matches
        if (item.tags) {
          item.tags.forEach((tag: string) => {
            if (lowerMessage.includes(tag.toLowerCase())) {
              score += 5;
            }
          });
        }

        // Intent-based matching
        if (intent === 'admin_functions' && lowerContent.includes('admin')) {
          score += 8;
        }
        if (intent === 'database_queries' && (lowerContent.includes('database') || lowerContent.includes('query'))) {
          score += 8;
        }
        if (intent === 'system_management' && lowerContent.includes('system')) {
          score += 8;
        }

        return { ...item, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8); // Top 8 most relevant for admin

    if (relevantItems.length === 0) {
      return getDefaultAdminKnowledgeBase();
    }

    // Build dynamic admin knowledge base
    let knowledgeBase = `# SABO Pool Arena - Admin Knowledge Base\n\n`;
    
    relevantItems.forEach(item => {
      knowledgeBase += `## ${item.title}\n${item.content}\n\n`;
    });

    return knowledgeBase;
  } catch (error) {
    console.error('Error fetching admin knowledge base:', error);
    return getDefaultAdminKnowledgeBase();
  }
}

// Fallback admin knowledge base
function getDefaultAdminKnowledgeBase(): string {
  return `
# SABO Pool Arena - Admin Control Panel

## Admin Functions
- User management: Create, edit, disable user accounts
- Tournament administration: Create tournaments, manage brackets, approve results
- Club management: Approve/reject club registrations, manage club profiles
- System monitoring: View logs, performance metrics, error tracking
- Content moderation: Review user posts, manage reports

## Database Operations
- Direct database queries through admin panel
- User data export and import
- Backup and restore operations
- Performance optimization and indexing

## System Configuration
- AI model management and configuration
- Feature toggles and system settings
- Notification templates and workflows
- Payment processing and financial reports

## Security & Compliance
- Access control and permission management
- Audit trails and activity logs
- Data privacy and GDPR compliance
- Security incident response procedures
`;
}

async function analyzeAdminIntent(message: string): Promise<{
  intent: string;
  confidence: number;
  needsData: boolean;
}> {
  const lowerMessage = message.toLowerCase();
  
  // Advanced intent matching for admin tasks
  if (lowerMessage.includes('user') || lowerMessage.includes('account') || lowerMessage.includes('profile')) {
    return { intent: 'user_management', confidence: 0.9, needsData: true };
  }
  
  if (lowerMessage.includes('tournament') || lowerMessage.includes('competition') || lowerMessage.includes('bracket')) {
    return { intent: 'tournament_management', confidence: 0.9, needsData: true };
  }
  
  if (lowerMessage.includes('club') || lowerMessage.includes('venue') || lowerMessage.includes('registration')) {
    return { intent: 'club_management', confidence: 0.9, needsData: true };
  }
  
  if (lowerMessage.includes('database') || lowerMessage.includes('query') || lowerMessage.includes('sql')) {
    return { intent: 'database_queries', confidence: 0.9, needsData: true };
  }
  
  if (lowerMessage.includes('system') || lowerMessage.includes('config') || lowerMessage.includes('setting')) {
    return { intent: 'system_management', confidence: 0.9, needsData: false };
  }
  
  if (lowerMessage.includes('admin') || lowerMessage.includes('management') || lowerMessage.includes('control')) {
    return { intent: 'admin_functions', confidence: 0.8, needsData: false };
  }
  
  return { intent: 'general_admin', confidence: 0.6, needsData: false };
}

async function generateAdminAIResponse(adminMessage: string, intent: string): Promise<string> {
  try {
    // Get advanced knowledge base
    const advancedKnowledgeBase = await getAdvancedKnowledgeBase(intent, adminMessage);
    
    const systemPrompt = `Bạn là AI assistant chuyên dụng cho Admin của SABO Pool Arena - nền tảng billiards hàng đầu Việt Nam.

QUYỀN HẠN VÀ NHIỆM VỤ:
- Hỗ trợ các tác vụ quản trị cao cấp và phức tạp
- Truy cập toàn bộ cơ sở dữ liệu và thông tin hệ thống
- Phân tích dữ liệu và đưa ra insights quản lý
- Hướng dẫn sử dụng các tính năng admin chuyên sâu
- Giải quyết vấn đề kỹ thuật và vận hành

KNOWLEDGE BASE ADMIN (Cập nhật tự động):
${advancedKnowledgeBase}

HƯỚNG DẪN TRẢ LỜI ADMIN:
- Sử dụng ngôn ngữ chuyên nghiệp, chi tiết
- Đưa ra các bước thực hiện cụ thể
- Phân tích dữ liệu và xu hướng khi có thể
- Cảnh báo về rủi ro và best practices
- Intent hiện tại: ${intent}

KHẢ NĂNG ĐẶC BIỆT:
- Truy vấn database trực tiếp
- Phân tích performance và logs
- Quản lý user và permissions
- Cấu hình hệ thống nâng cao
- Monitoring và alerting

VÍ DỤ PHẢN HỒI ADMIN:
- "Để quản lý tournament, bạn có thể..."
- "Dựa trên dữ liệu hiện tại, tôi thấy..."
- "Để tối ưu hóa performance, khuyến nghị..."
- "Cảnh báo: Thao tác này có thể ảnh hưởng đến..."
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-nano',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: adminMessage }
        ],
        max_tokens: 600, // Tăng cho admin responses
        temperature: 0.2, // Ít creative hơn, chính xác hơn
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API error:', error);
    return 'Xin lỗi, AI assistant admin gặp sự cố kỹ thuật. Vui lòng kiểm tra logs hoặc liên hệ technical support.';
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, message, adminId }: AdminMessage = await req.json();

    if (!sessionId || !message || !adminId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing admin message:', { sessionId, adminId, messageLength: message.length });

    const startTime = Date.now();

    // Analyze admin intent
    const intentAnalysis = await analyzeAdminIntent(message);
    console.log('Admin intent analysis:', intentAnalysis);

    // Log admin message to AI usage statistics
    await supabase
      .from('ai_usage_statistics')
      .insert({
        user_id: adminId,
        session_id: sessionId,
        model_name: 'gpt-4.1-nano',
        assistant_type: 'admin',
        message_type: 'user',
        intent: intentAnalysis.intent,
        tokens_used: Math.ceil(message.length / 4), // Rough token estimate
        success: true,
        created_at: new Date().toISOString()
      });

    // Save admin message
    const { error: adminMsgError } = await supabase
      .from('admin_chat_messages')
      .insert({
        session_id: sessionId,
        content: message,
        type: 'user',
        metadata: { intent: intentAnalysis }
      });

    if (adminMsgError) {
      console.error('Error saving admin message:', adminMsgError);
      return new Response(
        JSON.stringify({ error: 'Failed to save message' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate AI response for admin
    const aiResponse = await generateAdminAIResponse(message, intentAnalysis.intent);
    console.log('Admin AI response generated:', { length: aiResponse.length });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Log AI response to AI usage statistics
    await supabase
      .from('ai_usage_statistics')
      .insert({
        user_id: adminId,
        session_id: sessionId,
        model_name: 'gpt-4.1-nano',
        assistant_type: 'admin',
        message_type: 'assistant',
        intent: intentAnalysis.intent,
        tokens_used: Math.ceil(aiResponse.length / 4), // Rough token estimate
        response_time_ms: responseTime,
        success: true,
        created_at: new Date().toISOString()
      });

    // Save AI response
    const { error: aiMsgError } = await supabase
      .from('admin_chat_messages')
      .insert({
        session_id: sessionId,
        content: aiResponse,
        type: 'assistant',
        metadata: { 
          intent: intentAnalysis.intent,
          model: 'gpt-4.1-nano',
          confidence: intentAnalysis.confidence,
          response_time_ms: responseTime
        }
      });

    if (aiMsgError) {
      console.error('Error saving admin AI message:', aiMsgError);
      return new Response(
        JSON.stringify({ error: 'Failed to save AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        intent: intentAnalysis.intent,
        confidence: intentAnalysis.confidence
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-admin-assistant:', error);
    
    // Log error to AI usage statistics
    await supabase
      .from('ai_usage_statistics')
      .insert({
        session_id: 'unknown',
        model_name: 'gpt-4.1-nano',
        assistant_type: 'admin',
        message_type: 'assistant',
        success: false,
        error_message: error.message,
        created_at: new Date().toISOString()
      });

    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});