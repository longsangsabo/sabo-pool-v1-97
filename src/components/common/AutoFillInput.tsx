import React, { forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { useProfileContext } from '@/contexts/ProfileContext';

interface AutoFillInputProps extends React.ComponentProps<typeof Input> {
  fieldType: 'player' | 'club';
  fieldName: string;
}

export const AutoFillInput = forwardRef<HTMLInputElement, AutoFillInputProps>(({ 
  fieldType, 
  fieldName, 
  ...props 
}, ref) => {
  const { playerProfile, clubProfile } = useProfileContext();
  
  // Handle focus - auto-fill on focus if empty
  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    // Call original onFocus if provided
    if (props.onFocus) {
      props.onFocus(event);
    }
    
    const target = event.target as HTMLInputElement;
    if (!target || target.value) return;
    
    if (fieldType === 'player' && playerProfile && playerProfile[fieldName as keyof typeof playerProfile]) {
      const value = playerProfile[fieldName as keyof typeof playerProfile];
      if (value !== null && value !== undefined) {
        target.value = String(value);
        // Trigger both input and change events for React Hook Form
        const inputEvent = new Event('input', { bubbles: true });
        const changeEvent = new Event('change', { bubbles: true });
        target.dispatchEvent(inputEvent);
        target.dispatchEvent(changeEvent);
      }
    }
    
    if (fieldType === 'club' && clubProfile && clubProfile[fieldName as keyof typeof clubProfile]) {
      const value = clubProfile[fieldName as keyof typeof clubProfile];
      if (value !== null && value !== undefined) {
        target.value = String(value);
        // Trigger both input and change events for React Hook Form
        const inputEvent = new Event('input', { bubbles: true });
        const changeEvent = new Event('change', { bubbles: true });
        target.dispatchEvent(inputEvent);
        target.dispatchEvent(changeEvent);
      }
    }
  };
  
  return (
    <Input
      {...props}
      ref={ref}
      onFocus={handleFocus}
      data-autofill={fieldType}
      name={fieldName}
    />
  );
});

AutoFillInput.displayName = 'AutoFillInput';