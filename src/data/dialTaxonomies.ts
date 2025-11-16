// Dial Taxonomies - File-type-specific metadata dials

export interface DialDefinition {
  key: string;
  label: string;
  type: 'slider' | 'select';
  options?: string[];
  defaultValue: any;
  multiSelect?: boolean; // Allow multiple selections for select type
  sliderLabels?: { min: string; max: string }; // Semantic labels for slider endpoints
}

// Common dials - not used directly, replaced by semantic content-specific dials

// Food/Restaurant photos - TRIANGULATION: Heat Level + Cuisine + Occasion
export const foodDials: DialDefinition[] = [
  { 
    key: 'heat_level', 
    label: 'Heat Level', 
    type: 'slider', 
    defaultValue: 5,
    sliderLabels: { min: 'Mild', max: 'Fiery' }
  },
  { 
    key: 'cuisine', 
    label: 'Cuisine', 
    type: 'select', 
    multiSelect: true,
    options: ['italian', 'chinese', 'mexican', 'japanese', 'american', 'indian', 'thai', 'mediterranean', 'fusion', 'french', 'korean', 'vietnamese', 'other'], 
    defaultValue: [] 
  },
  { 
    key: 'occasion', 
    label: 'Occasion', 
    type: 'select',
    multiSelect: true,
    options: ['casual', 'fine-dining', 'comfort-food', 'healthy', 'indulgent', 'street-food', 'homemade', 'brunch', 'date-night', 'family', 'other'], 
    defaultValue: [] 
  },
];

// Music files - TRIANGULATION: Energy + Genre + Vibe
export const musicDials: DialDefinition[] = [
  { 
    key: 'energy', 
    label: 'Energy', 
    type: 'slider', 
    defaultValue: 5,
    sliderLabels: { min: '9pm (Background)', max: '2am (Peak Party)' }
  },
  { 
    key: 'genre', 
    label: 'Genre', 
    type: 'select',
    multiSelect: true,
    options: ['dance', 'hip-hop', 'pop', 'rock', 'electronic', 'jazz', 'classical', 'r&b', 'country', 'indie', 'metal', 'reggae', 'latin', 'k-pop', 'other'], 
    defaultValue: [] 
  },
  { 
    key: 'vibe', 
    label: 'Vibe', 
    type: 'select',
    multiSelect: true,
    options: ['inspired', 'club', 'studying', 'cooking', 'workout', 'relaxing', 'romantic', 'driving', 'focus', 'party', 'melancholic', 'uplifting', 'other'], 
    defaultValue: [] 
  },
];

// Location/Travel photos - TRIANGULATION: Atmosphere + Setting + Vibe
export const locationDials: DialDefinition[] = [
  { 
    key: 'atmosphere', 
    label: 'Atmosphere', 
    type: 'slider', 
    defaultValue: 5,
    sliderLabels: { min: 'Quiet Retreat', max: 'Bustling Venue' }
  },
  { 
    key: 'setting', 
    label: 'Setting', 
    type: 'select',
    multiSelect: true,
    options: ['restaurant', 'park', 'museum', 'beach', 'mountain', 'city', 'cafe', 'indoor', 'outdoor', 'venue', 'nature', 'historic', 'modern', 'other'], 
    defaultValue: [] 
  },
  { 
    key: 'vibe', 
    label: 'Vibe', 
    type: 'select',
    multiSelect: true,
    options: ['peaceful', 'lively', 'romantic', 'family-friendly', 'adventurous', 'cultural', 'relaxing', 'inspiring', 'touristy', 'hidden-gem', 'other'], 
    defaultValue: [] 
  },
];

// People/Social photos - TRIANGULATION: Group Energy + Activity + Vibe
export const peopleDials: DialDefinition[] = [
  { 
    key: 'group_energy', 
    label: 'Group Energy', 
    type: 'slider', 
    defaultValue: 5,
    sliderLabels: { min: 'Intimate/Quiet', max: 'Lively/Energetic' }
  },
  { 
    key: 'activity', 
    label: 'Activity', 
    type: 'select',
    multiSelect: true,
    options: ['casual', 'sports', 'celebration', 'work', 'travel', 'dining', 'entertainment', 'outdoor', 'event', 'party', 'family', 'other'], 
    defaultValue: [] 
  },
  { 
    key: 'vibe', 
    label: 'Vibe', 
    type: 'select',
    multiSelect: true,
    options: ['professional', 'casual', 'festive', 'intimate', 'fun', 'formal', 'relaxed', 'adventurous', 'nostalgic', 'other'], 
    defaultValue: [] 
  },
];

// Video files - TRIANGULATION: Stimulation + Content Type + Purpose
export const videoDials: DialDefinition[] = [
  { 
    key: 'stimulation', 
    label: 'Stimulation', 
    type: 'slider', 
    defaultValue: 5,
    sliderLabels: { min: 'Sleep/Meditation', max: 'Thriller/Horror' }
  },
  { 
    key: 'content_type', 
    label: 'Content Type', 
    type: 'select',
    multiSelect: true,
    options: ['entertainment', 'educational', 'vlog', 'documentary', 'tutorial', 'music-video', 'sports', 'comedy', 'drama', 'action', 'animation', 'news', 'other'], 
    defaultValue: [] 
  },
  { 
    key: 'purpose', 
    label: 'Purpose', 
    type: 'select',
    multiSelect: true,
    options: ['inspiring', 'relaxing', 'exciting', 'informative', 'funny', 'dramatic', 'atmospheric', 'background', 'learning', 'entertainment', 'sleep', 'focus', 'other'], 
    defaultValue: [] 
  },
];

// Document files (PDFs, etc.) - TRIANGULATION: Urgency + Category + Access Frequency
export const documentDials: DialDefinition[] = [
  { 
    key: 'urgency', 
    label: 'Urgency', 
    type: 'slider', 
    defaultValue: 5,
    sliderLabels: { min: 'Archive', max: 'Critical' }
  },
  { 
    key: 'category', 
    label: 'Category', 
    type: 'select',
    multiSelect: true,
    options: ['personal', 'work', 'financial', 'legal', 'educational', 'reference', 'creative', 'medical', 'travel', 'contracts', 'other'], 
    defaultValue: [] 
  },
  { 
    key: 'access_frequency', 
    label: 'Access Frequency', 
    type: 'select',
    multiSelect: false,
    options: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'archive', 'one-time'], 
    defaultValue: 'monthly' 
  },
];

// Generic image dials (fallback) - TRIANGULATION: Visual Energy + Subject + Context
export const imageDials: DialDefinition[] = [
  { 
    key: 'visual_energy', 
    label: 'Visual Energy', 
    type: 'slider', 
    defaultValue: 5,
    sliderLabels: { min: 'Calm/Serene', max: 'Vibrant/Dynamic' }
  },
  { 
    key: 'subject', 
    label: 'Subject', 
    type: 'select',
    multiSelect: true,
    options: ['landscape', 'portrait', 'food', 'architecture', 'nature', 'urban', 'abstract', 'product', 'animal', 'event', 'art', 'other'], 
    defaultValue: [] 
  },
  { 
    key: 'context', 
    label: 'Context', 
    type: 'select',
    multiSelect: true,
    options: ['professional', 'casual', 'artistic', 'nostalgic', 'energetic', 'peaceful', 'dramatic', 'playful', 'inspirational', 'documentary', 'other'], 
    defaultValue: [] 
  },
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

  // Default to generic image dials for unknown types
  return imageDials;
}
