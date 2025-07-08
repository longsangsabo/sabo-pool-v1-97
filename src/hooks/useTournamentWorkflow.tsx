import { useState, useCallback } from 'react';

export interface WorkflowState {
  currentStep: number;
  completedSteps: number[];
  selectedTournament: string | null;
  testResults: {
    demoUserSetup?: any;
    bracketVerification?: any;
    matchReporting?: any;
    tournamentProgression?: any;
    adminControls?: any;
    userExperience?: any;
    scaleTesting?: any;
    dataCleanup?: any;
  };
  workflowStatus: 'not_started' | 'in_progress' | 'completed';
  sharedData: {
    tournament?: any;
    bracket?: any[];
    seeding?: any[];
    matches?: any[];
    participants?: any[];
  };
}

const initialState: WorkflowState = {
  currentStep: 1,
  completedSteps: [],
  selectedTournament: null,
  testResults: {},
  workflowStatus: 'not_started',
  sharedData: {}
};

export const useTournamentWorkflow = () => {
  const [state, setState] = useState<WorkflowState>(initialState);

  const updateSharedData = useCallback((key: keyof WorkflowState['sharedData'], data: any) => {
    setState(prev => ({
      ...prev,
      sharedData: {
        ...prev.sharedData,
        [key]: data
      }
    }));
  }, []);

  const completeStep = useCallback((stepNumber: number, results: any) => {
    setState(prev => ({
      ...prev,
      completedSteps: [...prev.completedSteps.filter(s => s !== stepNumber), stepNumber],
      testResults: { 
        ...prev.testResults, 
        [getStepKey(stepNumber)]: results 
      },
      currentStep: stepNumber < 8 ? stepNumber + 1 : stepNumber,
      workflowStatus: stepNumber === 8 ? 'completed' : 'in_progress'
    }));
  }, []);

  const goToStep = useCallback((stepNumber: number) => {
    if (canProceedToStep(stepNumber)) {
      setState(prev => ({
        ...prev,
        currentStep: stepNumber
      }));
    }
  }, []);

  const canProceedToStep = useCallback((stepNumber: number): boolean => {
    if (stepNumber === 1) return true;
    
    // Check dependencies
    const dependencies = getStepDependencies(stepNumber);
    return dependencies.every(dep => state.completedSteps.includes(dep));
  }, [state.completedSteps]);

  const resetWorkflow = useCallback(() => {
    setState(initialState);
  }, []);

  const setSelectedTournament = useCallback((tournamentId: string | null) => {
    setState(prev => ({
      ...prev,
      selectedTournament: tournamentId,
      workflowStatus: tournamentId ? 'in_progress' : 'not_started'
    }));
  }, []);

  return {
    state,
    completeStep,
    goToStep,
    canProceedToStep,
    resetWorkflow,
    setSelectedTournament,
    updateSharedData
  };
};

const getStepKey = (stepNumber: number): keyof WorkflowState['testResults'] => {
  const stepKeys = [
    'demoUserSetup',
    'bracketVerification',
    'matchReporting', 
    'tournamentProgression',
    'adminControls',
    'userExperience',
    'scaleTesting',
    'dataCleanup'
  ];
  return stepKeys[stepNumber - 1] as keyof WorkflowState['testResults'];
};

const getStepDependencies = (stepNumber: number): number[] => {
  const dependencies: { [key: number]: number[] } = {
    1: [], // Demo User Setup (no dependencies)
    2: [1], // Tournament Selection & Bracket Verification (needs demo users)
    3: [1, 2], // Match Reporting Test (needs demo users + bracket)
    4: [1, 2, 3], // Tournament Progression (needs demo users + bracket + match reporting)
    5: [1, 2], // Admin Controls (needs demo users + tournament)
    6: [1, 2], // User Experience Test (needs demo users + tournament)
    7: [1, 2, 3, 4], // Scale Testing (needs basic functionality)
    8: [1, 2, 3, 4, 5, 6, 7] // Data Cleanup (needs all previous steps)
  };
  return dependencies[stepNumber] || [];
};