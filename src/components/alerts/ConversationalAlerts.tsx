import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  Mic, 
  MicOff,
  Brain,
  AlertTriangle,
  TrendingUp,
  Shield,
  Clock,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: any;
}

interface QuickAction {
  id: string;
  label: string;
  action: string;
  icon: React.ReactNode;
}

export const ConversationalAlerts: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognition = useRef<any>(null);

  const quickActions: QuickAction[] = [
    {
      id: 'status',
      label: 'System Status',
      action: 'Cho tôi biết tình trạng hệ thống hiện tại',
      icon: <TrendingUp className="h-4 w-4" />
    },
    {
      id: 'critical',
      label: 'Critical Alerts',
      action: 'Có alert nào critical không?',
      icon: <AlertTriangle className="h-4 w-4" />
    },
    {
      id: 'performance',
      label: 'Performance Issues',
      action: 'Phân tích các vấn đề performance gần đây',
      icon: <Zap className="h-4 w-4" />
    },
    {
      id: 'security',
      label: 'Security Status',
      action: 'Kiểm tra tình trạng bảo mật',
      icon: <Shield className="h-4 w-4" />
    }
  ];

  useEffect(() => {
    // Welcome message
    setMessages([{
      id: '1',
      type: 'assistant',
      content: 'Xin chào! Tôi là AI Assistant chuyên về hệ thống alerts của SABO Pool Arena Hub. Tôi có thể giúp bạn:\n\n• Phân tích alerts và incidents\n• Đưa ra khuyến nghị giải quyết\n• Dự đoán potential issues\n• Trả lời questions về system status\n• Tạo reports và summaries\n\nBạn muốn biết điều gì?',
      timestamp: new Date(),
    }]);

    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window) {
      recognition.current = new (window as any).webkitSpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.lang = 'vi-VN';

      recognition.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };

      recognition.current.onerror = () => {
        setIsListening(false);
        toast.error('Speech recognition error');
      };

      recognition.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-alert-analyzer', {
        body: {
          action: 'chat_query',
          data: {
            query: content,
            alertContext: {
              conversation_history: messages.slice(-5),
              current_time: new Date().toISOString(),
              system_context: {
                active_alerts: 3,
                system_health: 'good',
                recent_incidents: 1
              }
            }
          }
        }
      });

      if (error) throw error;

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Lỗi gửi tin nhắn: ' + error.message);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: 'Xin lỗi, có lỗi xảy ra khi xử lý tin nhắn của bạn. Vui lòng thử lại.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const startListening = () => {
    if (recognition.current && !isListening) {
      setIsListening(true);
      recognition.current.start();
    }
  };

  const stopListening = () => {
    if (recognition.current && isListening) {
      recognition.current.stop();
      setIsListening(false);
    }
  };

  const handleQuickAction = (action: string) => {
    sendMessage(action);
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'user': return <User className="h-4 w-4" />;
      case 'assistant': return <Bot className="h-4 w-4" />;
      case 'system': return <AlertTriangle className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getMessageBadge = (type: string) => {
    switch (type) {
      case 'user': return 'You';
      case 'assistant': return 'AI Assistant';
      case 'system': return 'System';
      default: return 'Unknown';
    }
  };

  return (
    <div className="h-[600px] flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Conversational Alert Interface
            <Badge variant="outline" className="ml-auto">
              AI Powered
            </Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col gap-4">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction(action.action)}
                className="justify-start text-xs"
                disabled={loading}
              >
                {action.icon}
                <span className="ml-2 truncate">{action.label}</span>
              </Button>
            ))}
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.type === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.type !== 'user' && (
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.type === 'assistant' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {getMessageIcon(message.type)}
                    </div>
                  )}
                  
                  <div className={`max-w-[80%] ${
                    message.type === 'user' ? 'order-first' : ''
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge 
                        variant={message.type === 'user' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {getMessageBadge(message.type)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {message.timestamp.toLocaleTimeString('vi-VN')}
                      </span>
                    </div>
                    
                    <div className={`p-3 rounded-lg ${
                      message.type === 'user' 
                        ? 'bg-primary text-primary-foreground ml-auto' 
                        : message.type === 'assistant'
                        ? 'bg-muted'
                        : 'bg-orange-50 border border-orange-200'
                    }`}>
                      <div className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </div>
                    </div>
                  </div>

                  {message.type === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      {getMessageIcon(message.type)}
                    </div>
                  )}
                </div>
              ))}
              
              {loading && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <span className="ml-2">AI đang suy nghĩ...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage(inputMessage)}
                placeholder="Hỏi AI về alerts, system status, hoặc troubleshooting..."
                className="w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={loading}
              />
              {recognition.current && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={`absolute right-1 top-1 h-6 w-6 ${
                    isListening ? 'text-red-500' : 'text-muted-foreground'
                  }`}
                  onClick={isListening ? stopListening : startListening}
                  disabled={loading}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              )}
            </div>
            
            <Button
              onClick={() => sendMessage(inputMessage)}
              disabled={loading || !inputMessage.trim()}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>AI Assistant Online</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span>Response time: ~2-3s</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};