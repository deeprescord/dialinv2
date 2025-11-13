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
  rotationEnabled?: boolean;
  rotationSpeed?: number;
  rotationAxis?: 'x' | 'y';
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  parentId?: string; // For nested spaces
  isHome?: boolean; // Marks the permanent Home space
  isPublic?: boolean; // Public sharing enabled
  shareSlug?: string | null; // URL slug for public sharing
  showPlayAllButton?: boolean; // Show Play All button in hero header
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

// All catalog data is now blank - users will populate spaces with their own uploaded content
// Sample data kept above for reference if needed
export const videoCatalog: VideoItem[] = [];

export const musicCatalog: MusicItem[] = [];

export const friends: Friend[] = [
  { id: '3', name: 'Emily Rodriguez', status: 'away', avatar: `https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop` },
  { id: '4', name: 'James Park', status: 'online', avatar: `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop` },
  { id: '5', name: 'Aisha Patel', status: 'offline', avatar: `https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop` },
  { id: '6', name: 'David Kim', status: 'online', avatar: `https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=200&h=200&fit=crop` },
  { id: '7', name: 'Lisa Wang', status: 'away', avatar: `https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop` },
];

export const locations: LocationItem[] = [];

// Starbuds products kept for reference
export const starbudsProducts = [
  { id: '1', title: 'Premium Flower', url: 'https://shop.starbuds.us/menu/', thumb: '/src/assets/starbuds-flower-showcase.jpg', type: 'flower' },
  { id: '2', title: 'Edibles Collection', url: 'https://shop.starbuds.us/menu/', thumb: '/src/assets/starbuds-edibles-collection.jpg', type: 'edible' },
  { id: '3', title: 'Concentrates', url: 'https://shop.starbuds.us/menu/', thumb: '/src/assets/starbuds-concentrates.jpg', type: 'concentrate' },
  { id: '4', title: 'Merchandise', url: 'https://shop.starbuds.us/menu/', thumb: '/src/assets/starbuds-merchandise.jpg', type: 'merch' }
];

// Users build their own spaces from scratch
export const initialSpaces: Space[] = [];

export const friendsPosts: Post[] = [];
