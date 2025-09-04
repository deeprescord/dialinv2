import React from 'react';
import { motion } from 'framer-motion';
import { FeaturedLocationHeader } from './FeaturedLocationHeader';
import { DialsBarCompact } from './DialsBarCompact';
import { SelectedChips } from './SelectedChips';
import { MediaGrid } from './MediaGrid';
import { FloorsTab } from './FloorsTab';
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
  const featuredLocation = locations[0];
  const remainingLocations = locations.slice(1);
  
  const locationGridItems = remainingLocations.map(item => ({
    ...item,
    title: item.name,
    sharedBy: item.distance
  }));

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="pt-40 lg:pt-28 pb-32" // Increased bottom padding for floors bar
      >
        {/* Featured Location Header */}
        {featuredLocation && (
          <FeaturedLocationHeader
            location={featuredLocation}
            locations={locations}
            onLocationClick={onLocationClick}
          />
        )}

        <SelectedChips 
          selectedDials={selectedDials}
          onRemoveChip={(groupKey, option) => onDialToggle(groupKey, option)}
        />

        <DialsBarCompact
          dialGroups={LOCATION_GROUPS}
          selectedDials={selectedDials}
          onDialToggle={onDialToggle}
          onClearAll={onClearAll}
        />

        <div className="px-4 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-white">More Locations</h2>
        </div>

        <MediaGrid
          items={locationGridItems}
          onItemClick={onLocationClick}
          onItemLongPress={onLocationLongPress}
        />
      </motion.div>
      
      {/* Fixed Floors Tab at Bottom - Outside the main container */}
      <FloorsTab />
    </>
  );
}