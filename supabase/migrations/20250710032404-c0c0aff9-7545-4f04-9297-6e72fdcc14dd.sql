
-- Create user_knowledge_base table for public information
CREATE TABLE public.user_knowledge_base (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'faq',
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_knowledge_base ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can view active user knowledge" 
ON public.user_knowledge_base 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage user knowledge base" 
ON public.user_knowledge_base 
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true
));

-- Create indexes
CREATE INDEX idx_user_knowledge_base_category ON public.user_knowledge_base(category);
CREATE INDEX idx_user_knowledge_base_tags ON public.user_knowledge_base USING GIN(tags);
CREATE INDEX idx_user_knowledge_base_active ON public.user_knowledge_base(is_active);

-- Create trigger for updated_at
CREATE TRIGGER update_user_knowledge_base_updated_at
BEFORE UPDATE ON public.user_knowledge_base
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate public content from admin_knowledge_base to user_knowledge_base
INSERT INTO public.user_knowledge_base (title, content, category, content_type, tags, is_active, priority)
SELECT 
  title,
  content,
  category,
  content_type,
  tags,
  is_active,
  priority
FROM public.admin_knowledge_base
WHERE category IN ('elo_system', 'tournament_info', 'membership_info', 'support_contact', 'general_faq', 'rules_policies')
AND is_active = true;

-- Remove migrated public content from admin_knowledge_base
DELETE FROM public.admin_knowledge_base 
WHERE category IN ('elo_system', 'tournament_info', 'membership_info', 'support_contact', 'general_faq', 'rules_policies');

-- Update admin_knowledge_base to focus on admin workflows
UPDATE public.admin_knowledge_base 
SET 
  category = 'admin_workflow',
  content_type = 'workflow',
  updated_at = now()
WHERE category NOT IN ('admin_workflow', 'system_config', 'security_policy');

-- Add content classification to admin_knowledge_base
ALTER TABLE public.admin_knowledge_base 
ADD COLUMN IF NOT EXISTS classification TEXT DEFAULT 'internal' CHECK (classification IN ('internal', 'confidential', 'restricted'));

-- Update existing admin content classification
UPDATE public.admin_knowledge_base 
SET classification = 'internal'
WHERE classification IS NULL;
