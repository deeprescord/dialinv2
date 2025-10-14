import { createContext, useContext, ReactNode } from 'react';
import { useSpaces, Space } from '@/hooks/useSpaces';

interface SpacesContextType {
  spaces: Space[];
  loading: boolean;
  createSpace: (name: string, description?: string, parentId?: string) => Promise<Space | null>;
  updateSpace: (id: string, updates: Partial<Pick<Space, 'name' | 'description' | 'cover_url' | 'show_360' | 'x_axis_offset' | 'y_axis_offset' | 'volume' | 'is_muted' | 'rotation_enabled' | 'rotation_speed' | 'rotation_axis' | 'horizontal_flip' | 'vertical_flip'>>, options?: { silent?: boolean }) => Promise<boolean>;
  deleteSpace: (id: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

const SpacesContext = createContext<SpacesContextType | undefined>(undefined);

export function SpacesProvider({ children }: { children: ReactNode }) {
  const spacesData = useSpaces();
  
  return (
    <SpacesContext.Provider value={spacesData}>
      {children}
    </SpacesContext.Provider>
  );
}

export function useSpacesContext() {
  const context = useContext(SpacesContext);
  if (context === undefined) {
    throw new Error('useSpacesContext must be used within a SpacesProvider');
  }
  return context;
}
