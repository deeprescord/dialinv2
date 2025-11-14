import { createContext, useContext, ReactNode } from 'react';
import { useInteractionRole, InteractionRole } from '@/hooks/useInteractionRole';

interface InteractionContextType {
  role: InteractionRole;
  pValue: number;
  interactionPotential: number;
  loading: boolean;
  updateRole: (role: InteractionRole) => Promise<void>;
}

const InteractionContext = createContext<InteractionContextType | undefined>(undefined);

export function InteractionProvider({ children }: { children: ReactNode }) {
  const interaction = useInteractionRole();

  return (
    <InteractionContext.Provider value={interaction}>
      {children}
    </InteractionContext.Provider>
  );
}

export function useInteraction() {
  const context = useContext(InteractionContext);
  if (!context) {
    throw new Error('useInteraction must be used within InteractionProvider');
  }
  return context;
}
