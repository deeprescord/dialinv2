import { createContext, useContext, ReactNode } from 'react';
import { useInteractionRole, InteractionRole } from '@/hooks/useInteractionRole';

interface InteractionContextType {
  role: InteractionRole;
  pValue: number;
  interactionPotential: number;
  loading: boolean;
  setUserRole: (role: InteractionRole) => Promise<void>;
  refetch: () => Promise<void>;
}

const InteractionContext = createContext<InteractionContextType | undefined>(undefined);

export function InteractionProvider({ children }: { children: ReactNode }) {
  const interactionData = useInteractionRole();
  
  return (
    <InteractionContext.Provider value={interactionData}>
      {children}
    </InteractionContext.Provider>
  );
}

export function useInteractionContext() {
  const context = useContext(InteractionContext);
  if (context === undefined) {
    throw new Error('useInteractionContext must be used within an InteractionProvider');
  }
  return context;
}
