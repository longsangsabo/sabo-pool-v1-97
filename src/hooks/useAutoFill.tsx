import { useProfileContext } from '@/contexts/ProfileContext';

export const useAutoFill = () => {
  const { playerProfile, clubProfile } = useProfileContext();
  
  // Auto-fill player information
  const autoFillPlayerInfo = (formRef: React.RefObject<HTMLFormElement>) => {
    if (!playerProfile || !formRef.current) return;
    
    // Get all input elements in the form
    const inputs = formRef.current.querySelectorAll('input, textarea, select');
    
    // Map field names with data from profile
    inputs.forEach((input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) => {
      const name = input.name;
      
      // If input has data-autofill="player" and has corresponding data in profile
      if (input.getAttribute('data-autofill') === 'player' && playerProfile[name as keyof typeof playerProfile]) {
        const value = playerProfile[name as keyof typeof playerProfile];
        if (value !== null && value !== undefined) {
          input.value = String(value);
          
          // Trigger event for React form libraries (like Formik, React Hook Form)
          const event = new Event('input', { bubbles: true });
          input.dispatchEvent(event);
        }
      }
    });
  };
  
  // Auto-fill club information
  const autoFillClubInfo = (formRef: React.RefObject<HTMLFormElement>) => {
    if (!clubProfile || !formRef.current) return;
    
    const inputs = formRef.current.querySelectorAll('input, textarea, select');
    
    inputs.forEach((input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) => {
      const name = input.name;
      
      // If input has data-autofill="club" and has corresponding data in profile
      if (input.getAttribute('data-autofill') === 'club' && clubProfile[name as keyof typeof clubProfile]) {
        const value = clubProfile[name as keyof typeof clubProfile];
        if (value !== null && value !== undefined) {
          input.value = String(value);
          
          // Trigger event
          const event = new Event('input', { bubbles: true });
          input.dispatchEvent(event);
        }
      }
    });
  };
  
  // Auto-fill both player and club (if available)
  const autoFillAll = (formRef: React.RefObject<HTMLFormElement>) => {
    autoFillPlayerInfo(formRef);
    if (clubProfile) {
      autoFillClubInfo(formRef);
    }
  };
  
  return {
    autoFillPlayerInfo,
    autoFillClubInfo,
    autoFillAll,
    hasPlayerProfile: !!playerProfile,
    hasClubProfile: !!clubProfile
  };
};