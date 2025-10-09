// Dial Taxonomies - File-type-specific metadata dials

export interface DialDefinition {
  key: string;
  label: string;
  type: 'slider' | 'select';
  options?: string[];
  defaultValue: any;
}

// Common dials for all content
export const commonDials: DialDefinition[] = [
  { key: 'mood', label: 'Mood', type: 'select', options: ['happy', 'sad', 'calm', 'excited', 'angry', 'peaceful', 'neutral'], defaultValue: 'neutral' },
  { key: 'vibe', label: 'Vibe', type: 'select', options: ['chill', 'energetic', 'dark', 'uplifting', 'contemplative', 'futuristic', 'neutral'], defaultValue: 'neutral' },
  { key: 'energy', label: 'Energy Level', type: 'slider', defaultValue: 5 },
];

// Food/Restaurant photos
export const foodDials: DialDefinition[] = [
  ...commonDials,
  { key: 'spiciness', label: 'Spiciness', type: 'slider', defaultValue: 5 },
  { key: 'richness', label: 'Richness', type: 'slider', defaultValue: 5 },
  { key: 'presentation', label: 'Presentation', type: 'slider', defaultValue: 7 },
  { key: 'price_range', label: 'Price Range', type: 'select', options: ['$', '$$', '$$$', '$$$$'], defaultValue: '$$' },
  { key: 'cuisine', label: 'Cuisine Type', type: 'select', options: ['italian', 'chinese', 'mexican', 'japanese', 'american', 'indian', 'thai', 'other'], defaultValue: 'other' },
];

// Music files
export const musicDials: DialDefinition[] = [
  ...commonDials,
  { key: 'tempo', label: 'Tempo', type: 'slider', defaultValue: 5 },
  { key: 'genre', label: 'Genre', type: 'select', options: ['rock', 'pop', 'jazz', 'classical', 'electronic', 'hip-hop', 'country', 'r&b', 'other'], defaultValue: 'other' },
  { key: 'acousticness', label: 'Acousticness', type: 'slider', defaultValue: 5 },
  { key: 'danceability', label: 'Danceability', type: 'slider', defaultValue: 5 },
  { key: 'decade', label: 'Decade', type: 'select', options: ['1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s'], defaultValue: '2020s' },
];

// Location/Travel photos
export const locationDials: DialDefinition[] = [
  ...commonDials,
  { key: 'atmosphere', label: 'Atmosphere', type: 'slider', defaultValue: 5 },
  { key: 'noise_level', label: 'Noise Level', type: 'slider', defaultValue: 5 },
  { key: 'lighting', label: 'Lighting Quality', type: 'slider', defaultValue: 5 },
  { key: 'crowd_size', label: 'Crowd Size', type: 'slider', defaultValue: 5 },
  { key: 'location_type', label: 'Location Type', type: 'select', options: ['restaurant', 'park', 'museum', 'beach', 'mountain', 'city', 'indoor', 'outdoor', 'other'], defaultValue: 'other' },
];

// People/Social photos
export const peopleDials: DialDefinition[] = [
  ...commonDials,
  { key: 'group_size', label: 'Group Size', type: 'slider', defaultValue: 1 },
  { key: 'activity', label: 'Activity', type: 'select', options: ['casual', 'sports', 'celebration', 'work', 'travel', 'dining', 'entertainment', 'other'], defaultValue: 'casual' },
  { key: 'formality', label: 'Formality', type: 'slider', defaultValue: 5 },
];

// Video files
export const videoDials: DialDefinition[] = [
  ...commonDials,
  { key: 'production_quality', label: 'Production Quality', type: 'slider', defaultValue: 5 },
  { key: 'video_type', label: 'Video Type', type: 'select', options: ['documentary', 'vlog', 'tutorial', 'music-video', 'short-film', 'animation', 'other'], defaultValue: 'other' },
  { key: 'decade', label: 'Era', type: 'select', options: ['1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s'], defaultValue: '2020s' },
];

// Document files (PDFs, etc.)
export const documentDials: DialDefinition[] = [
  { key: 'importance', label: 'Importance', type: 'slider', defaultValue: 5 },
  { key: 'document_type', label: 'Document Type', type: 'select', options: ['personal', 'work', 'financial', 'legal', 'educational', 'reference', 'other'], defaultValue: 'other' },
  { key: 'urgency', label: 'Urgency', type: 'slider', defaultValue: 3 },
];

// Generic image dials (fallback)
export const imageDials: DialDefinition[] = [
  ...commonDials,
  { key: 'quality', label: 'Quality', type: 'slider', defaultValue: 7 },
  { key: 'subject', label: 'Subject', type: 'select', options: ['landscape', 'portrait', 'food', 'architecture', 'nature', 'urban', 'abstract', 'other'], defaultValue: 'other' },
];

// Get appropriate dial taxonomy based on file type and detected content
export function getDialTaxonomy(fileType: string, mimeType: string, detectedContent?: string): DialDefinition[] {
  // Music files
  if (fileType === 'audio' || mimeType.startsWith('audio/')) {
    return musicDials;
  }

  // Video files
  if (fileType === 'video' || mimeType.startsWith('video/')) {
    return videoDials;
  }

  // Documents
  if (fileType === 'document' || mimeType.includes('pdf') || mimeType.includes('document')) {
    return documentDials;
  }

  // Images - determine context
  if (fileType === 'image' || mimeType.startsWith('image/')) {
    const content = (detectedContent || '').toLowerCase();
    
    // Check for food-related content
    if (content.includes('food') || content.includes('restaurant') || content.includes('meal') || 
        content.includes('dish') || content.includes('cuisine') || content.includes('plate')) {
      return foodDials;
    }

    // Check for people-related content
    if (content.includes('people') || content.includes('person') || content.includes('group') || 
        content.includes('face') || content.includes('portrait') || content.includes('selfie')) {
      return peopleDials;
    }

    // Check for location-related content
    if (content.includes('location') || content.includes('place') || content.includes('landscape') || 
        content.includes('building') || content.includes('city') || content.includes('park') ||
        content.includes('beach') || content.includes('mountain')) {
      return locationDials;
    }

    // Fallback to generic image dials
    return imageDials;
  }

  // Default to common dials
  return commonDials;
}
