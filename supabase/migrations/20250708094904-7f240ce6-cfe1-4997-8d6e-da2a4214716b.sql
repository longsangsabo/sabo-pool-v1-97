-- Grant admin permissions to manage tournaments
CREATE POLICY "Admins can manage all tournaments" 
ON public.tournaments
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);