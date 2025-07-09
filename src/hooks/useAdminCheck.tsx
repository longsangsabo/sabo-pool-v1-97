
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useAdminCheck = () => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['admin-check', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('useAdminCheck: No user ID');
        return false;
      }

      console.log('useAdminCheck: Checking admin status for user:', user.id);

      // Check if user has admin status in profiles
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('useAdminCheck: Error checking admin status:', error);
        return false;
      }

      console.log('useAdminCheck: Profile data:', profile);
      const isAdmin = profile?.is_admin || false;
      console.log('useAdminCheck: Final admin status:', isAdmin);
      
      return isAdmin;
    },
    enabled: !!user?.id,
  });

  return {
    isAdmin: query.data || false,
    isLoading: query.isLoading,
    error: query.error
  };
};
