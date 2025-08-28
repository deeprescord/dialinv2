// Filtering logic for dial selections

export function applyDials<T>(
  items: T[],
  dials: Record<string, string[]>,
  mapItemToFields: (item: T) => Record<string, string>
): T[] {
  if (Object.keys(dials).length === 0) {
    return items;
  }

  return items.filter(item => {
    const itemFields = mapItemToFields(item);
    
    // AND across groups, OR within groups
    return Object.entries(dials).every(([groupKey, selectedValues]) => {
      if (selectedValues.length === 0) return true;
      
      const itemValue = itemFields[groupKey];
      return selectedValues.includes(itemValue);
    });
  });
}

// Helper function to format numbers for $DIAL display
export function formatDialCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k`;
  }
  return count.toString();
}

// Helper function to format storage display
export function formatStorageUsed(usedGB: number, totalTB: number): string {
  const totalGB = totalTB * 1000;
  const percentage = (usedGB / totalGB) * 100;
  return {
    used: `${usedGB} GB`,
    total: `${totalTB} TB`,
    percentage: Math.round(percentage)
  } as any;
}