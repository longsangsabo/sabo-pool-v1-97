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

// Dynamic knowledge base fetcher
async function getDynamicKnowledgeBase(intent: string, message: string): Promise<string> {
  try {
    const { data: knowledgeItems } = await supabase
      .from('admin_knowledge_base')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: true });

    if (!knowledgeItems || knowledgeItems.length === 0) {
      return getDefaultKnowledgeBase();
    }

    // Score and filter relevant knowledge items
    const relevantItems = knowledgeItems
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
          item.tags.forEach(tag => {
            if (lowerMessage.includes(tag.toLowerCase())) {
              score += 5;
            }
          });
        }

        // Intent-based matching
        if (intent === 'elo_system' && (lowerContent.includes('elo') || lowerContent.includes('điểm'))) {
          score += 8;
        }
        if (intent === 'tournament_info' && (lowerContent.includes('giải đấu') || lowerContent.includes('tournament'))) {
          score += 8;
        }

        return { ...item, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // Top 5 most relevant

    if (relevantItems.length === 0) {
      return getDefaultKnowledgeBase();
    }

    // Build dynamic knowledge base
    let knowledgeBase = `# SABO Pool Arena - Hệ thống Billiards Hàng Đầu Việt Nam\n\n`;
    
    relevantItems.forEach(item => {
      knowledgeBase += `## ${item.title}\n${item.content}\n\n`;
    });

    return knowledgeBase;
  } catch (error) {
    console.error('Error fetching dynamic knowledge base:', error);
    return getDefaultKnowledgeBase();
  }
}

// Fallback knowledge base with correct branding
function getDefaultKnowledgeBase(): string {
  return `
# SABO Pool Arena FAQ & Thông tin chi tiết

## Hệ thống ELO SABO Pool Arena
- ELO bắt đầu từ 1000 điểm cho người chơi mới
- Thắng sẽ tăng ELO, thua sẽ giảm ELO
- Mức thay đổi ELO phụ thuộc vào:
  * Chênh lệch ELO giữa 2 người chơi
  * K-factor: 40 (dưới 30 trận), 32 (bình thường), 24 (ELO 2100+), 16 (ELO 2400+)
  * Kết quả trận đấu và tỷ số
- VÔ ĐỊCH GIẢI ĐẤU: Thường tăng 20-50 ELO tùy thuộc vào đối thủ và giải đấu
- Trận ranking được tính ELO theo công thức Elo chuẩn quốc tế

## Đăng ký giải đấu
- Vào trang Tournaments và chọn giải muốn tham gia
- Cần có tài khoản đã xác minh và đủ điều kiện ELO tối thiểu
- Phí đăng ký sẽ được hiển thị trước khi xác nhận
- Có thể đăng ký individual hoặc team tùy loại giải

## Membership & Gói dịch vụ
- **Basic** (Miễn phí): Tham gia giải đấu cơ bản, xem ranking
- **Premium** (Có phí): Thêm nhiều tính năng pro, ưu tiên đăng ký giải
- **VIP** (Cao cấp): Toàn quyền truy cập, hỗ trợ 24/7, giải độc quyền

## Hỗ trợ & Liên hệ
- Liên hệ admin qua trang Contact trong app
- Email hỗ trợ: support@sabopoolarea.com
- Chat với AI (đang sử dụng) để câu hỏi nhanh
- Hotline: 1900-SABO

## Quy tắc & Chính sách
- Tôn trọng đối thủ và fair play
- Không gian lận hoặc vi phạm luật chơi
- Báo cáo kết quả trận đấu chính xác và trung thực
- Vi phạm có thể bị trừ ELO hoặc cấm tài khoản
`;
}

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
    // Get dynamic knowledge base
    const dynamicKnowledgeBase = await getDynamicKnowledgeBase(intent, userMessage);
    
    const systemPrompt = `Bạn là AI assistant chính thức của SABO Pool Arena - nền tảng billiards hàng đầu Việt Nam.

NHIỆM VỤ:
- Trả lời câu hỏi về SABO Pool Arena một cách CHÍNH XÁC và CHI TIẾT
- Sử dụng đúng thông tin từ knowledge base được cập nhật tự động
- Giọng điệu chuyên nghiệp, thân thiện, sử dụng tiếng Việt
- TUYỆT ĐỐI KHÔNG trả lời "SABO Pool Arena không có" khi thực tế có thông tin
- Luôn cập nhật thông tin mới nhất từ hệ thống

KNOWLEDGE BASE SABO Pool Arena (Cập nhật tự động):
${dynamicKnowledgeBase}

HƯỚNG DẪN TRẢ LỜI:
- Với câu hỏi về ELO: Giải thích chi tiết hệ thống tính ELO
- Với câu hỏi về vô địch: Nói rõ mức ELO tăng 20-50 điểm tùy đối thủ
- Với câu hỏi về giải đấu: Hướng dẫn cụ thể cách đăng ký
- Intent hiện tại: ${intent}
- LUÔN đưa ra thông tin có ích và hướng dẫn cụ thể
- Thông tin được cập nhật tự động từ database

VÍ DỤ TRÁCH NHIỆM:
- "Vô địch giải đấu thường tăng 20-50 ELO tùy mức độ đối thủ và quy mô giải"
- "Hệ thống ELO SABO Pool Arena tính theo công thức Elo quốc tế với K-factor từ 16-40"
- "Thông tin được cập nhật tự động từ hệ thống SABO Pool Arena"
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
          { role: 'user', content: userMessage }
        ],
        max_tokens: 400, // Tăng lên để trả lời chi tiết hơn
        temperature: 0.3, // Giảm để ổn định hơn
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API error:', error);
    return 'Xin lỗi, tôi gặp sự cố kỹ thuật. Vui lòng thử lại sau hoặc liên hệ support@sabopoolarea.com để được hỗ trợ.';
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