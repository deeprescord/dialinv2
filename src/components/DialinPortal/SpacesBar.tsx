import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { PlusCircle, MessageSquare, Bot } from '../icons';
import { Package, Users, FileText, Music, Video, Image as ImageIcon } from 'lucide-react';
import { Space } from '@/data/catalogs';
import { ImageFallback } from '../ui/image-fallback';
import { SpaceContextMenu } from './SpaceContextMenu';
import { DialPopup } from './DialPopup';
import { AddOptionsModal } from './AddOptionsModal';
import { AIChat } from './AIChat';
import { ChatWindow } from './ChatWindow';
import { ItemsPeopleBar } from './ItemsPeopleBar';
import { VideoControls } from './VideoControls';
import { useSpaceItems } from '@/hooks/useSpaceItems';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SpacesBarProps {
  spaces: Space[];
  currentSpaceId?: string;
  onCreateSpace: () => void;
  onDeleteSpace: (spaceId: string) => void;
  onRenameSpace: (spaceId: string, newName: string) => void;
  onUpdateSpaceDescription: (spaceId: string, newDescription: string) => void;
  onUpdateSpaceThumbnail?: (spaceId: string, thumbnailUrl: string) => void;
  onReorderSpace: (spaceId: string, direction: 'left' | 'right') => void;
  onToggle360: (spaceId: string, enabled: boolean) => void;
  on360AxisChange?: (spaceId: string, axis: 'x' | 'y', value: number) => void;
  on360VolumeChange?: (spaceId: string, volume: number) => void;
  on360MuteToggle?: (spaceId: string, muted: boolean) => void;
  on360RotationToggle?: (spaceId: string, enabled: boolean) => void;
  on360RotationSpeedChange?: (spaceId: string, speed: number) => void;
  on360RotationAxisChange?: (spaceId: string, axis: 'x' | 'y') => void;
  onFlipHorizontalToggle?: (spaceId: string, flipped: boolean) => void;
  onFlipVerticalToggle?: (spaceId: string, flipped: boolean) => void;
  onSpaceClick?: (space: Space) => void;
  onItemClick?: (item: any) => void;
  breadcrumbs?: Array<{ id: string; name: string }>;
  hideActionButtons?: boolean;
  hideNewButton?: boolean;
  hideAIButton?: boolean;
  hideChatButton?: boolean;
  onToggleAIChat?: () => void;
  onToggleChatWindow?: () => void;
  onToggleAddModal?: () => void;
  videoControlsState?: {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    isMuted: boolean;
    hasVideo: boolean;
  };
  onVideoPlayPause?: () => void;
  onVideoSeek?: (value: number) => void;
  onVideoVolumeChange?: (value: number) => void;
  onVideoMuteToggle?: () => void;
  onToggleItemsBar?: () => void;
  onTogglePeopleBar?: () => void;
}

export function SpacesBar({
  spaces,
  currentSpaceId,
  onCreateSpace,
  onDeleteSpace,
  onRenameSpace,
  onUpdateSpaceDescription,
  onUpdateSpaceThumbnail,
  onReorderSpace,
  onToggle360,
  on360AxisChange,
  on360VolumeChange,
  on360MuteToggle,
  on360RotationToggle,
  on360RotationSpeedChange,
  on360RotationAxisChange,
  onFlipHorizontalToggle,
  onFlipVerticalToggle,
  onSpaceClick,
  onItemClick,
  breadcrumbs,
  hideActionButtons = false,
  hideNewButton = false,
  hideAIButton = false,
  hideChatButton = false,
  onToggleAIChat,
  onToggleChatWindow,
  onToggleAddModal,
  videoControlsState,
  onVideoPlayPause,
  onVideoSeek,
  onVideoVolumeChange,
  onVideoMuteToggle,
  onToggleItemsBar,
  onTogglePeopleBar
}: SpacesBarProps) {
  const navigate = useNavigate();
  const scale = 65; // Reduced from 87 to make more compact
  const [contextMenu, setContextMenu] = useState<{
    space: Space;
    position: { x: number; y: number };
  } | null>(null);
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [wasLongPress, setWasLongPress] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showChatWindow, setShowChatWindow] = useState(false);
  const [showDialPopup, setShowDialPopup] = useState(false);
  const [dialPopupItem, setDialPopupItem] = useState<any>(null);
  const [showAddOptionsModal, setShowAddOptionsModal] = useState(false);
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});

  // Fetch items for selected space
  const { items: spaceItems } = useSpaceItems(currentSpaceId && currentSpaceId !== 'lobby' ? currentSpaceId : undefined);

  // Calculate scaled sizes
  const getScaled = (base: number) => Math.round(base * (scale / 100));
  const thumbWidth = getScaled(108);
  const thumbHeight = getScaled(68);
  const buttonSize = getScaled(108);
  const iconSize = getScaled(34);
  const actionButtonIconSize = getScaled(17);
  const spacing = getScaled(8); // Reduced spacing
  const padding = getScaled(6); // Reduced padding
  const fontSize = 'text-sm'; // Smaller font

  const handleMouseDown = (space: Space, event: React.MouseEvent) => {
    setWasLongPress(false);
    const timer = setTimeout(() => {
      // Show SpaceContextMenu on long press
      setWasLongPress(true);
      setContextMenu({
        space,
        position: { x: event.clientX, y: event.clientY }
      });
    }, 500); // 500ms press and hold
    setPressTimer(timer);
  };

  const handleContextMenu = (space: Space, event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({
      space,
      position: { x: event.clientX, y: event.clientY }
    });
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('space_items' as any)
        .delete()
        .eq('id', itemId);
      
      if (error) throw error;
      toast.success('Item deleted successfully');
      setShowDialPopup(false);
      // Trigger refetch by navigation or state update
      window.location.reload();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  const handleRenameItem = async (itemId: string, newName: string) => {
    try {
      const { error } = await supabase
        .from('space_items' as any)
        .update({ original_name: newName })
        .eq('id', itemId);
      
      if (error) throw error;
      toast.success('Item renamed successfully');
      setShowDialPopup(false);
      // Trigger refetch
      window.location.reload();
    } catch (error) {
      console.error('Error renaming item:', error);
      toast.error('Failed to rename item');
    }
  };

  const handleUseAsFilters = () => {
    setShowDialPopup(false);
    setDialPopupItem(null);
  };

  const handleAddOptionSelect = (optionId: string) => {
    if (optionId === 'space') {
      onCreateSpace();
    }
    // Handle other options as needed
    console.log('Add option selected:', optionId);
  };

  const handleMouseUp = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  };

  const handleMouseLeave = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  };

  // Use spaces from database, with home space first (already ordered correctly from useSpaces hook)
  const allSpaces: Space[] = spaces;

  const handleSpaceClick = (space: Space) => {
    if (onSpaceClick) {
      onSpaceClick(space);
    } else {
      if (space.isHome) {
        navigate('/');
      } else {
        navigate(`/space/${space.id}`);
      }
    }
  };

  // Optimized: Batch signed URL generation and use memo
  React.useEffect(() => {
    const generateUrls = async () => {
      const urls: Record<string, string> = {};
      const filesToSign: Array<{ id: string; path: string }> = [];
      
      // First pass: collect items needing signed URLs
      for (const item of spaceItems) {
        if (item.is_space) {
          if (item.thumbnail_path) {
            urls[item.id] = item.thumbnail_path;
          }
        } else {
          const pathToUse = item.thumbnail_path || item.storage_path;
          if (pathToUse) {
            filesToSign.push({ id: item.id, path: pathToUse });
          }
        }
      }
      
      // Batch sign URLs (Supabase supports this efficiently)
      if (filesToSign.length > 0) {
        const results = await Promise.allSettled(
          filesToSign.map(file =>
            supabase.storage
              .from('user-files')
              .createSignedUrl(file.path, 3600)
              .then(({ data }) => ({ id: file.id, url: data?.signedUrl }))
          )
        );
        
        results.forEach((result, idx) => {
          if (result.status === 'fulfilled' && result.value.url) {
            urls[result.value.id] = result.value.url;
          }
        });
      }
      
      setThumbUrls(urls);
    };

    if (spaceItems.length > 0) {
      generateUrls();
    } else {
      setThumbUrls({});
    }
  }, [spaceItems]);

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image')) return <ImageIcon size={iconSize * 0.4} />;
    if (fileType.startsWith('video')) return <Video size={iconSize * 0.4} />;
    if (fileType.startsWith('audio')) return <Music size={iconSize * 0.4} />;
    return <FileText size={iconSize * 0.4} />;
  };

  return (
    <>
      <div className="relative">
        {/* Spaces Bar - Floating with gradient background */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-transparent rounded-2xl"></div>
          <div className="relative flex items-center justify-between overflow-x-auto scrollbar-thin pt-4" style={{ padding: `${padding}px`, paddingTop: '16px' }}>
          {/* Show spaces with breadcrumb flow when a space is selected */}
          <div className="flex items-center w-full" style={{ gap: `${spacing}px` }}>
...
          </div>
        </div>
        </div>

        {/* Action Buttons (moved below spaces) - with border */}
        <div className="relative mt-2">
          <div className="absolute inset-0 bg-background/40 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg"></div>
          <div className="relative flex items-center justify-between gap-2 px-3 py-1.5">
...
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
          <SpaceContextMenu
            space={spaces.find(s => s.id === contextMenu.space.id) || contextMenu.space}
            isOpen={true}
            onClose={() => setContextMenu(null)}
            onDelete={onDeleteSpace}
            onRename={onRenameSpace}
            onUpdateDescription={onUpdateSpaceDescription}
            onUpdateThumbnail={onUpdateSpaceThumbnail}
            onReorder={onReorderSpace}
            onToggle360={onToggle360}
            on360AxisChange={on360AxisChange}
            on360VolumeChange={on360VolumeChange}
            on360MuteToggle={on360MuteToggle}
            on360RotationToggle={on360RotationToggle}
            on360RotationSpeedChange={on360RotationSpeedChange}
            on360RotationAxisChange={on360RotationAxisChange}
            onFlipHorizontalToggle={onFlipHorizontalToggle}
            onFlipVerticalToggle={onFlipVerticalToggle}
            position={contextMenu.position}
          />
        )}

      {/* Dial Popup */}
      <DialPopup
        isOpen={showDialPopup}
        item={dialPopupItem}
        onClose={() => setShowDialPopup(false)}
        onUseAsFilters={handleUseAsFilters}
        onDelete={handleDeleteItem}
        onRename={handleRenameItem}
      />

      {/* Add Options Modal */}
      <AddOptionsModal
        isOpen={showAddOptionsModal}
        onClose={() => setShowAddOptionsModal(false)}
        onOptionSelect={handleAddOptionSelect}
      />

      {/* AI Chat */}
      <AIChat
        isOpen={showAIChat}
        onClose={() => setShowAIChat(false)}
      />

      {/* Chat Window */}
      <ChatWindow
        isOpen={showChatWindow}
        onClose={() => setShowChatWindow(false)}
      />
      </>
  );
}