import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { HomeView } from "@/components/DialinPortal/HomeView";
import { AuthModal } from "@/components/DialinPortal/AuthModal";
import { useSpaceItems } from "@/hooks/useSpaceItems";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";

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

      <HomeView
        pinnedContacts={[]}
        onContactClick={() => {}}
        onMediaClick={() => {}}
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
        showItemsBar={true}
      />

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
