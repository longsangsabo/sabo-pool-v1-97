import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Bot, User, Loader2, Trash2, Brain } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
}

const AI_MODELS = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Nhanh)', description: 'Phù hợp cho tác vụ thông thường' },
  { value: 'gpt-4o', label: 'GPT-4o (Mạnh)', description: 'Phù hhợp cho phân tích phức tạp' },
  { value: 'o4-mini', label: 'O4 Mini (Reasoning)', description: 'Tư duy logic mạnh' }
];

export const AIAdminAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Load existing session or create new one
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Try to get the latest session
        const { data: sessions } = await supabase
          .from('admin_chat_sessions')
          .select('id, title, created_at')
          .eq('admin_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (sessions && sessions.length > 0) {
          const session = sessions[0];
          setCurrentSessionId(session.id);
          await loadMessages(session.id);
        } else {
          await createNewSession();
        }
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing session:', error);
        setIsInitialized(true);
      }
    };

    initializeSession();
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const createNewSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: session, error } = await supabase
        .from('admin_chat_sessions')
        .insert({
          admin_id: user.id,
          title: `Chat ${new Date().toLocaleDateString('vi-VN')}`
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentSessionId(session.id);
      setMessages([{
        id: '1',
        type: 'assistant',
        content: 'Xin chào! Tôi là AI Assistant hỗ trợ admin. Tôi có thể giúp bạn phân tích dữ liệu, trả lời câu hỏi về hệ thống, và cung cấp insights. Bạn cần hỗ trợ gì?',
        timestamp: new Date()
      }]);

      // Save welcome message to database
      await supabase
        .from('admin_chat_messages')
        .insert({
          session_id: session.id,
          type: 'assistant',
          content: 'Xin chào! Tôi là AI Assistant hỗ trợ admin. Tôi có thể giúp bạn phân tích dữ liệu, trả lời câu hỏi về hệ thống, và cung cấp insights. Bạn cần hỗ trợ gì?'
        });

    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Không thể tạo phiên chat mới');
    }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      const { data: chatMessages, error } = await supabase
        .from('admin_chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedMessages: Message[] = chatMessages.map(msg => ({
        id: msg.id,
        type: msg.type as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date(msg.created_at)
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Không thể tải lịch sử chat');
    }
  };

  const saveMessage = async (type: 'user' | 'assistant', content: string) => {
    if (!currentSessionId) return;

    try {
      await supabase
        .from('admin_chat_messages')
        .insert({
          session_id: currentSessionId,
          type,
          content
        });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const clearChatHistory = async () => {
    if (!currentSessionId) return;

    try {
      // Delete all messages for current session
      await supabase
        .from('admin_chat_messages')
        .delete()
        .eq('session_id', currentSessionId);

      // Delete the session
      await supabase
        .from('admin_chat_sessions')
        .delete()
        .eq('id', currentSessionId);

      // Create new session
      await createNewSession();
      toast.success('Đã xóa lịch sử chat');
    } catch (error) {
      console.error('Error clearing chat:', error);
      toast.error('Không thể xóa lịch sử chat');
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !currentSessionId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    await saveMessage('user', input);
    
    const messageToSend = input;
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-admin-assistant', {
        body: { 
          message: messageToSend,
          session_id: currentSessionId,
          model: selectedModel
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.reply,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      await saveMessage('assistant', data.reply);
    } catch (error) {
      console.error('Error calling AI assistant:', error);
      toast.error('Có lỗi xảy ra khi gọi AI Assistant');
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Xin lỗi, tôi gặp lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      await saveMessage('assistant', errorMessage.content);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isInitialized) {
    return (
      <Card className="h-[600px] flex flex-col">
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Đang khởi tạo chat...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            AI Admin Assistant
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-40 h-8 text-xs">
                <div className="flex items-center gap-1">
                  <Brain className="h-3 w-3" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-lg z-50">
                {AI_MODELS.map((model) => (
                  <SelectItem key={model.value} value={model.value} className="text-xs">
                    <div>
                      <div className="font-medium">{model.label}</div>
                      <div className="text-muted-foreground">{model.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={clearChatHistory}
              className="h-8 px-2"
              title="Xóa lịch sử chat"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea ref={scrollAreaRef} className="flex-1 px-4">
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.type === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    message.type === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString('vi-VN')}
                  </p>
                </div>
                
                {message.type === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Đang suy nghĩ...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Hỏi về dữ liệu, insights, hoặc bất kỳ điều gì..."
              disabled={isLoading || !currentSessionId}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading || !currentSessionId}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="mt-2 flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Ví dụ: "Có bao nhiêu user mới tuần này?", "Phân tích xu hướng trận đấu", "Top clubs hoạt động nhất"
            </div>
            <div className="text-xs text-muted-foreground">
              Model: {AI_MODELS.find(m => m.value === selectedModel)?.label}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};