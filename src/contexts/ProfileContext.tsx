import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Define data types for profiles
interface PlayerProfile {
  id: string;
  user_id: string;
  full_name: string;
  display_name?: string;
  phone?: string;
  address?: string;
  city?: string;
  district?: string;
  bio?: string;
  avatar_url?: string;
  verified_rank?: string;
  email?: string;
}

interface ClubProfile {
  id: string;
  user_id: string;
  club_name: string;
  address: string;
  phone: string;
  email?: string;
  verified_at?: string;
  verification_status?: string;
  number_of_tables?: number;
  operating_hours?: any;
}

interface ProfileContextType {
  playerProfile: PlayerProfile | null;
  clubProfile: ClubProfile | null;
  isLoading: boolean;
  refreshProfiles: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile | null>(null);
  const [clubProfile, setClubProfile] = useState<ClubProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { user } = useAuth();

  // Fetch profile data
  const fetchProfiles = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    try {
      // Fetch player profile
      const { data: playerData, error: playerError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (playerError && playerError.code !== 'PGRST116') {
        throw playerError;
      }
      
      if (playerData) {
        setPlayerProfile(playerData);
        
        // Check if user is a club owner and fetch club profile
        if (playerData.role === 'club_owner') {
          const { data: clubData, error: clubError } = await supabase
            .from('club_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();
          
          if (!clubError && clubData) {
            setClubProfile(clubData);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Refresh profiles data
  const refreshProfiles = async () => {
    await fetchProfiles();
  };
  
  // Initial fetch
  useEffect(() => {
    fetchProfiles();
  }, [user]);
  
  return (
    <ProfileContext.Provider 
      value={{ 
        playerProfile, 
        clubProfile, 
        isLoading, 
        refreshProfiles 
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

// Hook to use context
export const useProfileContext = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfileContext must be used within a ProfileProvider');
  }
  return context;
};