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
  cinema: [
    '1489844398144-8afd8be2afeb', // Cinema screens
    '1574267432553-4b3e64618c47', // Movie theater
    '1616530940355-351fabd9524b', // Film equipment
    '1518676590629-3dcbd9c5a5c9', // Retro cinema
    '1440404653325-ab127d49abc1', // Film projector
    '1578662996442-374dcbcbc495', // Movie posters
    '1489844398144-8afd8be2afeb', // Theater seats
    '1627797391403-89e5c6dd3b67'  // Cinema lobby
  ],
  music: [
    '1493225457124-a3b1d1ec61da', // DJ equipment
    '1571019613454-1cb2f99b2d8b', // Vinyl records
    '1519640760746-95d1211bbeea', // Music studio
    '1511735111819-9a3f7709049c', // Headphones
    '1614149162883-7b777440b3d5', // Sound mixer
    '1493225457124-a3b1d1ec61da', // Turntables
    '1507838153414-b4b713384a76', // Guitar
    '1520523839897-11c3d9a7929b'  // Microphone
  ],
  locations: [
    '1506905925346-21bea4d5618c', // City skyline
    '1507003211169-0a1dd7a838fa', // Urban street
    '1449824913935-59a10b8d2000', // Coffee shop
    '1541963463532-d68292c34d19', // Modern building
    '1508193638397-1c4234db14d8', // Restaurant interior
    '1555396273-f888ea5eedc7', // Park view
    '1564501049412-60c094d46a1', // Shopping area
    '1506629905496-0119596b5fdb'  // Art gallery
  ],
  spaces: [
    '1618005182384-a83a8bd57fbe', // Modern interior
    '1629909613654-28e6c8816c9b', // Cozy room
    '1586023492675-c6aaed827346', // Gaming setup
    '1598300042247-d088f8ab3a91', // Study space
    '1583847268964-a6f45e725dc3', // Creative workspace
    '1586023492675-c6aaed827346', // Tech lab
    '1460925895917-afdab827c52f', // Library
    '1497366216548-37526070297c'  // Living room
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

export const initialFloors: Floor[] = [
  { id: '1', name: 'Chill Vibes', thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.spaces[0]}?q=80&w=200&h=120&fit=crop&auto=format` },
  { id: '2', name: 'Study Hall', thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.spaces[1]}?q=80&w=200&h=120&fit=crop&auto=format` },
  { id: '3', name: 'Gaming Zone', thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.spaces[2]}?q=80&w=200&h=120&fit=crop&auto=format` },
  { id: '4', name: 'Music Room', thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.spaces[3]}?q=80&w=200&h=120&fit=crop&auto=format` },
  { id: '5', name: 'Creative Space', thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.spaces[4]}?q=80&w=200&h=120&fit=crop&auto=format` },
  { id: '6', name: 'Tech Lab', thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.spaces[5]}?q=80&w=200&h=120&fit=crop&auto=format` },
  { id: '7', name: 'Quiet Library', thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.spaces[6]}?q=80&w=200&h=120&fit=crop&auto=format` },
  { id: '8', name: 'Lounge Area', thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.spaces[7]}?q=80&w=200&h=120&fit=crop&auto=format` },
];

export const friendsPosts: Post[] = [
  { id: '1', title: 'Check out this cyberpunk setup', sharedBy: 'Alex Chen', sharedByAvatar: 'https://i.pravatar.cc/150?img=5', type: 'video', thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.cinema[0]}?q=80&w=400&h=225&fit=crop&auto=format`, duration: '2:34' },
  { id: '2', title: 'New synthwave track dropped', sharedBy: 'Maya Stone', sharedByAvatar: 'https://i.pravatar.cc/150?img=3', type: 'music', thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.music[1]}?q=80&w=400&h=400&fit=crop&auto=format` },
  { id: '3', title: 'Found this cool digital art space', sharedBy: 'Jordan Kim', sharedByAvatar: 'https://i.pravatar.cc/150?img=15', type: 'location', thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.locations[2]}?q=80&w=400&h=225&fit=crop&auto=format` },
  { id: '4', title: 'Virtual reality documentary', sharedBy: 'Sam Rivera', sharedByAvatar: 'https://i.pravatar.cc/150?img=11', type: 'video', thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.cinema[3]}?q=80&w=400&h=225&fit=crop&auto=format`, duration: '4:12' },
  { id: '5', title: 'Amazing music studio tour', sharedBy: 'Riley Moon', sharedByAvatar: 'https://i.pravatar.cc/150?img=20', type: 'video', thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.music[2]}?q=80&w=400&h=225&fit=crop&auto=format`, duration: '3:45' },
  { id: '6', title: 'Chill vibes playlist', sharedBy: 'Casey Park', sharedByAvatar: 'https://i.pravatar.cc/150?img=30', type: 'music', thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.music[4]}?q=80&w=400&h=400&fit=crop&auto=format` },
  { id: '7', title: 'Cool café discovery', sharedBy: 'Sage Rivers', sharedByAvatar: 'https://i.pravatar.cc/150?img=25', type: 'location', thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.locations[3]}?q=80&w=400&h=225&fit=crop&auto=format` },
  { id: '8', title: 'Behind the scenes footage', sharedBy: 'Phoenix Wu', sharedByAvatar: 'https://i.pravatar.cc/150?img=7', type: 'video', thumb: `https://images.unsplash.com/photo-${UNSPLASH_IDS.cinema[4]}?q=80&w=400&h=225&fit=crop&auto=format`, duration: '2:18' },
];