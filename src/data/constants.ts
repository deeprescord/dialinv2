// Constants and dial group definitions for Dialin V3

export const VIDEO_TYPES = ['Sci-Fi', 'Music Video', 'Documentary', 'Tech', 'Comedy', 'Drama'];
export const MUSIC_TYPES = ['Electronic', 'Pop', 'Ambient', 'Bass', 'Rock', 'Hip Hop'];
export const LOCATION_TYPES = ['Café', 'Park', 'Plaza', 'District', 'Mall', 'Beach'];
export const VIBES = ['Dark', 'Energetic', 'Contemplative', 'Futuristic', 'Chill', 'Uplifting'];
export const DECADES = ['1990s', '2000s', '2010s', '2020s'];
export const ENERGY = ['Low', 'Medium', 'High'];

export interface DialGroup {
  key: string;
  label: string;
  options: string[];
}

export const VIDEO_GROUPS: DialGroup[] = [
  { key: 'type', label: 'Type', options: VIDEO_TYPES },
  { key: 'vibe', label: 'Vibe', options: VIBES },
  { key: 'decade', label: 'Decade', options: DECADES },
  { key: 'energy', label: 'Energy', options: ENERGY },
];

export const MUSIC_GROUPS: DialGroup[] = [
  { key: 'type', label: 'Genre', options: MUSIC_TYPES },
  { key: 'vibe', label: 'Vibe', options: VIBES },
  { key: 'decade', label: 'Decade', options: DECADES },
  { key: 'energy', label: 'Energy', options: ENERGY },
];

export const LOCATION_GROUPS: DialGroup[] = [
  { key: 'type', label: 'Type', options: LOCATION_TYPES },
];

// Share toggle types with their colors and icons
export interface ShareToggle {
  key: string;
  label: string;
  color: string;
  icon: string;
}

export const SHARE_TOGGLES: ShareToggle[] = [
  { key: 'personal', label: 'Personal Cell', color: 'share-personal', icon: 'Smartphone' },
  { key: 'workAddress', label: 'Work Address', color: 'share-work-address', icon: 'Building' },
  { key: 'workPhone', label: 'Work Phone', color: 'share-work-phone', icon: 'Phone' },
  { key: 'workEmail', label: 'Work Email', color: 'share-work-email', icon: 'Mail' },
  { key: 'homeAddress', label: 'Home Address', color: 'share-home-address', icon: 'Home' },
];