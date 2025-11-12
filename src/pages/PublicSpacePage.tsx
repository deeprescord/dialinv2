import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { HomeView } from "@/components/DialinPortal/HomeView";
import { AuthModal } from "@/components/DialinPortal/AuthModal";
import { Settings360Modal } from "@/components/DialinPortal/Settings360Modal";
import { TopNav } from "@/components/DialinPortal/TopNav";
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
  const [show360Settings, setShow360Settings] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('custom');
  // Don't auto-open items bar for public pages
  const [showItemsBar, setShowItemsBar] = useState(false);
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

  // Helper to detect if localStorage is available
  const isStorageAvailable = () => {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  };

  useEffect(() => {
    checkAuthAndFetchSpace();
    
    // Show browser compatibility notice if storage is blocked
    if (!isStorageAvailable()) {
      toast.info('For full functionality, please allow storage in your browser settings');
    }
  }, [shareSlug]);

  const checkAuthAndFetchSpace = async () => {
    // Check authentication - handle localStorage blocking gracefully (Brave browser)
    let session = null;
    try {
      const { data } = await supabase.auth.getSession();
      session = data.session;
    } catch (error) {
      console.warn('Auth check failed (likely localStorage blocked):', error);
      // Continue as anonymous user - public content will still work
    }
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

  // Skip 10s helpers
  const handleSkipForward10 = () => {
    const next = Math.min(videoState.duration, (videoState.currentTime || 0) + 10);
    handleVideoSeek(next);
  };
  const handleSkipBackward10 = () => {
    const prev = Math.max(0, (videoState.currentTime || 0) - 10);
    handleVideoSeek(prev);
  };

  // Next/Previous within current public space items
  const playAdjacentItem = (direction: 1 | -1) => {
    if (!spaceItems || spaceItems.length === 0) return;
    const playable = spaceItems.filter(i => !i.is_space);
    if (playable.length === 0) return;
    const currentId = selectedItemData?.id;
    const idx = Math.max(0, playable.findIndex(i => i.id === currentId));
    const nextIdx = (idx + direction + playable.length) % playable.length;
    const target = playable[nextIdx];
    handleMediaClick(target);
  };
  const handleNextItem = () => playAdjacentItem(1);
  const handlePreviousItem = () => playAdjacentItem(-1);

  const handleOpen360Settings = () => {
    setShow360Settings(true);
  };

  const handleToggle360 = async (enabled: boolean) => {
    if (!isAuthenticated) {
      setPublicSpace(prev => prev ? { ...prev, show_360: enabled } : null);
      toast.info(`360° ${enabled ? 'preview on' : 'preview off'} (not saved)`);
      return;
    }
    try {
      const { error } = await supabase
        .from('spaces')
        .update({ show_360: enabled })
        .eq('id', publicSpace.id);
      
      if (error) throw error;
      setPublicSpace(prev => prev ? { ...prev, show_360: enabled } : null);
      toast.success(`360° mode ${enabled ? 'enabled' : 'disabled'}`);
    } catch (err) {
      console.error('Error toggling 360:', err);
      toast.error('Failed to update 360 mode');
    }
  };

  const handle360AxisChange = async (axis: 'x' | 'y', value: number) => {
    const field = axis === 'x' ? 'x_axis_offset' : 'y_axis_offset';
    setPublicSpace(prev => prev ? { ...prev, [field]: value } : null);
    if (!isAuthenticated) return;
    try {
      const { error } = await supabase
        .from('spaces')
        .update({ [field]: value })
        .eq('id', publicSpace.id);
      
      if (error) throw error;
    } catch (err) {
      console.error('Error updating axis:', err);
    }
  };

  const handle360VolumeChange = async (volume: number) => {
    setPublicSpace(prev => prev ? { ...prev, volume } : null);
    if (!isAuthenticated) return;
    try {
      const { error } = await supabase
        .from('spaces')
        .update({ volume })
        .eq('id', publicSpace.id);
      
      if (error) throw error;
    } catch (err) {
      console.error('Error updating volume:', err);
    }
  };

  const handle360MuteToggle = async (muted: boolean) => {
    setPublicSpace(prev => prev ? { ...prev, is_muted: muted } : null);
    if (!isAuthenticated) return;
    try {
      const { error } = await supabase
        .from('spaces')
        .update({ is_muted: muted })
        .eq('id', publicSpace.id);
      
      if (error) throw error;
    } catch (err) {
      console.error('Error toggling mute:', err);
    }
  };

  const handle360RotationToggle = async (enabled: boolean) => {
    setPublicSpace(prev => prev ? { ...prev, rotation_enabled: enabled } : null);
    if (!isAuthenticated) return;
    try {
      const { error } = await supabase
        .from('spaces')
        .update({ rotation_enabled: enabled })
        .eq('id', publicSpace.id);
      
      if (error) throw error;
    } catch (err) {
      console.error('Error toggling rotation:', err);
    }
  };

  const handle360RotationSpeedChange = async (speed: number) => {
    setPublicSpace(prev => prev ? { ...prev, rotation_speed: speed } : null);
    if (!isAuthenticated) return;
    try {
      const { error } = await supabase
        .from('spaces')
        .update({ rotation_speed: speed })
        .eq('id', publicSpace.id);
      
      if (error) throw error;
    } catch (err) {
      console.error('Error updating rotation speed:', err);
    }
  };

  const handleFlipHorizontalToggle = async (flipped: boolean) => {
    setPublicSpace(prev => prev ? { ...prev, flip_horizontal: flipped } : null);
    if (!isAuthenticated) return;
    try {
      const { error } = await supabase
        .from('spaces')
        .update({ flip_horizontal: flipped })
        .eq('id', publicSpace.id);
      
      if (error) throw error;
    } catch (err) {
      console.error('Error toggling flip horizontal:', err);
    }
  };

  const handleFlipVerticalToggle = async (flipped: boolean) => {
    setPublicSpace(prev => prev ? { ...prev, flip_vertical: flipped } : null);
    if (!isAuthenticated) return;
    try {
      const { error } = await supabase
        .from('spaces')
        .update({ flip_vertical: flipped })
        .eq('id', publicSpace.id);
      
      if (error) throw error;
    } catch (err) {
      console.error('Error toggling flip vertical:', err);
    }
  };

  const handleMediaClick = (item: any) => {
    console.log('🔍 PublicSpacePage handleMediaClick - Incoming item:', JSON.stringify(item, null, 2));
    
    if (!item) {
      setSelectedItemData(null);
      return;
    }

    const fileType = item.file_type || item.type;
    console.log('📦 File type detected:', fileType);
    
    // Normalize storage_path: strip "user-files/" prefix if present
    const normStoragePath = item.storage_path?.replace(/^user-files\//, '') || item.storage_path;
    console.log('📂 Normalized storage path:', normStoragePath);
    console.log('🔗 URL:', item.url);

    // Web links - prefer provided URL, fallback to storage_path
    if (fileType === 'web') {
      const transformedItem = {
        ...item,
        type: 'web',
        file_type: 'web',
        url: item.url || item.storage_path,
        storage_path: normStoragePath,
        thumb: item.thumbnail_path || item.thumb || undefined,
      };
      console.log('🌐 PublicSpacePage - Web link transformed:', transformedItem);
      setSelectedItemData(transformedItem);
      return;
    }

    // Regular files: normalize storage_path and keep both url and storage_path
    const transformedItem = {
      ...item,
      type: fileType,
      file_type: fileType,
      storage_path: normStoragePath,
      url: item.url, // pre-signed by SpacesBar or HomeView
      mime_type: item.mime_type,
      thumbnail_path: item.thumbnail_path || item.thumb,
      duration: item.duration,
      original_name: item.original_name || item.title,
    };
    
    // Warn if missing both url and storage_path
    if (!transformedItem.url && !transformedItem.storage_path) {
      console.warn('⚠️ PublicSpacePage: Item missing both url and storage_path!', transformedItem);
      toast.error('Media not available');
    }
    
    console.log('✨ PublicSpacePage - Final transformed item:', JSON.stringify(transformedItem, null, 2));
    setSelectedItemData(transformedItem);
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

  // Create spaces array for SpacesBar
  const homeSpace: UISpace = {
    id: 'default-home',
    name: 'Home',
    thumb: '/media/default-home-bg.mp4',
    backgroundImage: '/media/default-home-bg.mp4',
    show360: false,
    isHome: true
  };

  const currentSpace: UISpace = {
    id: publicSpace.id,
    name: publicSpace.name,
    thumb: publicSpace.thumbnail_url || '',
    backgroundImage: publicSpace.cover_url || undefined,
    show360: publicSpace.show_360,
    isPublic: true
  };

  const displaySpaces = [homeSpace, currentSpace];

  const handleSpaceClick = (space: UISpace) => {
    if (space.id === 'default-home') {
      navigate('/home');
    } else if (space.id === publicSpace.id) {
      // Clicking current space goes back to space grid view
      setSelectedItemData(null);
    }
  };

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
        <TopNav
          currentTab="home"
          onTabChange={() => {}}
          selectedChipsCount={0}
          dialCount={0}
          show360={true}
          onOpen360Settings={handleOpen360Settings}
          sortOrder={sortOrder}
          onSortChange={setSortOrder}
        />

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
          isPublicSpace={true}
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

        {/* Bottom SpacesBar - Pass spaceId to show items directly */}
        <div className="fixed bottom-0 left-0 right-0 z-40">
          <SpacesBar
            spaces={displaySpaces}
            currentSpaceId={publicSpace.id}
            breadcrumbs={[{ id: publicSpace.id, name: publicSpace.name }]}
            onCreateSpace={() => handleGatedAction()}
            onDeleteSpace={() => handleGatedAction()}
            onRenameSpace={() => handleGatedAction()}
            onUpdateSpaceDescription={() => handleGatedAction()}
            onReorderSpace={() => handleGatedAction()}
            onToggle360={() => handleGatedAction()}
            onSpaceClick={handleSpaceClick}
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
            onNextItem={handleNextItem}
            onPreviousItem={handlePreviousItem}
            sortOrder={sortOrder}
            onSortChange={setSortOrder}
          />
        </div>

        <Settings360Modal
          isOpen={show360Settings}
          onClose={() => setShow360Settings(false)}
          show360={publicSpace.show_360}
          onToggle360={() => handleToggle360(!publicSpace.show_360)}
          xAxisOffset={publicSpace.x_axis_offset}
          yAxisOffset={publicSpace.y_axis_offset}
          onAxisChange={handle360AxisChange}
          volume={publicSpace.volume / 100}
          isMuted={publicSpace.is_muted}
          onVolumeChange={(vol) => handle360VolumeChange(vol * 100)}
          onMuteToggle={() => handle360MuteToggle(!publicSpace.is_muted)}
          rotationEnabled={publicSpace.rotation_enabled}
          onRotationToggle={() => handle360RotationToggle(!publicSpace.rotation_enabled)}
          rotationSpeed={publicSpace.rotation_speed}
          onRotationSpeedChange={handle360RotationSpeedChange}
          flipHorizontal={publicSpace.flip_horizontal}
          flipVertical={publicSpace.flip_vertical}
          onFlipHorizontalToggle={() => handleFlipHorizontalToggle(!publicSpace.flip_horizontal)}
          onFlipVerticalToggle={() => handleFlipVerticalToggle(!publicSpace.flip_vertical)}
        />
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
