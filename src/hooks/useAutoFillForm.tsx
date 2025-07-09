import { useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useProfileContext } from '@/contexts/ProfileContext';

export const useAutoFillForm = <TFormValues extends Record<string, any>>(
  form: UseFormReturn<TFormValues>,
  options: {
    playerFields?: (keyof TFormValues)[];
    clubFields?: (keyof TFormValues)[];
    autoFillOnMount?: boolean;
  }
) => {
  const { playerProfile, clubProfile } = useProfileContext();
  const { playerFields = [], clubFields = [], autoFillOnMount = false } = options;
  
  // Auto-fill player info
  const fillPlayerInfo = () => {
    if (!playerProfile) return;
    
    const valuesToSet = {} as Partial<TFormValues>;
    
    playerFields.forEach(field => {
      const fieldName = field as string;
      if (playerProfile[fieldName as keyof typeof playerProfile]) {
        const value = playerProfile[fieldName as keyof typeof playerProfile];
        if (value !== null && value !== undefined) {
          valuesToSet[field] = value as TFormValues[keyof TFormValues];
        }
      }
    });
    
    if (Object.keys(valuesToSet).length > 0) {
      form.reset({ ...form.getValues(), ...valuesToSet });
    }
  };
  
  // Auto-fill club info
  const fillClubInfo = () => {
    if (!clubProfile) return;
    
    const valuesToSet = {} as Partial<TFormValues>;
    
    clubFields.forEach(field => {
      const fieldName = field as string;
      if (clubProfile[fieldName as keyof typeof clubProfile]) {
        const value = clubProfile[fieldName as keyof typeof clubProfile];
        if (value !== null && value !== undefined) {
          valuesToSet[field] = value as TFormValues[keyof TFormValues];
        }
      }
    });
    
    if (Object.keys(valuesToSet).length > 0) {
      form.reset({ ...form.getValues(), ...valuesToSet });
    }
  };
  
  // Fill all available info
  const fillAllInfo = () => {
    fillPlayerInfo();
    fillClubInfo();
  };
  
  // Auto-fill on mount if enabled
  useEffect(() => {
    if (autoFillOnMount && (playerProfile || clubProfile)) {
      fillAllInfo();
    }
  }, [playerProfile, clubProfile, autoFillOnMount]);
  
  return {
    fillPlayerInfo,
    fillClubInfo,
    fillAllInfo,
    hasPlayerProfile: !!playerProfile,
    hasClubProfile: !!clubProfile
  };
};