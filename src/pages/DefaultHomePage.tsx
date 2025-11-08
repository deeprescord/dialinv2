import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { HeroHeaderVideo, HeroHeaderVideoHandle } from '@/components/DialinPortal/HeroHeaderVideo';
import { TopNav } from '@/components/DialinPortal/TopNav';
import { SpacesBar } from '@/components/DialinPortal/SpacesBar';
import { HomeView } from '@/components/DialinPortal/HomeView';
import { AuthModal } from '@/components/DialinPortal/AuthModal';
import { Button } from '@/components/ui/button';
import type { Space as UISpace } from '@/data/catalogs';
import type { SortOrder } from '@/types/organization';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import { LogIn, UserPlus } from 'lucide-react';

const DefaultHomePage = () => {
  const navigate = useNavigate();
  const heroRef = useRef<HeroHeaderVideoHandle>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [sortOrder, setSortOrder] = useState<SortOrder>('date-newest');
  const [videoState, setVideoState] = useState({
    isPlaying: true,
    currentTime: 0,
    duration: 0,
    volume: 50,
    isMuted: true,
    hasVideo: true,
  });

  // Check auth state
  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      
      // If user just logged in, redirect to main app
      if (session?.user) {
        setTimeout(() => navigate('/'), 100);
      }
    });

    // Check for existing session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

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

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    navigate('/');
  };

  const handleSignUpClick = () => {
    setAuthMode('signup');
    setShowAuthModal(true);
  };

  const handleLoginClick = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  const homeSpace: UISpace = {
    id: 'default-home',
    name: 'Home',
    thumb: '/media/grand-theater-thumb.jpg',
    backgroundImage: '/media/default-home-bg.mp4',
    show360: false,
    flipVertical: false,
    isHome: true
  };

  const displaySpaces = [homeSpace];
  const isAuthenticated = !!user;

  return (
    <>
      <Helmet>
        <title>Dialin - Connect & Share</title>
        <meta name="description" content="Welcome to Dialin - Your shared space for media and connections" />
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
          show360={false}
          flipVertical={false}
          onVideoStateChange={handleVideoStateChange}
          heroRef={heroRef}
          sortOrder={sortOrder}
          onSortChange={setSortOrder}
        />

        {/* Auth CTA Overlay - Only show for unauthenticated users */}
        {!user && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 pb-32">
            <div className="glass-card rounded-3xl p-8 md:p-12 max-w-2xl mx-4 text-center pointer-events-auto">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Welcome to Dialin
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8">
                Your personal space for organizing and sharing media with friends
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="gap-2 text-lg px-8 py-6"
                  onClick={handleSignUpClick}
                >
                  <UserPlus size={20} />
                  Create Account
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="gap-2 text-lg px-8 py-6"
                  onClick={handleLoginClick}
                >
                  <LogIn size={20} />
                  Sign In
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom SpacesBar */}
        <div className="fixed bottom-0 left-0 right-0 z-50">
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
            isAuthenticated={isAuthenticated}
          />
        </div>

        {/* Auth Modal */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
          initialMode={authMode}
        />
      </div>
    </>
  );
};

export default DefaultHomePage;
