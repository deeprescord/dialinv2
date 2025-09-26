// Constants and dial group definitions for Dialin V3

export const VIDEO_TYPES = ['Documentary', 'Tutorial', 'Entertainment', 'News', 'Review'];
export const VIDEO_TOPICS = ['Technology', 'Art', 'Science', 'Culture', 'Business', 'Gaming'];
export const VIDEO_BIASES = ['Objective', 'Opinion', 'Educational', 'Commercial', 'Personal'];
export const VIDEO_REGIONS = ['Global', 'North America', 'Europe', 'Asia', 'Other'];

export const MUSIC_GENRES = ['Electronic', 'Pop', 'Ambient', 'Bass', 'Rock', 'Hip Hop', 'Jazz', 'Classical'];
export const MUSIC_VIBES = ['Dark', 'Energetic', 'Contemplative', 'Futuristic', 'Chill', 'Uplifting'];
export const MUSIC_DECADES = ['1990s', '2000s', '2010s', '2020s'];
export const MUSIC_ENERGY = ['Low', 'Medium', 'High'];

export const LOCATION_TYPES = ['Café', 'Park', 'Plaza', 'District', 'Mall', 'Beach'];

export interface DialGroup {
  key: string;
  label: string;
  options: string[];
}

export const VIDEO_FILTERS: DialGroup[] = [
  { key: 'type', label: 'Type', options: VIDEO_TYPES },
  { key: 'topic', label: 'Topic', options: VIDEO_TOPICS },
  { key: 'bias', label: 'Bias', options: VIDEO_BIASES },
  { key: 'region', label: 'Region', options: VIDEO_REGIONS },
];

export const MUSIC_FILTERS: DialGroup[] = [
  { key: 'energy', label: 'Energy', options: MUSIC_ENERGY },
  { key: 'genre', label: 'Genre', options: MUSIC_GENRES },
  { key: 'decade', label: 'Decade', options: MUSIC_DECADES },
  { key: 'vibe', label: 'Vibe', options: MUSIC_VIBES },
];

// Legacy groups for backward compatibility
export const VIDEO_GROUPS: DialGroup[] = VIDEO_FILTERS;
export const MUSIC_GROUPS: DialGroup[] = MUSIC_FILTERS;

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
  { key: 'workEmail', label: 'Work Email', color: 'share-work-email', icon: 'Mail' },
  { key: 'homeAddress', label: 'Home Address', color: 'share-home-address', icon: 'Home' },
  { key: 'resume', label: 'Resume', color: 'share-resume', icon: 'FileText' },
  { key: 'instagram', label: 'Instagram', color: 'share-instagram', icon: 'Instagram' },
  { key: 'driversLicense', label: 'Driver\'s License', color: 'share-drivers-license', icon: 'CreditCard' },
  { key: 'medicalHistory', label: 'Medical History', color: 'share-medical', icon: 'Heart' },
  { key: 'insurance', label: 'Insurance', color: 'share-insurance', icon: 'Shield' },
];