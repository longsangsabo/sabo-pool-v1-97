import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CSRFContextType {
  token: string | null;
  isValid: boolean;
  refreshToken: () => Promise<void>;
}

const CSRFContext = createContext<CSRFContextType | null>(null);

export const useCSRF = () => {
  const context = useContext(CSRFContext);
  if (!context) {
    throw new Error('useCSRF must be used within a CSRFProvider');
  }
  return context;
};

interface CSRFProviderProps {
  children: React.ReactNode;
}

export const CSRFProvider: React.FC<CSRFProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);

  const generateToken = (): string => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };

  const refreshToken = async () => {
    try {
      const newToken = generateToken();
      
      // Store token in session storage (not localStorage for security)
      sessionStorage.setItem('csrf_token', newToken);
      
      // Validate token with backend if needed
      const { data: session } = await supabase.auth.getSession();
      if (session?.session) {
        setToken(newToken);
        setIsValid(true);
      } else {
        setIsValid(false);
        toast.error('Security token validation failed');
      }
    } catch (error) {
      console.error('CSRF token refresh failed:', error);
      setIsValid(false);
    }
  };

  useEffect(() => {
    refreshToken();
    
    // Refresh token every 30 minutes
    const interval = setInterval(refreshToken, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const value = {
    token,
    isValid,
    refreshToken
  };

  return (
    <CSRFContext.Provider value={value}>
      {children}
    </CSRFContext.Provider>
  );
};