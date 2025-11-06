import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { HomeView } from "@/components/DialinPortal/HomeView";
import { AuthModal } from "@/components/DialinPortal/AuthModal";
import { useSpaceItems } from "@/hooks/useSpaceItems";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import { SpacesBar } from "@/components/DialinPortal/SpacesBar";
import type { HeroHeaderVideoHandle } from "@/components/DialinPortal/HeroHeaderVideo";
import type { Space as UISpace } from "@/data/catalogs";
import type { SortOrder } from "@/types/organization";

interface PublicSpace {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  thumbnail_url: string | null;
  show_360: boolean;
  x_axis_offset: number;
  y_axis_offset: number;
  volume: number;
  is_muted: boolean;
  rotation_enabled: boolean;
  rotation_speed: number;
  rotation_axis: string;
  flip_horizontal: boolean;
  flip_vertical: boolean;
}

const PublicSpacePage = () => {
  const { shareSlug } = useParams<{ shareSlug: string }>();
  const navigate = useNavigate();
  const [publicSpace, setPublicSpace] = useState<PublicSpace | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('custom');
  const [showItemsBar, setShowItemsBar] = useState(true);
  const [itemsPeopleView, setItemsPeopleView] = useState<'items' | 'people'>('items');
  const [selectedItemData, setSelectedItemData] = useState<any>(null);
  
  // Video controls state
  const [videoState, setVideoState] = useState({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: true,
    hasVideo: false,
    isLooping: true
  });
  const heroRef = useRef<HeroHeaderVideoHandle>(null);
  
  // Fetch space items using the hook
  const { items: spaceItems, loading: itemsLoading } = useSpaceItems(publicSpace?.id);

  useEffect(() => {
    checkAuthAndFetchSpace();
  }, [shareSlug]);

  const checkAuthAndFetchSpace = async () => {
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);

    // Fetch public space
    if (!shareSlug) {
      toast.error("Invalid share link");
      navigate("/");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("spaces")
        .select("*")
        .eq("share_slug", shareSlug)
        .eq("is_public", true)
        .single();

      if (error || !data) {
        toast.error("Space not found or not publicly accessible");
        navigate("/");
        return;
      }

      setPublicSpace({
        id: data.id,
        name: data.name,
        description: data.description,
        cover_url: data.cover_url,
        thumbnail_url: data.thumbnail_url,
        show_360: data.show_360 ?? false,
        x_axis_offset: data.x_axis_offset ?? 0,
        y_axis_offset: data.y_axis_offset ?? 0,
        volume: data.volume ?? 50,
        is_muted: data.is_muted ?? true,
        rotation_enabled: data.rotation_enabled ?? false,
        rotation_speed: data.rotation_speed ?? 1,
        rotation_axis: data.rotation_axis ?? 'x',
        flip_horizontal: data.flip_horizontal ?? false,
        flip_vertical: data.flip_vertical ?? false,
      });
    } catch (err) {
      console.error("Error fetching public space:", err);
      toast.error("Failed to load space");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleGatedAction = () => {
    if (!isAuthenticated) {
      toast.info("Please sign in to perform this action");
      setShowAuthModal(true);
      return false;
    }
    return true;
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    setIsAuthenticated(true);
    toast.success("Welcome! You can now create and upload content.");
  };

  // Video control handlers
  const handleVideoStateChange = (state: typeof videoState) => {
    setVideoState(state);
  };

  const handleVideoPlayPause = () => {
    heroRef.current?.playPause();
    setVideoState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const handleVideoSeek = (value: number) => {
    heroRef.current?.seek(value);
    setVideoState(prev => ({ ...prev, currentTime: value }));
  };

  const handleVideoVolumeChange = (value: number) => {
    heroRef.current?.setVolume(value);
    setVideoState(prev => ({ ...prev, volume: value, isMuted: value === 0 }));
  };

  const handleVideoMuteToggle = () => {
    heroRef.current?.toggleMute();
    setVideoState(prev => ({ ...prev, isMuted: !prev.isMuted }));
  };

  const handleVideoLoopToggle = () => {
    heroRef.current?.toggleLoop();
    setVideoState(prev => ({ ...prev, isLooping: !prev.isLooping }));
  };

  const handleMediaClick = (item: any) => {
    if (!item) {
      setSelectedItemData(null);
      return;
    }
    setSelectedItemData(item);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading space...</p>
        </div>
      </div>
    );
  }

  if (!publicSpace) {
    return null;
  }

  // SEO Meta tags
  const shareUrl = `${window.location.origin}/s/${shareSlug}`;
  const shareImage = publicSpace.thumbnail_url || publicSpace.cover_url || "";
  const shareTitle = `${publicSpace.name} | Dialin Space`;
  const shareDescription = publicSpace.description || `Check out this space on Dialin: ${publicSpace.name}`;

  return (
    <>
      <Helmet>
        <title>{shareTitle}</title>
        <meta name="description" content={shareDescription} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={shareUrl} />
        <meta property="og:title" content={shareTitle} />
        <meta property="og:description" content={shareDescription} />
        {shareImage && <meta property="og:image" content={shareImage} />}
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={shareUrl} />
        <meta name="twitter:title" content={shareTitle} />
        <meta name="twitter:description" content={shareDescription} />
        {shareImage && <meta name="twitter:image" content={shareImage} />}
      </Helmet>

      <div className="min-h-screen bg-background">
        <HomeView
          pinnedContacts={[]}
          onContactClick={() => {}}
          onMediaClick={handleMediaClick}
          onMediaLongPress={handleGatedAction}
          backgroundImage={publicSpace.cover_url || undefined}
          spaceName={publicSpace.name}
          spaceDescription={publicSpace.description || undefined}
          show360={publicSpace.show_360}
          xAxisOffset={publicSpace.x_axis_offset}
          yAxisOffset={publicSpace.y_axis_offset}
          volume={publicSpace.volume}
          isMuted={publicSpace.is_muted}
          rotationEnabled={publicSpace.rotation_enabled}
          rotationSpeed={publicSpace.rotation_speed}
          flipHorizontal={publicSpace.flip_horizontal}
          flipVertical={publicSpace.flip_vertical}
          onAddOptionSelect={handleGatedAction}
          movieMode={false}
          spaceId={publicSpace.id}
          showItemsBar={showItemsBar}
          onCloseItemsBar={() => setShowItemsBar(false)}
          itemsPeopleView={itemsPeopleView}
          selectedItem={selectedItemData}
          onVideoStateChange={handleVideoStateChange}
          heroRef={heroRef}
          onItemClick={handleMediaClick}
          sortOrder={sortOrder}
          onSortChange={setSortOrder}
        />

        {/* Bottom SpacesBar */}
        <div className="fixed bottom-0 left-0 right-0 z-40">
          <SpacesBar
            spaces={[]}
            currentSpaceId={publicSpace.id}
            onCreateSpace={() => handleGatedAction()}
            onDeleteSpace={() => handleGatedAction()}
            onRenameSpace={() => handleGatedAction()}
            onUpdateSpaceDescription={() => handleGatedAction()}
            onReorderSpace={() => handleGatedAction()}
            onToggle360={() => handleGatedAction()}
            onSpaceClick={() => {}}
            onItemClick={handleMediaClick}
            hideActionButtons={false}
            hideNewButton={true}
            hideAIButton={true}
            hideChatButton={true}
            videoControlsState={videoState}
            onVideoPlayPause={handleVideoPlayPause}
            onVideoSeek={handleVideoSeek}
            onVideoVolumeChange={handleVideoVolumeChange}
            onVideoMuteToggle={handleVideoMuteToggle}
            onVideoLoopToggle={handleVideoLoopToggle}
            onToggleItemsBar={() => {
              if (showItemsBar && itemsPeopleView === 'items') {
                setShowItemsBar(false);
              } else {
                setItemsPeopleView('items');
                setShowItemsBar(true);
              }
            }}
            onTogglePeopleBar={() => {
              if (showItemsBar && itemsPeopleView === 'people') {
                setShowItemsBar(false);
              } else {
                setItemsPeopleView('people');
                setShowItemsBar(true);
              }
            }}
            sortOrder={sortOrder}
            onSortChange={setSortOrder}
          />
        </div>
      </div>

      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      )}
    </>
  );
};

export default PublicSpacePage;
