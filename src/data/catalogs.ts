// Mock data for Dialin V3 Portal
import grandTheaterPoster from '@/assets/grand-theater-poster.jpg';
import videoThumbnails from '@/assets/video-thumbnails.jpg';
import musicCollection from '@/assets/music-collection.jpg';
import locationShowcase from '@/assets/location-showcase.jpg';
import userAvatarsSet from '@/assets/user-avatars-set.jpg';
import featuredVideoBg from '@/assets/featured-video-bg.jpg';

export interface VideoItem {
  id: string;
  title: string;
  duration: string;
  thumb: string;
  sharedBy: string;
  sharedByAvatar: string;
  type: string;
  vibe: string;
  decade: string;
  energy: string;
}

export interface MusicItem {
  id: string;
  title: string;
  artist: string;
  length: string;
  art: string;
  type: string;
  vibe: string;
  decade: string;
  energy: string;
}

export interface Friend {
  id: string;
  name: string;
  status: 'online' | 'away' | 'offline';
  avatar: string;
}

export interface LocationItem {
  id: string;
  name: string;
  type: string;
  distance: string;
  thumb: string;
}

export interface Space {
  id: string;
  name: string;
  thumb: string;
  backgroundImage?: string;
  show360?: boolean;
  description?: string;
  xAxis?: number;
  yAxis?: number;
  volume?: number;
  isMuted?: boolean;
  parentId?: string; // For nested spaces
}

export interface Post {
  id: string;
  title: string;
  sharedBy: string;
  sharedByAvatar: string;
  type: 'video' | 'music' | 'location';
  thumb: string;
  duration?: string;
}

// Sample Unsplash IDs for consistent, curated content
const UNSPLASH_IDS = {
  cinema: [
    '1489844398144-8afd8be2afeb', // Cinema screens
    '1440404653325-ab127d49abc1', // Film projector
    '1578662996442-374dcbcbc495', // Movie posters
    '1627797391403-89e5c6dd3b67', // Cinema lobby
    '1501594907352-04cda38ebc29', // Theater
    '1583843115260-240cbcde1c7d', // Film equipment
    '1493225457124-a3b1d1ec61da', // Vintage cinema
    '1617015689170-e801bff6e4a3'  // Movie night
  ],
  music: [
    '1493225457124-a3b1d1ec61da', // DJ equipment
    '1471478331149-c72f17e33c73', // Vinyl records
    '1507838153414-b4b713384a76', // Guitar
    '1520523839897-11c3d9a7929b', // Microphone
    '1493225457124-a3b1d1ec61da', // Turntables
    '1499415479748-80246fb4c3db', // Music notes
    '1531482615713-2afd69097998', // Piano
    '1493225457124-a3b1d1ec61da'  // Studio
  ],
  locations: [
    '1506905925346-21bea4d5618c', // City skyline
    '1449824913935-59a10b8d2000', // Coffee shop
    '1504754524776-8f4f37790ca0', // Urban street
    '1529258283598-8d6fe60b27f4', // Modern building
    '1555396273-f888ea5eedc7', // Park view
    '1564501049412-60c094d46a1', // Shopping area
    '1506629905496-0119596b5fdb', // Art gallery
    '1506905925346-21bea4d5618c'  // Plaza
  ],
  spaces: [
    '1586023492675-c6aaed827346', // Modern interior
    '1460925895917-afdab827c52f', // Library
    '1497366216548-37526070297c', // Living room
    '1553062407-98eeb64c6a62', // Cozy room
    '1586023492675-c6aaed827346', // Gaming setup
    '1598300042247-d088f8ab3a91', // Study space
    '1583847268964-a6f45e725dc3', // Creative workspace
    '1586023492675-c6aaed827346'  // Tech lab
  ],
  people: [
    '1507003211169-0a1dd7a838fa', // Portrait 1
    '1494790108755-2616c06e9c99', // Portrait 2  
    '1472099645785-5658abf4ff4e', // Portrait 3
    '1438761681033-6461ffad8d80', // Portrait 4
    '1507003211169-0a1dd7a838fa', // Portrait 5
    '1500648767791-00dcc994a43e', // Portrait 6
    '1507003211169-0a1dd7a838fa', // Portrait 7
    '1472099645785-5658abf4ff4e'  // Portrait 8
  ]
};

export const videoCatalog: VideoItem[] = [
  { id: '1', title: 'Cyberpunk Dreams', duration: '2:34', thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.cinema[0]}?q=80&w=400&h=225&fit=crop&auto=format`, sharedBy: 'Alex Chen', sharedByAvatar: 'https://i.pravatar.cc/150?img=5', type: 'Sci-Fi', vibe: 'Dark', decade: '2020s', energy: 'High' },
  { id: '2', title: 'Neon Nights', duration: '1:45', thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.cinema[1]}?q=80&w=400&h=225&fit=crop&auto=format`, sharedBy: 'Maya Stone', sharedByAvatar: 'https://i.pravatar.cc/150?img=3', type: 'Music Video', vibe: 'Energetic', decade: '2020s', energy: 'High' },
  { id: '3', title: 'Digital Horizons', duration: '3:21', thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.cinema[2]}?q=80&w=400&h=225&fit=crop&auto=format`, sharedBy: 'Jordan Kim', sharedByAvatar: 'https://i.pravatar.cc/150?img=15', type: 'Documentary', vibe: 'Contemplative', decade: '2020s', energy: 'Medium' },
  { id: '4', title: 'Virtual Reality', duration: '4:12', thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.cinema[3]}?q=80&w=400&h=225&fit=crop&auto=format`, sharedBy: 'Sam Rivera', sharedByAvatar: 'https://i.pravatar.cc/150?img=11', type: 'Tech', vibe: 'Futuristic', decade: '2020s', energy: 'Medium' },
  { id: '5', title: 'Future Tech', duration: '3:45', thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.cinema[4]}?q=80&w=400&h=225&fit=crop&auto=format`, sharedBy: 'Riley Moon', sharedByAvatar: 'https://i.pravatar.cc/150?img=20', type: 'Sci-Fi', vibe: 'Futuristic', decade: '2020s', energy: 'High' },
  { id: '6', title: 'Movie Night', duration: '2:18', thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.cinema[5]}?q=80&w=400&h=225&fit=crop&auto=format`, sharedBy: 'Casey Park', sharedByAvatar: 'https://i.pravatar.cc/150?img=30', type: 'Drama', vibe: 'Contemplative', decade: '2020s', energy: 'Medium' },
  { id: '7', title: 'Cinema Experience', duration: '4:56', thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.cinema[6]}?q=80&w=400&h=225&fit=crop&auto=format`, sharedBy: 'Sage Rivers', sharedByAvatar: 'https://i.pravatar.cc/150?img=25', type: 'Documentary', vibe: 'Dark', decade: '2020s', energy: 'Low' },
  { id: '8', title: 'Theater Magic', duration: '3:33', thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.cinema[7]}?q=80&w=400&h=225&fit=crop&auto=format`, sharedBy: 'Phoenix Wu', sharedByAvatar: 'https://i.pravatar.cc/150?img=7', type: 'Music Video', vibe: 'Energetic', decade: '2020s', energy: 'High' },
  // Add more videos (24 total as specified)
  ...Array.from({ length: 16 }, (_, i) => ({
    id: `${i + 9}`,
    title: `${['Digital Dreams', 'Tech Showcase', 'Future Visions', 'Cyber Stories', 'Neon Adventures', 'Virtual Worlds', 'Cinema Classics', 'Modern Films'][i % 8]}`,
    duration: `${Math.floor(Math.random() * 5 + 1)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
    thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.cinema[i % UNSPLASH_IDS.cinema.length]}?q=80&w=400&h=225&fit=crop&auto=format&sig=${i + 100}`,
    sharedBy: ['Alex Chen', 'Maya Stone', 'Jordan Kim', 'Sam Rivera', 'Riley Moon', 'Casey Park', 'Sage Rivers', 'Phoenix Wu'][i % 8],
    sharedByAvatar: `https://i.pravatar.cc/150?img=${[5, 3, 15, 11, 20, 30, 25, 7][i % 8]}`,
    type: ['Sci-Fi', 'Music Video', 'Documentary', 'Tech', 'Drama', 'Action', 'Comedy', 'Thriller'][i % 8],
    vibe: ['Dark', 'Energetic', 'Contemplative', 'Futuristic', 'Chill', 'Uplifting'][i % 6],
    decade: '2020s',
    energy: ['High', 'Medium', 'Low'][i % 3]
  }))
];

export const musicCatalog: MusicItem[] = [
  { id: '1', title: 'Synthwave Nights', artist: 'Neon Dreams', length: '3:45', art: `https://images.unsplash.com/photo-${UNSPLASH_IDS.music[0]}?q=80&w=400&h=400&fit=crop&auto=format`, type: 'Electronic', vibe: 'Chill', decade: '2020s', energy: 'Medium' },
  { id: '2', title: 'Digital Love', artist: 'Cyber Soul', length: '4:23', art: `https://images.unsplash.com/photo-${UNSPLASH_IDS.music[1]}?q=80&w=400&h=400&fit=crop&auto=format`, type: 'Pop', vibe: 'Uplifting', decade: '2020s', energy: 'High' },
  { id: '3', title: 'Binary Dreams', artist: 'Code Symphony', length: '2:56', art: `https://images.unsplash.com/photo-${UNSPLASH_IDS.music[2]}?q=80&w=400&h=400&fit=crop&auto=format`, type: 'Ambient', vibe: 'Contemplative', decade: '2020s', energy: 'Low' },
  { id: '4', title: 'Holographic', artist: 'Future Bass', length: '3:12', art: `https://images.unsplash.com/photo-${UNSPLASH_IDS.music[3]}?q=80&w=400&h=400&fit=crop&auto=format`, type: 'Bass', vibe: 'Energetic', decade: '2020s', energy: 'High' },
  { id: '5', title: 'Sound Waves', artist: 'Digital Echo', length: '4:01', art: `https://images.unsplash.com/photo-${UNSPLASH_IDS.music[4]}?q=80&w=400&h=400&fit=crop&auto=format`, type: 'Electronic', vibe: 'Chill', decade: '2020s', energy: 'Medium' },
  { id: '6', title: 'Vinyl Memories', artist: 'Retro Beat', length: '3:33', art: `https://images.unsplash.com/photo-${UNSPLASH_IDS.music[5]}?q=80&w=400&h=400&fit=crop&auto=format`, type: 'Hip-Hop', vibe: 'Contemplative', decade: '2020s', energy: 'Low' },
  { id: '7', title: 'Studio Session', artist: 'Mix Master', length: '5:17', art: `https://images.unsplash.com/photo-${UNSPLASH_IDS.music[6]}?q=80&w=400&h=400&fit=crop&auto=format`, type: 'Jazz', vibe: 'Uplifting', decade: '2020s', energy: 'Medium' },
  { id: '8', title: 'Audio Dreams', artist: 'Sound Craft', length: '3:48', art: `https://images.unsplash.com/photo-${UNSPLASH_IDS.music[7]}?q=80&w=400&h=400&fit=crop&auto=format`, type: 'Ambient', vibe: 'Energetic', decade: '2020s', energy: 'High' },
  // Add more music (18 total)
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `${i + 9}`,
    title: `${['Beat Drop', 'Melody Flow', 'Rhythm Soul', 'Sonic Boom', 'Echo Chamber', 'Wave Form', 'Audio Pulse', 'Sound Track', 'Music Box', 'Beat Machine'][i % 10]}`,
    artist: ['Neon Dreams', 'Cyber Soul', 'Code Symphony', 'Future Bass', 'Digital Echo', 'Retro Beat', 'Mix Master', 'Sound Craft'][i % 8],
    length: `${Math.floor(Math.random() * 3 + 2)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
    art: `https://images.unsplash.com/photo-${UNSPLASH_IDS.music[i % UNSPLASH_IDS.music.length]}?q=80&w=400&h=400&fit=crop&auto=format&sig=${i + 200}`,
    type: ['Electronic', 'Pop', 'Ambient', 'Bass', 'Hip-Hop', 'Jazz', 'Rock', 'Classical'][i % 8],
    vibe: ['Chill', 'Uplifting', 'Contemplative', 'Energetic', 'Dark', 'Futuristic'][i % 6],
    decade: '2020s',
    energy: ['Medium', 'High', 'Low'][i % 3]
  }))
];

export const friends: Friend[] = [
  { id: '1', name: 'Alex Chen', status: 'online', avatar: 'https://i.pravatar.cc/150?img=5' },
  { id: '2', name: 'Maya Stone', status: 'online', avatar: 'https://i.pravatar.cc/150?img=3' },
  { id: '3', name: 'Jordan Kim', status: 'away', avatar: 'https://i.pravatar.cc/150?img=15' },
  { id: '4', name: 'Sam Rivera', status: 'online', avatar: 'https://i.pravatar.cc/150?img=11' },
  { id: '5', name: 'Casey Park', status: 'offline', avatar: 'https://i.pravatar.cc/150?img=30' },
  { id: '6', name: 'Riley Moon', status: 'online', avatar: 'https://i.pravatar.cc/150?img=20' },
  { id: '7', name: 'Sage Rivers', status: 'away', avatar: 'https://i.pravatar.cc/150?img=25' },
  { id: '8', name: 'Phoenix Wu', status: 'online', avatar: 'https://i.pravatar.cc/150?img=7' },
];

export const locations: LocationItem[] = [
  { id: '1', name: 'Cyber Café Neo', type: 'Café', distance: '0.5 km', thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.locations[0]}?q=80&w=400&h=225&fit=crop&auto=format` },
  { id: '2', name: 'Neon Park', type: 'Park', distance: '1.2 km', thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.locations[1]}?q=80&w=400&h=225&fit=crop&auto=format` },
  { id: '3', name: 'Digital Plaza', type: 'Plaza', distance: '2.1 km', thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.locations[2]}?q=80&w=400&h=225&fit=crop&auto=format` },
  { id: '4', name: 'Tech District', type: 'District', distance: '3.5 km', thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.locations[3]}?q=80&w=400&h=225&fit=crop&auto=format` },
  { id: '5', name: 'Modern Building Hub', type: 'Building', distance: '1.8 km', thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.locations[4]}?q=80&w=400&h=225&fit=crop&auto=format` },
  { id: '6', name: 'Green Space', type: 'Park', distance: '2.3 km', thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.locations[5]}?q=80&w=400&h=225&fit=crop&auto=format` },
  { id: '7', name: 'Shopping Center', type: 'Mall', distance: '3.1 km', thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.locations[6]}?q=80&w=400&h=225&fit=crop&auto=format` },
  { id: '8', name: 'Art Gallery', type: 'Gallery', distance: '1.9 km', thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.locations[7]}?q=80&w=400&h=225&fit=crop&auto=format` },
  // Add more locations (12 total)
  ...Array.from({ length: 4 }, (_, i) => ({
    id: `${i + 9}`,
    name: `${['Urban Center', 'City Square', 'Market Place', 'Cultural Hub'][i % 4]}`,
    type: ['Center', 'Square', 'Market', 'Hub'][i % 4],
    distance: `${(Math.random() * 5 + 0.5).toFixed(1)} km`,
    thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.locations[i % UNSPLASH_IDS.locations.length]}?q=80&w=400&h=225&fit=crop&auto=format&sig=${i + 300}`
  }))
];

// Update Starbuds space with real product data  
export const starbudsProducts = [
  { id: '1', title: 'Premium Flower', url: 'https://shop.starbuds.us/menu/', thumb: '/src/assets/starbuds-flower-showcase.jpg', type: 'flower' },
  { id: '2', title: 'Edibles Collection', url: 'https://shop.starbuds.us/menu/', thumb: '/src/assets/starbuds-edibles-collection.jpg', type: 'edible' },
  { id: '3', title: 'Concentrates', url: 'https://shop.starbuds.us/menu/', thumb: '/src/assets/starbuds-concentrates.jpg', type: 'concentrate' },
  { id: '4', title: 'Merchandise', url: 'https://shop.starbuds.us/menu/', thumb: '/src/assets/starbuds-merchandise.jpg', type: 'merch' }
];

export const initialSpaces: Space[] = [
  { 
    id: '2', 
    name: 'Music Den', 
    thumb: '/lovable-uploads/ab5a802a-5c5c-4cb0-bea7-ee6349ad6e55.png',
    backgroundImage: '/lovable-uploads/ab5a802a-5c5c-4cb0-bea7-ee6349ad6e55.png',
    show360: true,
    description: 'All your Sessions in One Place.'
  },
  { 
    id: '3', 
    name: 'Future Studio', 
    thumb: '/lovable-uploads/58cee9e8-f4f9-40a4-9565-e582aca775f1.png',
    backgroundImage: '/lovable-uploads/58cee9e8-f4f9-40a4-9565-e582aca775f1.png',
    show360: true,
    description: 'Inspo from Artists and Ai'
  },
  { 
    id: '4', 
    name: 'Command Center', 
    thumb: '/lovable-uploads/86b1ac6d-e8b1-4a28-8402-41237c3384d4.png',
    backgroundImage: '/lovable-uploads/86b1ac6d-e8b1-4a28-8402-41237c3384d4.png',
    show360: true,
    description: 'Workroom for Media and Content Strategies.',
    xAxis: 41
  },
  { 
    id: '6', 
    name: 'Grand Theater', 
    thumb: grandTheaterPoster,
    backgroundImage: '/media/lobby2.mp4',
    show360: true,
    description: 'Recommendations from your family and friends.',
    xAxis: -177,
    isMuted: false
  },
  { 
    id: '7', 
    name: 'Starbuds', 
    thumb: '/media/starbuds-thumb.jpg',
    backgroundImage: '/media/starbuds-360.mp4',
    show360: true,
    description: 'Welcome to Westmont',
    xAxis: -90,
    yAxis: -10,
    volume: 50,
    isMuted: false
  },
  {
    id: 'demo-space-1',
    name: 'Demo Vault',
    thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.spaces[4]}?q=80&w=400&h=225&fit=crop&auto=format`,
    backgroundImage: `https://images.unsplash.com/photo-${UNSPLASH_IDS.spaces[4]}?q=80&w=400&h=225&fit=crop&auto=format`,
    show360: false,
    description: 'A nested demo space within Music Den',
    parentId: '2' // This space is nested within Music Den
  },
];

export const friendsPosts: Post[] = [
  { id: '1', title: 'Check out this cyberpunk setup', sharedBy: 'Alex Chen', sharedByAvatar: 'https://i.pravatar.cc/150?img=5', type: 'video', thumb: featuredVideoBg, duration: '2:34' },
  { id: '2', title: 'New synthwave track dropped', sharedBy: 'Maya Stone', sharedByAvatar: 'https://i.pravatar.cc/150?img=3', type: 'music', thumb: musicCollection },
  { id: '3', title: 'Found this cool digital art space', sharedBy: 'Jordan Kim', sharedByAvatar: 'https://i.pravatar.cc/150?img=15', type: 'location', thumb: locationShowcase },
  { id: '4', title: 'Virtual reality documentary', sharedBy: 'Sam Rivera', sharedByAvatar: 'https://i.pravatar.cc/150?img=11', type: 'video', thumb: videoThumbnails, duration: '4:12' },
  { id: '5', title: 'Amazing music studio tour', sharedBy: 'Riley Moon', sharedByAvatar: 'https://i.pravatar.cc/150?img=20', type: 'video', thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.music[2]}?q=80&w=400&h=225&fit=crop&auto=format`, duration: '3:45' },
  { id: '6', title: 'Chill vibes playlist', sharedBy: 'Casey Park', sharedByAvatar: 'https://i.pravatar.cc/150?img=30', type: 'music', thumb: musicCollection },
  { id: '7', title: 'Cool café discovery', sharedBy: 'Sage Rivers', sharedByAvatar: 'https://i.pravatar.cc/150?img=25', type: 'location', thumb: locationShowcase },
  { id: '8', title: 'Behind the scenes footage', sharedBy: 'Phoenix Wu', sharedByAvatar: 'https://i.pravatar.cc/150?img=7', type: 'video', thumb: videoThumbnails, duration: '2:18' },
  { id: '9', title: 'New music video release', sharedBy: 'Alex Chen', sharedByAvatar: 'https://i.pravatar.cc/150?img=5', type: 'video', thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.cinema[5]}?q=80&w=400&h=225&fit=crop&auto=format`, duration: '3:22' },
  { id: '10', title: 'Epic gaming setup tour', sharedBy: 'Maya Stone', sharedByAvatar: 'https://i.pravatar.cc/150?img=3', type: 'video', thumb: videoThumbnails, duration: '5:15' },
  { id: '11', title: 'Late night vibes playlist', sharedBy: 'Jordan Kim', sharedByAvatar: 'https://i.pravatar.cc/150?img=15', type: 'music', thumb: musicCollection },
  { id: '12', title: 'Found this hidden gem café', sharedBy: 'Sam Rivera', sharedByAvatar: 'https://i.pravatar.cc/150?img=11', type: 'location', thumb: locationShowcase },
  { id: '13', title: 'Weekend coding session', sharedBy: 'Riley Moon', sharedByAvatar: 'https://i.pravatar.cc/150?img=20', type: 'video', thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.spaces[5]}?q=80&w=400&h=225&fit=crop&auto=format`, duration: '2:45' },
  { id: '14', title: 'Retro synthwave collection', sharedBy: 'Casey Park', sharedByAvatar: 'https://i.pravatar.cc/150?img=30', type: 'music', thumb: musicCollection },
  { id: '15', title: 'Urban exploration adventure', sharedBy: 'Sage Rivers', sharedByAvatar: 'https://i.pravatar.cc/150?img=25', type: 'location', thumb: locationShowcase },
  { id: '16', title: 'Documentary on AI ethics', sharedBy: 'Phoenix Wu', sharedByAvatar: 'https://i.pravatar.cc/150?img=7', type: 'video', thumb: videoThumbnails, duration: '8:30' },
  { id: '17', title: 'Minimalist workspace setup', sharedBy: 'Alex Chen', sharedByAvatar: 'https://i.pravatar.cc/150?img=5', type: 'video', thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.spaces[7]}?q=80&w=400&h=225&fit=crop&auto=format`, duration: '4:12' },
  { id: '18', title: 'Jazz fusion experimental track', sharedBy: 'Maya Stone', sharedByAvatar: 'https://i.pravatar.cc/150?img=3', type: 'music', thumb: musicCollection },
  { id: '19', title: 'Rooftop bar with city views', sharedBy: 'Jordan Kim', sharedByAvatar: 'https://i.pravatar.cc/150?img=15', type: 'location', thumb: locationShowcase },
  { id: '20', title: 'Indie film festival highlights', sharedBy: 'Sam Rivera', sharedByAvatar: 'https://i.pravatar.cc/150?img=11', type: 'video', thumb: videoThumbnails, duration: '6:18' },
  { id: '21', title: 'Ambient study music mix', sharedBy: 'Riley Moon', sharedByAvatar: 'https://i.pravatar.cc/150?img=20', type: 'music', thumb: musicCollection },
  { id: '22', title: 'Art gallery opening night', sharedBy: 'Casey Park', sharedByAvatar: 'https://i.pravatar.cc/150?img=30', type: 'location', thumb: locationShowcase },
  { id: '23', title: 'Behind the scenes vlog', sharedBy: 'Sage Rivers', sharedByAvatar: 'https://i.pravatar.cc/150?img=25', type: 'video', thumb: videoThumbnails, duration: '7:42' },
  { id: '24', title: 'Electronic beats compilation', sharedBy: 'Phoenix Wu', sharedByAvatar: 'https://i.pravatar.cc/150?img=7', type: 'music', thumb: musicCollection }
];
