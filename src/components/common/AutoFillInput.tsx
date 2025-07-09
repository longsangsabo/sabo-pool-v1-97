import React, { forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { useProfileContext } from '@/contexts/ProfileContext';

interface AutoFillInputProps extends React.ComponentProps<typeof Input> {
  fieldType: 'player' | 'club';
  fieldName: string;
  onAutoFill?: (value: string) => void;
}

export const AutoFillInput = forwardRef<HTMLInputElement, AutoFillInputProps>(({ 
  fieldType, 
  fieldName, 
  onAutoFill,
  onChange,
  ...props 
}, ref) => {
  const { playerProfile, clubProfile } = useProfileContext();
  
  // Handle manual input changes
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(event);
    }
  };
  
  // Handle focus - auto-fill on focus if empty
  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    // Call original onFocus if provided
    if (props.onFocus) {
      props.onFocus(event);
    }
    
    const target = event.target as HTMLInputElement;
    if (!target || target.value) return;
    
    let autoFillValue = '';
    
    if (fieldType === 'player' && playerProfile && playerProfile[fieldName as keyof typeof playerProfile]) {
      const value = playerProfile[fieldName as keyof typeof playerProfile];
      if (value !== null && value !== undefined) {
        autoFillValue = String(value);
      }
    }
    
    if (fieldType === 'club' && clubProfile && clubProfile[fieldName as keyof typeof clubProfile]) {
      const value = clubProfile[fieldName as keyof typeof clubProfile];
      if (value !== null && value !== undefined) {
        autoFillValue = String(value);
      }
    }
    
    if (autoFillValue && onAutoFill) {
      onAutoFill(autoFillValue);
    }
  };
  
  return (
    <Input
      {...props}
      ref={ref}
      onChange={handleChange}
      onFocus={handleFocus}
      data-autofill={fieldType}
    />
  );
});

AutoFillInput.displayName = 'AutoFillInput';