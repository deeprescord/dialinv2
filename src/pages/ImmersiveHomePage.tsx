import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import { LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthModal } from '@/components/DialinPortal/AuthModal';
import { Holographic3DCarousel } from '@/components/DialinPortal/Holographic3DCarousel';
import { AudioReactiveBackground } from '@/components/DialinPortal/AudioReactiveBackground';
import { GlassHUD } from '@/components/DialinPortal/GlassHUD';
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer';
import { Play, Pause, SkipBack, SkipForward } from '@/components/icons';

const ImmersiveHomePage = () => {
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [currentAlbumIndex, setCurrentAlbumIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Audio analysis
  const audioAnalysis = useAudioAnalyzer(audioRef.current);

  // Mock albums - replace with real data
  const albums = [
    {
      id: '1',
      name: 'Burning Desire',
      thumbnail: '/media/grand-theater-thumb.jpg',
      mediaUrl: '/media/default-home-bg.mp4',
      energy: 'high'
    },
    {
      id: '2',
      name: 'Calm Waters',
      thumbnail: '/media/starbuds-thumb.jpg',
      mediaUrl: '/media/lobby2.mp4',
      energy: 'low'
    },
    {
      id: '3',
      name: 'Electric Dreams',
      thumbnail: '/media/grand-theater-thumb.jpg',
      mediaUrl: '/media/elton-john-360.mp4',
      energy: 'high'
    },
  ];

  // Check auth state
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => navigate('/'), 100);
      }
    });

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) navigate('/');
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAlbumSelect = (index: number) => {
    setCurrentAlbumIndex(index);
    // Play audio if available
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSkipNext = () => {
    setCurrentAlbumIndex((prev) => (prev + 1) % albums.length);
  };

  const handleSkipPrevious = () => {
    setCurrentAlbumIndex((prev) => (prev - 1 + albums.length) % albums.length);
  };

  return (
    <>
      <Helmet>
        <title>Dialin - Immersive Music Experience</title>
        <meta name="description" content="Step inside the music" />
      </Helmet>

      <div className="h-screen w-full overflow-hidden relative">
        {/* Audio-Reactive Background */}
        <AudioReactiveBackground 
          isHighEnergy={audioAnalysis.isHighEnergy}
          energy={audioAnalysis.energy}
          videoUrl={albums[currentAlbumIndex]?.mediaUrl}
        />

        {/* Hidden audio element for analysis */}
        <audio ref={audioRef} loop />

        {/* Top HUD - Welcome Message */}
        {!user && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4">
            <GlassHUD variant="minimal" className="p-6">
              <h1 className="text-3xl font-bold text-foreground mb-2 text-center">
                Welcome to Dialin
              </h1>
              <p className="text-muted-foreground text-center">
                Step inside the music
              </p>
            </GlassHUD>
          </div>
        )}

        {/* Center - Auth CTA (for unauthenticated users) */}
        {!user && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-full max-w-md px-4">
            <GlassHUD className="p-8">
              <div className="flex flex-col gap-4">
                <Button 
                  size="lg" 
                  className="gap-2 text-lg px-8 py-6 w-full"
                  onClick={() => {
                    setAuthMode('signup');
                    setShowAuthModal(true);
                  }}
                >
                  <UserPlus size={20} />
                  Create Account
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="gap-2 text-lg px-8 py-6 w-full"
                  onClick={() => {
                    setAuthMode('login');
                    setShowAuthModal(true);
                  }}
                >
                  <LogIn size={20} />
                  Sign In
                </Button>
              </div>
            </GlassHUD>
          </div>
        )}

        {/* Bottom - 3D Holographic Carousel */}
        <div className="absolute bottom-0 left-0 right-0 z-20 pb-8">
          <GlassHUD variant="compact" className="mx-auto max-w-6xl">
            <Holographic3DCarousel
              albums={albums}
              currentIndex={currentAlbumIndex}
              onAlbumSelect={handleAlbumSelect}
              audioEnergy={audioAnalysis.energy}
              bpm={audioAnalysis.bpm}
            />

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-4 py-4 px-6 border-t border-border/30">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSkipPrevious}
                className="hover:bg-primary/20"
              >
                <SkipBack size={20} />
              </Button>
              
              <Button 
                variant="default" 
                size="lg" 
                onClick={handlePlayPause}
                className="rounded-full w-12 h-12 p-0"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSkipNext}
                className="hover:bg-primary/20"
              >
                <SkipForward size={20} />
              </Button>
            </div>

            {/* Current track info */}
            <div className="px-6 pb-4 text-center">
              <h3 className="text-lg font-semibold text-foreground">
                {albums[currentAlbumIndex]?.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                Energy: {audioAnalysis.isHighEnergy ? 'High' : 'Calm'} • 
                BPM: {audioAnalysis.bpm}
              </p>
            </div>
          </GlassHUD>
        </div>

        {/* Auth Modal */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            navigate('/');
          }}
          initialMode={authMode}
        />
      </div>
    </>
  );
};

export default ImmersiveHomePage;
