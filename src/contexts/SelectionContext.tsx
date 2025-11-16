import { createContext, useContext, useState, ReactNode } from 'react';

export type SelectionItem = {
  id: string;
  type: 'space' | 'file';
  name: string;
  thumbnailUrl?: string;
  isSpace: boolean;
};

interface SelectionContextType {
  isSelectMode: boolean;
  selectedItems: SelectionItem[];
  toggleSelectMode: () => void;
  addToSelection: (item: SelectionItem) => void;
  removeFromSelection: (id: string) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<SelectionItem[]>([]);

  const toggleSelectMode = () => {
    setIsSelectMode(prev => !prev);
    if (isSelectMode) {
      setSelectedItems([]);
    }
  };

  const addToSelection = (item: SelectionItem) => {
    setSelectedItems(prev => {
      if (prev.find(i => i.id === item.id)) return prev;
      return [...prev, item];
    });
  };

  const removeFromSelection = (id: string) => {
    setSelectedItems(prev => prev.filter(i => i.id !== id));
  };

  const clearSelection = () => {
    setSelectedItems([]);
    setIsSelectMode(false);
  };

  const isSelected = (id: string) => {
    return selectedItems.some(i => i.id === id);
  };

  return (
    <SelectionContext.Provider
      value={{
        isSelectMode,
        selectedItems,
        toggleSelectMode,
        addToSelection,
        removeFromSelection,
        clearSelection,
        isSelected,
      }}
    >
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error('useSelection must be used within SelectionProvider');
  }
  return context;
}
