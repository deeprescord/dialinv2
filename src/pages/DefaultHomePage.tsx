import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { HeroHeaderVideo, HeroHeaderVideoHandle } from '@/components/DialinPortal/HeroHeaderVideo';
import { TopNav } from '@/components/DialinPortal/TopNav';
import { SpacesBar } from '@/components/DialinPortal/SpacesBar';
import { HomeView } from '@/components/DialinPortal/HomeView';
import type { Space as UISpace } from '@/data/catalogs';
import type { SortOrder } from '@/types/organization';

const DefaultHomePage = () => {
  const navigate = useNavigate();
  const heroRef = useRef<HeroHeaderVideoHandle>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('date-newest');
  const [videoState, setVideoState] = useState({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 50,
    isMuted: true,
    hasVideo: true,
  });

  const handleVideoStateChange = (state: any) => {
    setVideoState(state);
  };

  const handleVideoPlayPause = () => {
    heroRef.current?.playPause();
  };

  const handleVideoSeek = (value: number) => {
    heroRef.current?.seek(value);
  };

  const handleVideoVolumeChange = (value: number) => {
    heroRef.current?.setVolume(value);
  };

  const handleVideoMuteToggle = () => {
    heroRef.current?.toggleMute();
  };

  const homeSpace: UISpace = {
    id: 'default-home',
    name: 'Home',
    thumb: '/media/default-home-bg.mp4',
    backgroundImage: '/media/default-home-bg.mp4',
    show360: false,
    isHome: true
  };

  const displaySpaces = [homeSpace];

  return (
    <>
      <Helmet>
        <title>Dialin - Connect & Share</title>
        <meta name="description" content="Welcome to Dialin - Your default home space" />
      </Helmet>
      
      <div className="h-screen w-full overflow-hidden bg-background">
        {/* Top Navigation */}
        <TopNav 
          currentTab="home"
          onTabChange={() => {}}
          selectedChipsCount={0}
          dialCount={0}
          sortOrder={sortOrder}
          onSortChange={setSortOrder}
        />

        {/* Main Content */}
        <HomeView
          pinnedContacts={[]}
          onContactClick={() => {}}
          onMediaClick={() => {}}
          onMediaLongPress={() => {}}
          backgroundImage="/media/default-home-bg.mp4"
          spaceName="Home"
          spaceDescription="Welcome to Dialin"
          onVideoStateChange={handleVideoStateChange}
          heroRef={heroRef}
          sortOrder={sortOrder}
          onSortChange={setSortOrder}
        />

        {/* Bottom SpacesBar */}
        <div className="fixed bottom-0 left-0 right-0 z-40">
          <SpacesBar
            spaces={displaySpaces}
            currentSpaceId="default-home"
            onCreateSpace={() => {}}
            onDeleteSpace={() => {}}
            onRenameSpace={() => {}}
            onUpdateSpaceDescription={() => {}}
            onReorderSpace={() => {}}
            onToggle360={() => {}}
            hideActionButtons={true}
            hideNewButton={true}
            hideAIButton={true}
            hideChatButton={true}
            videoControlsState={videoState}
            onVideoPlayPause={handleVideoPlayPause}
            onVideoSeek={handleVideoSeek}
            onVideoVolumeChange={handleVideoVolumeChange}
            onVideoMuteToggle={handleVideoMuteToggle}
            sortOrder={sortOrder}
            onSortChange={setSortOrder}
          />
        </div>
      </div>
    </>
  );
};

export default DefaultHomePage;
