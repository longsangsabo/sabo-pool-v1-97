-- Create user chat sessions table
CREATE TABLE public.user_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user chat messages table
CREATE TABLE public.user_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.user_chat_sessions(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('user', 'assistant')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_user_chat_sessions_user_id ON public.user_chat_sessions(user_id);
CREATE INDEX idx_user_chat_sessions_updated_at ON public.user_chat_sessions(updated_at DESC);
CREATE INDEX idx_user_chat_messages_session_id ON public.user_chat_messages(session_id);
CREATE INDEX idx_user_chat_messages_created_at ON public.user_chat_messages(created_at DESC);

-- Enable RLS
ALTER TABLE public.user_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_chat_sessions
CREATE POLICY "Users can manage their own chat sessions" 
ON public.user_chat_sessions FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS policies for user_chat_messages  
CREATE POLICY "Users can manage messages in their sessions" 
ON public.user_chat_messages FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_chat_sessions s 
    WHERE s.id = user_chat_messages.session_id 
    AND s.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_chat_sessions s 
    WHERE s.id = user_chat_messages.session_id 
    AND s.user_id = auth.uid()
  )
);

-- Create trigger to update updated_at on user_chat_sessions
CREATE OR REPLACE FUNCTION public.update_user_chat_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.user_chat_sessions 
  SET updated_at = now() 
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_user_chat_session_updated_at
  AFTER INSERT OR UPDATE ON public.user_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_chat_session_updated_at();