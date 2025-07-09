import React, { useState } from 'react';
import { Bot, Zap, Brain, Code, Star, DollarSign } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface GPTModel {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  strengths: string[];
  costLevel: 'low' | 'medium' | 'high';
  speed: 'fast' | 'medium' | 'slow';
  recommended: string[];
  contextWindow: string;
  outputTokens: string;
}

export const GPT_MODELS: GPTModel[] = [
  {
    id: 'gpt-4.1-2025-04-14',
    name: 'GPT-4.1 (Flagship)',
    description: 'Model mạnh nhất, cân bằng giữa hiệu suất và chi phí',
    icon: <Star className="w-4 h-4 text-yellow-500" />,
    strengths: ['Reasoning mạnh', 'Đa nhiệm tốt', 'Chất lượng cao'],
    costLevel: 'high',
    speed: 'medium',
    recommended: ['Chat queries', 'General analysis', 'Complex tasks'],
    contextWindow: '128K tokens',
    outputTokens: '16K tokens'
  },
  {
    id: 'gpt-4.1-mini-2025-04-14',
    name: 'GPT-4.1 Mini',
    description: 'Nhanh và tiết kiệm, phù hợp cho hầu hết tasks',
    icon: <Zap className="w-4 h-4 text-blue-500" />,
    strengths: ['Tốc độ cao', 'Chi phí thấp', 'Hiệu quả'],
    costLevel: 'low',
    speed: 'fast',
    recommended: ['Translation', 'Simple analysis', 'Quick responses'],
    contextWindow: '128K tokens',
    outputTokens: '16K tokens'
  },
  {
    id: 'o3-2025-04-16',
    name: 'O3 (Reasoning)',
    description: 'Chuyên sâu về phân tích và reasoning phức tạp',
    icon: <Brain className="w-4 h-4 text-purple-500" />,
    strengths: ['Deep thinking', 'Complex reasoning', 'Problem solving'],
    costLevel: 'high',
    speed: 'slow',
    recommended: ['Alert analysis', 'Incident prediction', 'Root cause analysis'],
    contextWindow: '128K tokens',
    outputTokens: '100K tokens'
  },
  {
    id: 'o4-mini-2025-04-16',
    name: 'O4 Mini (Fast Reasoning)',
    description: 'Reasoning nhanh cho coding và visual tasks',
    icon: <Code className="w-4 h-4 text-green-500" />,
    strengths: ['Fast reasoning', 'Coding optimal', 'Visual tasks'],
    costLevel: 'medium',
    speed: 'fast',
    recommended: ['Code analysis', 'System diagnostics', 'Quick reasoning'],
    contextWindow: '128K tokens',
    outputTokens: '65K tokens'
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini (Legacy)',
    description: 'Model cũ, dùng cho backward compatibility',
    icon: <Bot className="w-4 h-4 text-gray-500" />,
    strengths: ['Stable', 'Reliable', 'Vision capable'],
    costLevel: 'low',
    speed: 'medium',
    recommended: ['Legacy support', 'Basic tasks'],
    contextWindow: '128K tokens',
    outputTokens: '16K tokens'
  }
];

interface ModelSelectorProps {
  value?: string;
  onChange: (modelId: string) => void;
  taskType?: 'translation' | 'alert_analysis' | 'chat' | 'reasoning' | 'general';
  showDetails?: boolean;
  className?: string;
}

const getRecommendedModel = (taskType: string): string => {
  const recommendations = {
    'translation': 'gpt-4.1-mini-2025-04-14',
    'alert_analysis': 'o3-2025-04-16',
    'chat': 'gpt-4.1-2025-04-14',
    'reasoning': 'o3-2025-04-16',
    'general': 'gpt-4.1-2025-04-14'
  };
  
  return recommendations[taskType as keyof typeof recommendations] || 'gpt-4.1-2025-04-14';
};

const getCostColor = (costLevel: string) => {
  switch (costLevel) {
    case 'low': return 'text-green-600 bg-green-100';
    case 'medium': return 'text-yellow-600 bg-yellow-100';
    case 'high': return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

const getSpeedColor = (speed: string) => {
  switch (speed) {
    case 'fast': return 'text-green-600 bg-green-100';
    case 'medium': return 'text-yellow-600 bg-yellow-100';
    case 'slow': return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  value,
  onChange,
  taskType = 'general',
  showDetails = false,
  className = ''
}) => {
  const [selectedModel, setSelectedModel] = useState(value || getRecommendedModel(taskType));
  const recommendedModelId = getRecommendedModel(taskType);

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    onChange(modelId);
  };

  const selectedModelData = GPT_MODELS.find(m => m.id === selectedModel);

  return (
    <TooltipProvider>
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">AI Model</label>
          {taskType !== 'general' && (
            <Badge variant="outline" className="text-xs">
              Recommended: {GPT_MODELS.find(m => m.id === recommendedModelId)?.name}
            </Badge>
          )}
        </div>

        <Select value={selectedModel} onValueChange={handleModelChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Chọn model AI">
              {selectedModelData && (
                <div className="flex items-center gap-2">
                  {selectedModelData.icon}
                  <span>{selectedModelData.name}</span>
                  {selectedModel === recommendedModelId && (
                    <Badge variant="secondary" className="text-xs">Recommended</Badge>
                  )}
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {GPT_MODELS.map((model) => (
              <SelectItem key={model.id} value={model.id} className="cursor-pointer">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    {model.icon}
                    <div>
                      <div className="font-medium">{model.name}</div>
                      <div className="text-xs text-muted-foreground">{model.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge className={`text-xs ${getCostColor(model.costLevel)}`}>
                      <DollarSign className="w-3 h-3 mr-1" />
                      {model.costLevel}
                    </Badge>
                    <Badge className={`text-xs ${getSpeedColor(model.speed)}`}>
                      <Zap className="w-3 h-3 mr-1" />
                      {model.speed}
                    </Badge>
                    {model.id === recommendedModelId && (
                      <Badge variant="default" className="text-xs">★</Badge>
                    )}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {showDetails && selectedModelData && (
          <Card className="mt-3">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                {selectedModelData.icon}
                {selectedModelData.name}
              </CardTitle>
              <CardDescription className="text-xs">
                {selectedModelData.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="font-medium">Context:</span> {selectedModelData.contextWindow}
                </div>
                <div>
                  <span className="font-medium">Output:</span> {selectedModelData.outputTokens}
                </div>
              </div>
              
              <div>
                <span className="text-xs font-medium">Điểm mạnh:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedModelData.strengths.map((strength, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {strength}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs font-medium">Phù hợp cho:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedModelData.recommended.map((rec, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {rec}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2 border-t">
                <Tooltip>
                  <TooltipTrigger>
                    <Badge className={`text-xs ${getCostColor(selectedModelData.costLevel)}`}>
                      <DollarSign className="w-3 h-3 mr-1" />
                      Chi phí: {selectedModelData.costLevel}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Mức chi phí sử dụng model</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger>
                    <Badge className={`text-xs ${getSpeedColor(selectedModelData.speed)}`}>
                      <Zap className="w-3 h-3 mr-1" />
                      Tốc độ: {selectedModelData.speed}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Tốc độ phản hồi của model</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
};

export default ModelSelector;