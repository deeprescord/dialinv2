import React from 'react';
import { motion } from 'framer-motion';
import { DialsBar } from './DialsBar';
import { SelectedChips } from './SelectedChips';
import { MediaGrid } from './MediaGrid';
import { LocationItem } from '@/data/catalogs';
import { LOCATION_GROUPS } from '@/data/constants';

interface LocationsViewProps {
  locations: LocationItem[];
  selectedDials: Record<string, string[]>;
  onDialToggle: (groupKey: string, option: string) => void;
  onClearAll: () => void;
  onLocationClick: (location: LocationItem) => void;
  onLocationLongPress: (location: LocationItem) => void;
}

export function LocationsView({
  locations,
  selectedDials,
  onDialToggle,
  onClearAll,
  onLocationClick,
  onLocationLongPress
}: LocationsViewProps) {
  const locationGridItems = locations.map(item => ({
    ...item,
    title: item.name,
    sharedBy: item.distance
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="pt-32 lg:pt-28 pb-20"
    >
      <SelectedChips 
        selectedDials={selectedDials}
        onRemoveChip={(groupKey, option) => onDialToggle(groupKey, option)}
      />

      <DialsBar
        dialGroups={LOCATION_GROUPS}
        selectedDials={selectedDials}
        onDialToggle={onDialToggle}
        onClearAll={onClearAll}
      />

      <MediaGrid
        items={locationGridItems}
        onItemClick={onLocationClick}
        onItemLongPress={onLocationLongPress}
      />
    </motion.div>
  );
}