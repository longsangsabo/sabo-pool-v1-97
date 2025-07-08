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
      currentStep: stepNumber < 7 ? stepNumber + 1 : stepNumber,
      workflowStatus: stepNumber === 7 ? 'completed' : 'in_progress'
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
    'bracketVerification', // Step 1: Tournament Selection & Bracket Verification
    'matchReporting',      // Step 2: Match Reporting Test
    'tournamentProgression', // Step 3: Tournament Progression
    'adminControls',       // Step 4: Admin Controls
    'userExperience',      // Step 5: User Experience Test
    'scaleTesting',        // Step 6: Scale Testing
    'dataCleanup'          // Step 7: Data Cleanup
  ];
  return stepKeys[stepNumber - 1] as keyof WorkflowState['testResults'];
};

const getStepDependencies = (stepNumber: number): number[] => {
  const dependencies: { [key: number]: number[] } = {
    1: [], // Tournament Selection & Bracket Verification (no dependencies)
    2: [1], // Match Reporting Test (needs bracket from step 1)
    3: [1, 2], // Tournament Progression (needs bracket + match reporting)
    4: [1], // Admin Controls (needs tournament selection)
    5: [1], // User Experience Test (needs tournament selection)
    6: [1, 2, 3], // Scale Testing (needs basic functionality)
    7: [1, 2, 3, 4, 5, 6] // Data Cleanup (needs all previous steps)
  };
  return dependencies[stepNumber] || [];
};