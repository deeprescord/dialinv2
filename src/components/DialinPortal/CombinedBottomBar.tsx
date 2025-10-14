import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { PlusCircle, MessageSquare, Bot } from '../icons';
import { Close } from '../icons';
import { Space } from '@/data/catalogs';
import { ImageFallback } from '../ui/image-fallback';
import { SpaceContextMenu } from './SpaceContextMenu';
import { ItemsPeopleBar } from './ItemsPeopleBar';
import { SpacesBar } from './SpacesBar';
import { FloatingActionButtons } from './FloatingActionButtons';

interface CombinedBottomBarProps {
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
  className?: string;
  showChatWindow?: boolean;
  onToggleChatWindow?: () => void;
  showCreateSpaceModal?: boolean;
  showAIChat?: boolean;
  onToggleAIChat?: () => void;
}

export function CombinedBottomBar({
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
  className = "",
  showChatWindow,
  onToggleChatWindow,
  showCreateSpaceModal,
  showAIChat,
  onToggleAIChat
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

  // Create spaces with lobby at the start, filtering out any existing lobby
  const lobbySpace: Space = { id: 'lobby', name: 'Lobby', thumb: '/media/lobby-poster.png' };
  const filteredSpaces = spaces.filter(space => space.id !== 'lobby');
  const allSpaces = [lobbySpace, ...filteredSpaces];

  const handleSpaceClick = (space: Space) => {
    if (onSpaceClick) {
      onSpaceClick(space);
    } else {
      if (space.id === 'lobby') {
        navigate('/');
      } else {
        navigate(`/space/${space.id}`);
      }
    }
  };

  return (
    <>
      {/* Floating Action Buttons */}
      <FloatingActionButtons
        onAddClick={onCreateSpace}
        onAIClick={() => onToggleAIChat?.()}
        onChatClick={() => onToggleChatWindow?.()}
      />

      <div className="px-4 pb-4 space-y-4">
        {/* Items/People Bar - removed, now controlled by SpacesBar */}
        
        {/* Spaces Bar with resizable drag handle */}
        <SpacesBar
          spaces={spaces}
          currentSpaceId={currentSpaceId}
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
          onToggleAIChat={onToggleAIChat}
          onToggleChatWindow={onToggleChatWindow}
        />
      </div>
    </>
  );
}