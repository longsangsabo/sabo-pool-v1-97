import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// OpenAI pricing per 1M tokens (as of 2025)
const OPENAI_PRICING = {
  'gpt-4.1-2025-04-14': { input: 2.50, output: 10.00 },
  'gpt-4.1-mini-2025-04-14': { input: 0.15, output: 0.60 },
  'o3-2025-04-16': { input: 15.00, output: 60.00 },
  'o4-mini-2025-04-16': { input: 3.00, output: 12.00 }
} as const;

function calculateOpenAICost(modelId: string, promptTokens: number, completionTokens: number): number {
  const pricing = OPENAI_PRICING[modelId as keyof typeof OPENAI_PRICING];
  if (!pricing) return 0;
  
  const inputCost = (promptTokens / 1000000) * pricing.input;
  const outputCost = (completionTokens / 1000000) * pricing.output;
  
  return inputCost + outputCost;
}

async function logOpenAIUsage(supabase: any, usage: {
  model_id: string;
  task_type: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_usd: number;
  response_time_ms: number;
  success: boolean;
  error_message?: string;
  user_id?: string;
  function_name: string;
}): Promise<void> {
  try {
    const { error } = await supabase
      .from('openai_usage_logs')
      .insert([usage]);

    if (error) {
      console.error('Failed to log OpenAI usage:', error);
    }
  } catch (error) {
    console.error('Error logging OpenAI usage:', error);
  }
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, data, model } = await req.json();
    
    // Model selection with smart defaults
    const getOptimalModel = (action: string, userModel?: string): string => {
      if (userModel && ['gpt-4.1-2025-04-14', 'gpt-4.1-mini-2025-04-14', 'o3-2025-04-16', 'o4-mini-2025-04-16'].includes(userModel)) {
        return userModel;
      }
      
      // Smart model recommendations based on task complexity
      const taskModels = {
        'analyze_alert': 'o3-2025-04-16',        // Complex reasoning needed
        'predict_incidents': 'o3-2025-04-16',    // Deep analysis required  
        'suggest_resolution': 'gpt-4.1-2025-04-14', // Balanced approach
        'generate_summary': 'gpt-4.1-mini-2025-04-14', // Fast and efficient
        'chat_query': 'gpt-4.1-2025-04-14'      // General purpose
      };
      
      return taskModels[action as keyof typeof taskModels] || 'gpt-4.1-2025-04-14';
    };
    
    const selectedModel = getOptimalModel(action, model);

    console.log('🤖 AI Alert Analyzer - Action:', action);

    switch (action) {
      case 'analyze_alert': {
        const { alertData, context } = data;
        
        const analysisPrompt = `
Bạn là AI expert trong việc phân tích alerts hệ thống SABO Pool Arena Hub.

Alert Data:
${JSON.stringify(alertData, null, 2)}

Context:
${JSON.stringify(context, null, 2)}

Hãy phân tích alert này và trả về JSON response với:
{
  "severity": "low|medium|high|critical",
  "urgency": "low|medium|high|critical", 
  "category": "performance|security|business|system|user_experience",
  "root_cause_analysis": "Phân tích nguyên nhân gốc bằng tiếng Việt",
  "impact_assessment": "Đánh giá tác động",
  "recommended_actions": ["action1", "action2", "action3"],
  "priority_score": 1-100,
  "summary": "Tóm tắt ngắn gọn bằng tiếng Việt",
  "technical_details": "Chi tiết kỹ thuật",
  "estimated_resolution_time": "15m|1h|4h|1d|3d",
  "related_patterns": ["pattern1", "pattern2"]
}`;

        const startTime = Date.now();
        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [
              { role: 'system', content: 'You are an expert system analyst specializing in alert analysis for pool/billiards gaming platforms. Respond only with valid JSON.' },
              { role: 'user', content: analysisPrompt }
            ],
            temperature: selectedModel.includes('o3') ? 0.1 : 0.3, // Lower temp for reasoning models
            max_tokens: selectedModel.includes('o3') ? 3000 : 1500
          }),
        });

        const aiData = await aiResponse.json();
        const analysis = JSON.parse(aiData.choices[0].message.content);
        const responseTime = Date.now() - startTime;

        // Log usage data
        const usage = aiData.usage || {};
        const promptTokens = usage.prompt_tokens || 0;
        const completionTokens = usage.completion_tokens || 0;
        const totalTokens = usage.total_tokens || 0;
        const cost = calculateOpenAICost(selectedModel, promptTokens, completionTokens);

        // Log to database (fire and forget)
        logOpenAIUsage(supabase, {
          model_id: selectedModel,
          task_type: 'alert_analysis',
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: totalTokens,
          cost_usd: cost,
          response_time_ms: responseTime,
          success: true,
          function_name: 'ai-alert-analyzer'
        }).catch(err => console.error('Failed to log usage:', err));

        // Store analysis in database
        const { data: savedAnalysis, error } = await supabase
          .from('ai_alert_analysis')
          .insert({
            alert_id: alertData.id,
            analysis_data: analysis,
            ai_model: selectedModel,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          console.error('Error saving analysis:', error);
        }

        return new Response(JSON.stringify({
          success: true,
          analysis,
          analysis_id: savedAnalysis?.id
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'generate_summary': {
        const { alerts, timeframe } = data;
        
        const summaryPrompt = `
Tạo báo cáo tóm tắt alerts cho SABO Pool Arena Hub trong khoảng thời gian: ${timeframe}

Alerts data:
${JSON.stringify(alerts, null, 2)}

Hãy tạo một báo cáo tóm tắt bao gồm:
1. Tổng quan tình hình
2. Các vấn đề chính
3. Xu hướng và patterns
4. Khuyến nghị cải thiện
5. Dự đoán rủi ro

Format: Markdown tiếng Việt, dễ đọc và chuyên nghiệp.
`;

        const startTime = Date.now();
        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [
              { role: 'system', content: 'You are a technical report writer for gaming platform operations. Create detailed, actionable reports in Vietnamese.' },
              { role: 'user', content: summaryPrompt }
            ],
            temperature: selectedModel.includes('o3') ? 0.2 : 0.4,
            max_tokens: selectedModel.includes('o3') ? 4000 : 2000
          }),
        });

        const aiData = await aiResponse.json();
        const summary = aiData.choices[0].message.content;

        return new Response(JSON.stringify({
          success: true,
          summary,
          generated_at: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'suggest_resolution': {
        const { alertData, historicalData } = data;
        
        const resolutionPrompt = `
Alert cần giải quyết:
${JSON.stringify(alertData, null, 2)}

Dữ liệu lịch sử tương tự:
${JSON.stringify(historicalData, null, 2)}

Hãy đưa ra hướng dẫn giải quyết chi tiết với:
1. Các bước troubleshooting
2. Commands/queries cần chạy
3. Các checkpoint để verify
4. Backup plan nếu solution không work
5. Thời gian dự kiến cho mỗi bước

Format: Markdown với step-by-step instructions.
`;

        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [
              { role: 'system', content: 'You are a senior DevOps engineer with expertise in gaming platform operations. Provide detailed, practical troubleshooting guides.' },
              { role: 'user', content: resolutionPrompt }
            ],
            temperature: selectedModel.includes('o3') ? 0.1 : 0.2,
            max_tokens: selectedModel.includes('o3') ? 3000 : 2000
          }),
        });

        const aiData = await aiResponse.json();
        const resolution = aiData.choices[0].message.content;

        return new Response(JSON.stringify({
          success: true,
          resolution_guide: resolution,
          generated_at: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'predict_incidents': {
        const { systemMetrics, alertHistory } = data;
        
        const predictionPrompt = `
Dựa trên system metrics và alert history, hãy dự đoán các incidents có thể xảy ra:

System Metrics:
${JSON.stringify(systemMetrics, null, 2)}

Alert History:
${JSON.stringify(alertHistory, null, 2)}

Trả về JSON với format:
{
  "predictions": [
    {
      "incident_type": "performance_degradation|security_breach|system_outage|user_impact",
      "probability": 0.0-1.0,
      "estimated_timeframe": "1h|6h|24h|3d|1w",
      "description": "Mô tả chi tiết",
      "early_warning_signs": ["sign1", "sign2"],
      "preventive_measures": ["measure1", "measure2"],
      "potential_impact": "low|medium|high|critical"
    }
  ],
  "overall_risk_score": 0-100,
  "recommendations": ["rec1", "rec2", "rec3"]
}
`;

        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [
              { role: 'system', content: 'You are a predictive analytics expert for system reliability. Analyze patterns and predict potential issues with high accuracy.' },
              { role: 'user', content: predictionPrompt }
            ],
            temperature: selectedModel.includes('o3') ? 0.05 : 0.1,
            max_tokens: selectedModel.includes('o3') ? 3000 : 1500
          }),
        });

        const aiData = await aiResponse.json();
        const predictions = JSON.parse(aiData.choices[0].message.content);

        return new Response(JSON.stringify({
          success: true,
          predictions,
          generated_at: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'chat_query': {
        const { query, alertContext } = data;
        
        const chatPrompt = `
Bạn là AI assistant chuyên về hệ thống alerts của SABO Pool Arena Hub.

Context hiện tại:
${JSON.stringify(alertContext, null, 2)}

User query: ${query}

Hãy trả lời câu hỏi một cách chi tiết, chính xác và hữu ích. Nếu cần thêm thông tin, hãy đề xuất những gì user nên cung cấp.
`;

        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [
              { role: 'system', content: 'You are a helpful AI assistant specializing in system monitoring and alert management for gaming platforms. Respond in Vietnamese when appropriate.' },
              { role: 'user', content: chatPrompt }
            ],
            temperature: selectedModel.includes('o3') ? 0.3 : 0.5,
            max_tokens: selectedModel.includes('o3') ? 2000 : 1000
          }),
        });

        const aiData = await aiResponse.json();
        const response = aiData.choices[0].message.content;

        return new Response(JSON.stringify({
          success: true,
          response,
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid action'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

  } catch (error: any) {
    console.error('💥 Error in AI Alert Analyzer:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);