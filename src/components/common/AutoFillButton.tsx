import React from 'react';
import { Button } from '@/components/ui/button';
import { useAutoFill } from '@/hooks/useAutoFill';
import { User, Building, Zap } from 'lucide-react';

interface AutoFillButtonProps {
  formRef?: React.RefObject<HTMLFormElement>;
  type: 'player' | 'club' | 'all';
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  onClick?: () => void;
  disabled?: boolean;
}

export const AutoFillButton: React.FC<AutoFillButtonProps> = ({ 
  formRef, 
  type, 
  className = '',
  size = 'default',
  variant = 'outline',
  onClick,
  disabled
}) => {
  const { autoFillPlayerInfo, autoFillClubInfo, autoFillAll, hasPlayerProfile, hasClubProfile } = useAutoFill();
  
  // Determine button state based on type and available profiles
  const isDisabled = disabled ?? (
    (type === 'player' && !hasPlayerProfile) || 
    (type === 'club' && !hasClubProfile) ||
    (type === 'all' && !hasPlayerProfile)
  );
  
  // Determine button text and icon
  const getButtonContent = () => {
    switch (type) {
      case 'player': 
        return {
          text: 'Điền thông tin cá nhân',
          icon: <User className="h-4 w-4" />
        };
      case 'club': 
        return {
          text: 'Điền thông tin CLB',
          icon: <Building className="h-4 w-4" />
        };
      case 'all': 
        return {
          text: 'Tự động điền thông tin',
          icon: <Zap className="h-4 w-4" />
        };
      default: 
        return {
          text: 'Tự động điền',
          icon: <Zap className="h-4 w-4" />
        };
    }
  };
  
  const { text, icon } = getButtonContent();
  
  // Handle click
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (formRef) {
      switch (type) {
        case 'player':
          autoFillPlayerInfo(formRef);
          break;
        case 'club':
          autoFillClubInfo(formRef);
          break;
        case 'all':
          autoFillAll(formRef);
          break;
      }
    }
  };
  
  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      className={`auto-fill-button ${className}`}
      variant={variant}
      size={size}
    >
      {icon}
      <span className="ml-2">{text}</span>
    </Button>
  );
};