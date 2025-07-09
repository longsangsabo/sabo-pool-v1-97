import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Trophy,
  Activity
} from 'lucide-react';

interface MatchAnalysis {
  id: string;
  playerName: string;
  matchDate: string;
  opponent: string;
  result: 'win' | 'loss';
  score: string;
  aiInsights: {
    performanceScore: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    skillTrends: {
      accuracy: number;
      consistency: number;
      strategy: number;
      pressure: number;
    };
  };
}

interface PlayerPattern {
  type: 'strength' | 'weakness' | 'trend';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
}

export function AIMatchAnalyzer() {
  const [selectedMatch, setSelectedMatch] = useState<string>('1');
  const [analyses] = useState<MatchAnalysis[]>([
    {
      id: '1',
      playerName: 'Nguyễn Văn An',
      matchDate: '2024-01-15',
      opponent: 'Trần Thành Phong',
      result: 'win',
      score: '5-3',
      aiInsights: {
        performanceScore: 85,
        strengths: [
          'Kiểm soát cue ball xuất sắc trong các tình huống khó',
          'Khả năng safety play tốt khi bị áp lực',
          'Tỷ lệ pot ball cao trong khoảng cách trung bình'
        ],
        weaknesses: [
          'Thiếu tự tin trong các cú long shot',
          'Chiến thuật break không ổn định',
          'Thường mắc lỗi dưới áp lực cuối trận'
        ],
        recommendations: [
          'Luyện tập thêm các cú long shot với độ khó tăng dần',
          'Cải thiện kỹ thuật break bằng cách điều chỉnh stance',
          'Thực hành mental game để xử lý áp lực tốt hơn'
        ],
        skillTrends: {
          accuracy: 78,
          consistency: 82,
          strategy: 88,
          pressure: 65
        }
      }
    }
  ]);

  const [patterns] = useState<PlayerPattern[]>([
    {
      type: 'strength',
      title: 'Khả năng comeback xuất sắc',
      description: 'Player thường chơi tốt hơn khi bị dẫn trước 2-3 frame',
      confidence: 92,
      actionable: true
    },
    {
      type: 'weakness',
      title: 'Suy giảm hiệu suất sau 2 tiếng',
      description: 'Tỷ lệ thành công giảm 15% sau 2 tiếng thi đấu',
      confidence: 88,
      actionable: true
    },
    {
      type: 'trend',
      title: 'Cải thiện đáng kể safety play',
      description: 'Hiệu quả safety tăng 25% trong 30 ngày qua',
      confidence: 95,
      actionable: false
    }
  ]);

  const currentAnalysis = analyses.find(a => a.id === selectedMatch);

  const getPatternColor = (type: string) => {
    switch (type) {
      case 'strength': return 'bg-green-100 border-green-300';
      case 'weakness': return 'bg-red-100 border-red-300';
      case 'trend': return 'bg-blue-100 border-blue-300';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  const getPatternIcon = (type: string) => {
    switch (type) {
      case 'strength': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'weakness': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'trend': return <TrendingUp className="h-4 w-4 text-blue-600" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Analysis Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Brain className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>AI Match Analyzer</CardTitle>
              <CardDescription>
                Phân tích chi tiết hiệu suất và đưa ra khuyến nghị cải thiện
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="analysis" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analysis">Phân tích trận đấu</TabsTrigger>
          <TabsTrigger value="patterns">Mẫu hành vi</TabsTrigger>
          <TabsTrigger value="recommendations">Khuyến nghị</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-4">
          {currentAnalysis && (
            <>
              {/* Match Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Phân tích trận đấu</span>
                    <Badge variant={currentAnalysis.result === 'win' ? 'default' : 'destructive'}>
                      {currentAnalysis.result === 'win' ? 'Thắng' : 'Thua'} {currentAnalysis.score}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {currentAnalysis.playerName} vs {currentAnalysis.opponent} - {currentAnalysis.matchDate}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Điểm hiệu suất AI:</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={currentAnalysis.aiInsights.performanceScore} className="w-24" />
                        <span className="font-bold">{currentAnalysis.aiInsights.performanceScore}/100</span>
                      </div>
                    </div>

                    {/* Skill Breakdown */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(currentAnalysis.aiInsights.skillTrends).map(([skill, value]) => (
                        <div key={skill} className="text-center">
                          <div className="font-medium text-sm capitalize mb-1">
                            {skill === 'accuracy' && 'Độ chính xác'}
                            {skill === 'consistency' && 'Ổn định'}
                            {skill === 'strategy' && 'Chiến thuật'}
                            {skill === 'pressure' && 'Xử lý áp lực'}
                          </div>
                          <Progress value={value} className="mb-1" />
                          <span className="text-xs text-muted-foreground">{value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Strengths & Weaknesses */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-600 flex items-center space-x-2">
                      <Trophy className="h-5 w-5" />
                      <span>Điểm mạnh</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {currentAnalysis.aiInsights.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-600 flex items-center space-x-2">
                      <Target className="h-5 w-5" />
                      <span>Cần cải thiện</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {currentAnalysis.aiInsights.weaknesses.map((weakness, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mẫu hành vi được AI phát hiện</CardTitle>
              <CardDescription>
                Các xu hướng và patterns trong lối chơi được AI phân tích
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {patterns.map((pattern, index) => (
                  <div 
                    key={index}
                    className={`p-4 border rounded-lg ${getPatternColor(pattern.type)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {getPatternIcon(pattern.type)}
                        <div className="flex-1">
                          <h4 className="font-medium">{pattern.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {pattern.description}
                          </p>
                          <div className="flex items-center space-x-4 mt-2">
                            <div className="flex items-center space-x-1">
                              <span className="text-xs">Độ tin cậy:</span>
                              <Progress value={pattern.confidence} className="w-16 h-2" />
                              <span className="text-xs font-medium">{pattern.confidence}%</span>
                            </div>
                            {pattern.actionable && (
                              <Badge variant="outline" className="text-xs">
                                Có thể hành động
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Khuyến nghị cải thiện từ AI</CardTitle>
              <CardDescription>
                Lộ trình luyện tập được cá nhân hóa dựa trên phân tích AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentAnalysis && (
                <div className="space-y-4">
                  {currentAnalysis.aiInsights.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <Clock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm">{rec}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            Ưu tiên cao
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Thời gian ước tính: 2-3 tuần
                          </span>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        Bắt đầu
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}