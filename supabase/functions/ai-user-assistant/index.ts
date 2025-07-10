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

interface UserMessage {
  sessionId: string;
  message: string;
  userId: string;
}

// Simple FAQ knowledge base for users
const faqKnowledge = `
# ViePool FAQ & Information

## Đăng ký giải đấu
- Để đăng ký giải đấu, vào trang Tournaments và chọn giải muốn tham gia
- Cần có tài khoản đã xác minh và đủ điều kiện ELO
- Phí đăng ký sẽ được hiển thị trước khi xác nhận

## Hệ thống ELO
- ELO bắt đầu từ 1000 điểm
- Thắng sẽ tăng ELO, thua sẽ giảm ELO
- K-factor phụ thuộc vào số trận đã chơi và mức ELO hiện tại

## Membership
- Basic: Miễn phí, chức năng cơ bản
- Premium: Có phí, thêm nhiều tính năng
- VIP: Cao cấp nhất, ưu tiên cao

## Hỗ trợ
- Liên hệ admin qua trang Contact
- Email hỗ trợ: support@viepool.com
- Chat với AI (đang sử dụng) để câu hỏi nhanh

## Rules & Policies
- Tôn trọng đối thủ và fair play
- Không gian lận hoặc vi phạm luật chơi
- Báo cáo kết quả trận đấu chính xác
`;

async function analyzeUserIntent(message: string): Promise<{
  intent: string;
  confidence: number;
  needsData: boolean;
}> {
  const lowerMessage = message.toLowerCase();
  
  // Simple intent matching for common user queries
  if (lowerMessage.includes('đăng ký') || lowerMessage.includes('tournament') || lowerMessage.includes('giải đấu')) {
    return { intent: 'tournament_info', confidence: 0.9, needsData: false };
  }
  
  if (lowerMessage.includes('elo') || lowerMessage.includes('ranking') || lowerMessage.includes('xếp hạng')) {
    return { intent: 'elo_system', confidence: 0.9, needsData: false };
  }
  
  if (lowerMessage.includes('membership') || lowerMessage.includes('gói') || lowerMessage.includes('premium')) {
    return { intent: 'membership_info', confidence: 0.9, needsData: false };
  }
  
  if (lowerMessage.includes('liên hệ') || lowerMessage.includes('support') || lowerMessage.includes('hỗ trợ')) {
    return { intent: 'support_contact', confidence: 0.9, needsData: false };
  }
  
  return { intent: 'general_chat', confidence: 0.5, needsData: false };
}

async function generateAIResponse(userMessage: string, intent: string): Promise<string> {
  try {
    const systemPrompt = `Bạn là AI assistant thân thiện của ViePool - nền tảng billiards trực tuyến Việt Nam.

NHIỆM VỤ:
- Trả lời câu hỏi người dùng về ViePool một cách ngắn gọn và hữu ích
- Sử dụng thông tin FAQ để trả lời chính xác
- Giọng điệu thân thiện, lịch sự, sử dụng tiếng Việt
- Không trả lời các câu hỏi không liên quan đến ViePool

THÔNG TIN CƠ BẢN:
${faqKnowledge}

HƯỚNG DẪN:
- Trả lời ngắn gọn (1-3 câu)
- Nếu không biết, hướng dẫn liên hệ support
- Intent hiện tại: ${intent}
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-nano', // Use the cheapest model for users
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        max_tokens: 300, // Keep responses short
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API error:', error);
    return 'Xin lỗi, tôi gặp sự cố kỹ thuật. Vui lòng thử lại sau hoặc liên hệ support để được hỗ trợ.';
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, message, userId }: UserMessage = await req.json();

    if (!sessionId || !message || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing user message:', { sessionId, userId, messageLength: message.length });

    // Analyze intent
    const intentAnalysis = await analyzeUserIntent(message);
    console.log('Intent analysis:', intentAnalysis);

    // Save user message
    const { error: userMsgError } = await supabase
      .from('user_chat_messages')
      .insert({
        session_id: sessionId,
        content: message,
        type: 'user',
        metadata: { intent: intentAnalysis }
      });

    if (userMsgError) {
      console.error('Error saving user message:', userMsgError);
      return new Response(
        JSON.stringify({ error: 'Failed to save message' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate AI response
    const aiResponse = await generateAIResponse(message, intentAnalysis.intent);
    console.log('AI response generated:', { length: aiResponse.length });

    // Save AI response
    const { error: aiMsgError } = await supabase
      .from('user_chat_messages')
      .insert({
        session_id: sessionId,
        content: aiResponse,
        type: 'assistant',
        metadata: { 
          intent: intentAnalysis.intent,
          model: 'gpt-4.1-nano',
          confidence: intentAnalysis.confidence
        }
      });

    if (aiMsgError) {
      console.error('Error saving AI message:', aiMsgError);
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
    console.error('Error in ai-user-assistant:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});