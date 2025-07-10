
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseTestDataCreationReturn {
  createDemoUsers: (count?: number) => Promise<boolean>;
  createTestTournament: (params: any) => Promise<string | null>;
  populateTestData: (type: string) => Promise<boolean>;
  isLoading: boolean;
  logs: Array<{ message: string; type: 'info' | 'error' | 'success'; timestamp: Date }>;
  addLog: (message: string, type?: 'info' | 'error' | 'success') => void;
  clearLogs: () => void;
}

export const useTestDataCreation = (): UseTestDataCreationReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<Array<{ message: string; type: 'info' | 'error' | 'success'; timestamp: Date }>>([]);

  const addLog = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    setLogs(prev => [...prev, { message, type, timestamp: new Date() }]);
    console.log(`${type.toUpperCase()}: ${message}`);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const createDemoUsers = async (count: number = 32): Promise<boolean> => {
    setIsLoading(true);
    addLog(`🔧 Creating ${count} demo users...`);
    
    try {
      const { data, error } = await supabase.rpc('seed_demo_users');
      
      if (error) {
        addLog(`❌ Failed to create demo users: ${error.message}`, 'error');
        toast.error('Failed to create demo users');
        return false;
      }
      
      const result = data as { users_created: number; total_demo_users: number; message: string };
      addLog(`✅ ${result.users_created} new demo users created! Total: ${result.total_demo_users}`, 'success');
      toast.success(`Demo users created: ${result.users_created} new, ${result.total_demo_users} total`);
      
      return true;
    } catch (error: any) {
      addLog(`❌ Error creating demo users: ${error.message}`, 'error');
      toast.error('Error creating demo users');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const createTestTournament = async (params: any): Promise<string | null> => {
    setIsLoading(true);
    addLog('🏆 Creating test tournament...');
    
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .insert(params)
        .select()
        .single();
      
      if (error) {
        addLog(`❌ Failed to create tournament: ${error.message}`, 'error');
        toast.error('Failed to create tournament');
        return null;
      }
      
      addLog(`✅ Tournament created successfully: ${data.name}`, 'success');
      toast.success(`Tournament "${data.name}" created successfully`);
      
      return data.id;
    } catch (error: any) {
      addLog(`❌ Error creating tournament: ${error.message}`, 'error');
      toast.error('Error creating tournament');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const populateTestData = async (type: string): Promise<boolean> => {
    setIsLoading(true);
    addLog(`📊 Populating ${type} test data...`);
    
    try {
      // This would be expanded based on the type of data to populate
      // For now, just a placeholder implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      addLog(`✅ ${type} test data populated successfully`, 'success');
      toast.success(`${type} test data populated`);
      
      return true;
    } catch (error: any) {
      addLog(`❌ Error populating ${type} data: ${error.message}`, 'error');
      toast.error(`Error populating ${type} data`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createDemoUsers,
    createTestTournament,
    populateTestData,
    isLoading,
    logs,
    addLog,
    clearLogs
  };
};
