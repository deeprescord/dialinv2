import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { PlusCircle, MessageSquare, Bot } from '../icons';
import { Close } from '../icons';
import { Space } from '@/data/catalogs';
import { ImageFallback } from '../ui/image-fallback';
import { SpaceContextMenu } from './SpaceContextMenu';
import { SpacesBar } from './SpacesBar';
import { FloatingActionButtons } from './FloatingActionButtons';
import { Friend } from '@/data/catalogs';

interface CombinedBottomBarProps {
  spaces: Space[];
  currentSpaceId?: string;
  breadcrumbs?: Array<{ id: string; name: string }>;
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
  className?: string;
  showChatWindow?: boolean;
  onToggleChatWindow?: () => void;
  showCreateSpaceModal?: boolean;
  showAIChat?: boolean;
  onToggleAIChat?: () => void;
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
  pinnedContacts?: Friend[];
  onContactClick?: (contact: Friend) => void;
  showPeopleBar?: boolean;
  isHome?: boolean;
}

export function CombinedBottomBar({
  spaces,
  currentSpaceId,
  breadcrumbs,
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
  className = "",
  showChatWindow,
  onToggleChatWindow,
  showCreateSpaceModal,
  showAIChat,
  onToggleAIChat,
  onToggleAddModal,
  videoControlsState,
  onVideoPlayPause,
  onVideoSeek,
  onVideoVolumeChange,
  onVideoMuteToggle,
  onToggleItemsBar,
  onTogglePeopleBar,
  pinnedContacts = [],
  onContactClick,
  showPeopleBar = false,
  isHome = false
}: CombinedBottomBarProps) {
  const navigate = useNavigate();
  const [contextMenu, setContextMenu] = useState<{
    space: Space;
    position: { x: number; y: number };
  } | null>(null);
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);

  const handleMouseDown = (space: Space, event: React.MouseEvent) => {
    const timer = setTimeout(() => {
      setContextMenu({
        space,
        position: { x: event.clientX, y: event.clientY }
      });
    }, 500);
    setPressTimer(timer);
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
  const allSpaces = spaces;

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

  return (
    <>
      <div className="px-4 pb-4 space-y-4">
        {/* Items/People Bar - removed, now controlled by SpacesBar */}
        
        {/* Spaces Bar with resizable drag handle */}
        <SpacesBar
          spaces={spaces}
          currentSpaceId={currentSpaceId}
          breadcrumbs={breadcrumbs}
          onCreateSpace={onCreateSpace}
          onDeleteSpace={onDeleteSpace}
          onRenameSpace={onRenameSpace}
          onUpdateSpaceDescription={onUpdateSpaceDescription}
          onUpdateSpaceThumbnail={onUpdateSpaceThumbnail}
          onReorderSpace={onReorderSpace}
          onToggle360={onToggle360}
          on360AxisChange={on360AxisChange}
          on360VolumeChange={on360VolumeChange}
          on360MuteToggle={on360MuteToggle}
          on360RotationToggle={on360RotationToggle}
          on360RotationSpeedChange={on360RotationSpeedChange}
          on360RotationAxisChange={on360RotationAxisChange}
          onFlipHorizontalToggle={onFlipHorizontalToggle}
          onFlipVerticalToggle={onFlipVerticalToggle}
          onSpaceClick={onSpaceClick}
          onItemClick={onItemClick}
          onToggleAIChat={onToggleAIChat}
          onToggleChatWindow={onToggleChatWindow}
          onToggleAddModal={onToggleAddModal}
          videoControlsState={videoControlsState}
          onVideoPlayPause={onVideoPlayPause}
          onVideoSeek={onVideoSeek}
          onVideoVolumeChange={onVideoVolumeChange}
          onVideoMuteToggle={onVideoMuteToggle}
          onToggleItemsBar={onToggleItemsBar}
          onTogglePeopleBar={onTogglePeopleBar}
          pinnedContacts={pinnedContacts}
          onContactClick={onContactClick}
          showPeopleBar={showPeopleBar}
          isHome={isHome}
        />
      </div>
    </>
  );
}