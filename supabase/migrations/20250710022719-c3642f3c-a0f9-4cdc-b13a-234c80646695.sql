-- Create user_chat_messages table for user AI assistant
CREATE TABLE public.user_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('user', 'assistant')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for user chat messages
CREATE POLICY "Users can view their own chat messages" 
ON public.user_chat_messages 
FOR SELECT 
USING (true); -- Allow viewing all messages for now, can be restricted by session later

CREATE POLICY "System can insert chat messages" 
ON public.user_chat_messages 
FOR INSERT 
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX idx_user_chat_messages_session_id ON public.user_chat_messages(session_id);
CREATE INDEX idx_user_chat_messages_created_at ON public.user_chat_messages(created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_user_chat_messages_updated_at
BEFORE UPDATE ON public.user_chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();