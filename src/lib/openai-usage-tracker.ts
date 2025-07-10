import { supabase } from "@/integrations/supabase/client";

export interface OpenAIUsageLog {
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
}

// OpenAI pricing per 1M tokens (as of 2025)
const OPENAI_PRICING = {
  'gpt-4.1-nano': { input: 0.05, output: 0.20 }, // Estimated ultra-cheap pricing
  'gpt-4.1-2025-04-14': { input: 2.50, output: 10.00 },
  'gpt-4.1-mini-2025-04-14': { input: 0.15, output: 0.60 },
  'o3-2025-04-16': { input: 15.00, output: 60.00 },
  'o4-mini-2025-04-16': { input: 3.00, output: 12.00 }
} as const;

export function calculateOpenAICost(
  modelId: string, 
  promptTokens: number, 
  completionTokens: number
): number {
  const pricing = OPENAI_PRICING[modelId as keyof typeof OPENAI_PRICING];
  if (!pricing) return 0;
  
  const inputCost = (promptTokens / 1000000) * pricing.input;
  const outputCost = (completionTokens / 1000000) * pricing.output;
  
  return inputCost + outputCost;
}

export async function logOpenAIUsage(usage: OpenAIUsageLog): Promise<void> {
  try {
    const { error } = await supabase
      .from('openai_usage_logs')
      .insert([{
        model_id: usage.model_id,
        task_type: usage.task_type,
        prompt_tokens: usage.prompt_tokens,
        completion_tokens: usage.completion_tokens,
        total_tokens: usage.total_tokens,
        cost_usd: usage.cost_usd,
        response_time_ms: usage.response_time_ms,
        success: usage.success,
        error_message: usage.error_message,
        user_id: usage.user_id,
        function_name: usage.function_name
      }]);

    if (error) {
      console.error('Failed to log OpenAI usage:', error);
    }
  } catch (error) {
    console.error('Error logging OpenAI usage:', error);
  }
}

export async function getOpenAIUsageStats(days: number = 30) {
  const { data, error } = await supabase
    .from('openai_usage_logs')
    .select('*')
    .gte('timestamp', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Failed to fetch OpenAI usage stats:', error);
    return [];
  }

  return data || [];
}

export async function getModelUsageStats() {
  const { data, error } = await supabase
    .from('openai_usage_logs')
    .select('model_id, function_name, total_tokens, cost_usd, success, response_time_ms')
    .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  if (error) {
    console.error('Failed to fetch model usage stats:', error);
    return [];
  }

  // Group by model and aggregate stats
  const stats = data.reduce((acc, log) => {
    const key = log.model_id;
    if (!acc[key]) {
      acc[key] = {
        modelId: log.model_id,
        requests: 0,
        cost: 0,
        avgResponseTime: 0,
        successRate: 0,
        totalResponseTime: 0,
        successCount: 0
      };
    }
    
    acc[key].requests += 1;
    acc[key].cost += log.cost_usd;
    acc[key].totalResponseTime += log.response_time_ms;
    if (log.success) acc[key].successCount += 1;
    
    return acc;
  }, {} as Record<string, any>);

  // Calculate averages and success rates
  return Object.values(stats).map((stat: any) => ({
    modelId: stat.modelId,
    requests: stat.requests,
    cost: stat.cost,
    avgResponseTime: Math.round(stat.totalResponseTime / stat.requests / 1000 * 100) / 100,
    successRate: Math.round((stat.successCount / stat.requests) * 100 * 10) / 10
  }));
}

export async function getAIAssistantStats() {
  const { data, error } = await supabase
    .from('openai_usage_logs')
    .select('model_id, function_name, total_tokens, cost_usd, success, response_time_ms, user_id')
    .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .in('function_name', ['ai-user-assistant', 'ai-admin-assistant']);

  if (error) {
    console.error('Failed to fetch AI assistant stats:', error);
    return [];
  }

  // Group by function_name and aggregate stats
  const stats = data.reduce((acc, log) => {
    const key = log.function_name;
    if (!acc[key]) {
      acc[key] = {
        assistant_type: key === 'ai-user-assistant' ? 'user' : 'admin',
        model_name: log.model_id,
        total_requests: 0,
        successful_requests: 0,
        failed_requests: 0,
        total_tokens: 0,
        avg_response_time: 0,
        unique_users: new Set(),
        unique_sessions: new Set(),
        totalResponseTime: 0
      };
    }
    
    acc[key].total_requests += 1;
    acc[key].total_tokens += log.total_tokens;
    acc[key].totalResponseTime += log.response_time_ms;
    
    if (log.success) {
      acc[key].successful_requests += 1;
    } else {
      acc[key].failed_requests += 1;
    }
    
    if (log.user_id) {
      acc[key].unique_users.add(log.user_id);
    }
    
    return acc;
  }, {} as Record<string, any>);

  // Calculate averages and convert sets to counts
  return Object.values(stats).map((stat: any) => ({
    assistant_type: stat.assistant_type,
    model_name: stat.model_name,
    total_requests: stat.total_requests,
    successful_requests: stat.successful_requests,
    failed_requests: stat.failed_requests,
    total_tokens: stat.total_tokens,
    avg_response_time: Math.round(stat.totalResponseTime / stat.total_requests),
    unique_users: stat.unique_users.size,
    unique_sessions: stat.unique_sessions.size,
    success_rate: Math.round((stat.successful_requests / stat.total_requests) * 100 * 10) / 10
  }));
}