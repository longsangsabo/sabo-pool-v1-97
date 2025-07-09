import React, { useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { useProfileContext } from '@/contexts/ProfileContext';

interface AutoFillInputProps extends React.ComponentProps<typeof Input> {
  fieldType: 'player' | 'club';
  fieldName: string;
}

export const AutoFillInput: React.FC<AutoFillInputProps> = ({ 
  fieldType, 
  fieldName, 
  ...props 
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { playerProfile, clubProfile } = useProfileContext();
  
  // Handle focus - auto-fill on focus if empty
  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    // Call original onFocus if provided
    if (props.onFocus) {
      props.onFocus(event);
    }
    
    if (!inputRef.current || inputRef.current.value) return;
    
    if (fieldType === 'player' && playerProfile && playerProfile[fieldName as keyof typeof playerProfile]) {
      const value = playerProfile[fieldName as keyof typeof playerProfile];
      if (value !== null && value !== undefined) {
        inputRef.current.value = String(value);
        // Trigger input event for React form libraries
        const inputEvent = new Event('input', { bubbles: true });
        inputRef.current.dispatchEvent(inputEvent);
      }
    }
    
    if (fieldType === 'club' && clubProfile && clubProfile[fieldName as keyof typeof clubProfile]) {
      const value = clubProfile[fieldName as keyof typeof clubProfile];
      if (value !== null && value !== undefined) {
        inputRef.current.value = String(value);
        // Trigger input event
        const inputEvent = new Event('input', { bubbles: true });
        inputRef.current.dispatchEvent(inputEvent);
      }
    }
  };
  
  return (
    <Input
      {...props}
      ref={inputRef}
      onFocus={handleFocus}
      data-autofill={fieldType}
      name={fieldName}
    />
  );
};