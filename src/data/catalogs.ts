// Mock data for Dialin V3 Portal

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

export interface Floor {
  id: string;
  name: string;
  thumb: string;
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
  cinema: ['1440180984861-071070bfaa22', '1518676590629-3dcbd9c5a5c9', '1594909122845-11bfd2b9b0f5', '1565728744382-17d6c507fba7'],
  music: ['1493225457124-a3b1d1ec61da', '1519640760746-95d1211bbeea', '1511735111819-9a3f7709049c', '1614149162883-7b777440b3d5'],
  locations: ['1506905925346-21bea4d5618c', '1507003211169-0a1dd7a838fa', '1508193638397-1c4234db14d8', '1541963463532-d68292c34d19'],
  spaces: ['1618005182384-a83a8bd57fbe', '1629909613654-28e6c8816c9b', '1583847268964-a6f45e725dc3', '1598300042247-d088f8ab3a91'],
};

export const videoCatalog: VideoItem[] = [
  { id: '1', title: 'Cyberpunk Dreams', duration: '2:34', thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.cinema[0]}?q=80&w=400&h=225&fit=crop&auto=format`, sharedBy: 'Alex Chen', sharedByAvatar: 'https://i.pravatar.cc/150?img=5', type: 'Sci-Fi', vibe: 'Dark', decade: '2020s', energy: 'High' },
  { id: '2', title: 'Neon Nights', duration: '1:45', thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.cinema[1]}?q=80&w=400&h=225&fit=crop&auto=format`, sharedBy: 'Maya Stone', sharedByAvatar: 'https://i.pravatar.cc/150?img=3', type: 'Music Video', vibe: 'Energetic', decade: '2020s', energy: 'High' },
  { id: '3', title: 'Digital Horizons', duration: '3:21', thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.cinema[2]}?q=80&w=400&h=225&fit=crop&auto=format`, sharedBy: 'Jordan Kim', sharedByAvatar: 'https://i.pravatar.cc/150?img=15', type: 'Documentary', vibe: 'Contemplative', decade: '2020s', energy: 'Medium' },
  { id: '4', title: 'Virtual Reality', duration: '4:12', thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.cinema[3]}?q=80&w=400&h=225&fit=crop&auto=format`, sharedBy: 'Sam Rivera', sharedByAvatar: 'https://i.pravatar.cc/150?img=11', type: 'Tech', vibe: 'Futuristic', decade: '2020s', energy: 'Medium' },
  // Add more videos (24 total as specified)
  ...Array.from({ length: 20 }, (_, i) => ({
    id: `${i + 5}`,
    title: `Content ${i + 5}`,
    duration: `${Math.floor(Math.random() * 5 + 1)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
    thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.cinema[i % 4]}?q=80&w=400&h=225&fit=crop&auto=format&sig=${i}`,
    sharedBy: ['Alex Chen', 'Maya Stone', 'Jordan Kim', 'Sam Rivera'][i % 4],
    sharedByAvatar: `https://i.pravatar.cc/150?img=${[5, 3, 15, 11][i % 4]}`,
    type: ['Sci-Fi', 'Music Video', 'Documentary', 'Tech'][i % 4],
    vibe: ['Dark', 'Energetic', 'Contemplative', 'Futuristic'][i % 4],
    decade: '2020s',
    energy: ['High', 'Medium', 'Low'][i % 3]
  }))
];

export const musicCatalog: MusicItem[] = [
  { id: '1', title: 'Synthwave Nights', artist: 'Neon Dreams', length: '3:45', art: `https://images.unsplash.com/photo-${UNSPLASH_IDS.music[0]}?q=80&w=400&h=400&fit=crop&auto=format`, type: 'Electronic', vibe: 'Chill', decade: '2020s', energy: 'Medium' },
  { id: '2', title: 'Digital Love', artist: 'Cyber Soul', length: '4:23', art: `https://images.unsplash.com/photo-${UNSPLASH_IDS.music[1]}?q=80&w=400&h=400&fit=crop&auto=format`, type: 'Pop', vibe: 'Uplifting', decade: '2020s', energy: 'High' },
  { id: '3', title: 'Binary Dreams', artist: 'Code Symphony', length: '2:56', art: `https://images.unsplash.com/photo-${UNSPLASH_IDS.music[2]}?q=80&w=400&h=400&fit=crop&auto=format`, type: 'Ambient', vibe: 'Contemplative', decade: '2020s', energy: 'Low' },
  { id: '4', title: 'Holographic', artist: 'Future Bass', length: '3:12', art: `https://images.unsplash.com/photo-${UNSPLASH_IDS.music[3]}?q=80&w=400&h=400&fit=crop&auto=format`, type: 'Bass', vibe: 'Energetic', decade: '2020s', energy: 'High' },
  // Add more music (18 total)
  ...Array.from({ length: 14 }, (_, i) => ({
    id: `${i + 5}`,
    title: `Track ${i + 5}`,
    artist: ['Neon Dreams', 'Cyber Soul', 'Code Symphony', 'Future Bass'][i % 4],
    length: `${Math.floor(Math.random() * 3 + 2)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
    art: `https://images.unsplash.com/photo-${UNSPLASH_IDS.music[i % 4]}?q=80&w=400&h=400&fit=crop&auto=format&sig=${i}`,
    type: ['Electronic', 'Pop', 'Ambient', 'Bass'][i % 4],
    vibe: ['Chill', 'Uplifting', 'Contemplative', 'Energetic'][i % 4],
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
  // Add more locations (12 total)
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `${i + 5}`,
    name: `Location ${i + 5}`,
    type: ['Café', 'Park', 'Plaza', 'District'][i % 4],
    distance: `${(Math.random() * 5 + 0.5).toFixed(1)} km`,
    thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.locations[i % 4]}?q=80&w=400&h=225&fit=crop&auto=format&sig=${i}`
  }))
];

export const initialFloors: Floor[] = [
  { id: '1', name: 'Chill Vibes', thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.spaces[0]}?q=80&w=200&h=120&fit=crop&auto=format` },
  { id: '2', name: 'Study Hall', thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.spaces[1]}?q=80&w=200&h=120&fit=crop&auto=format` },
  { id: '3', name: 'Gaming Zone', thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.spaces[2]}?q=80&w=200&h=120&fit=crop&auto=format` },
  { id: '4', name: 'Music Room', thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.spaces[3]}?q=80&w=200&h=120&fit=crop&auto=format` },
  { id: '5', name: 'Creative Space', thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.spaces[0]}?q=80&w=200&h=120&fit=crop&auto=format&sig=5` },
];

export const friendsPosts: Post[] = [
  { id: '1', title: 'Check out this cyberpunk setup', sharedBy: 'Alex Chen', sharedByAvatar: 'https://i.pravatar.cc/150?img=5', type: 'video', thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.cinema[0]}?q=80&w=400&h=225&fit=crop&auto=format`, duration: '2:34' },
  { id: '2', title: 'New synthwave track dropped', sharedBy: 'Maya Stone', sharedByAvatar: 'https://i.pravatar.cc/150?img=3', type: 'music', thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.music[0]}?q=80&w=400&h=400&fit=crop&auto=format` },
  { id: '3', title: 'Found this cool digital art space', sharedBy: 'Jordan Kim', sharedByAvatar: 'https://i.pravatar.cc/150?img=15', type: 'location', thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.locations[0]}?q=80&w=400&h=225&fit=crop&auto=format` },
  { id: '4', title: 'Virtual reality documentary', sharedBy: 'Sam Rivera', sharedByAvatar: 'https://i.pravatar.cc/150?img=11', type: 'video', thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.cinema[1]}?q=80&w=400&h=225&fit=crop&auto=format`, duration: '4:12' },
];