import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Slider } from '../ui/slider';
import { Trash2, Edit3, GripVertical, X, Globe, MessageSquare, ChevronDown, ChevronUp, Volume2, VolumeX, Image } from 'lucide-react';
import { Space } from '@/data/catalogs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

interface SpaceContextMenuProps {
  space: Space;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (spaceId: string) => void;
  onRename: (spaceId: string, newName: string) => void;
  onUpdateDescription: (spaceId: string, newDescription: string) => void;
  onUpdateThumbnail?: (spaceId: string, thumbnailUrl: string) => void;
  onReorder: (spaceId: string, direction: 'left' | 'right') => void;
  onToggle360: (spaceId: string, enabled: boolean) => void;
  on360AxisChange?: (spaceId: string, axis: 'x' | 'y', value: number) => void;
  on360VolumeChange?: (spaceId: string, volume: number) => void;
  on360MuteToggle?: (spaceId: string, muted: boolean) => void;
  position: { x: number; y: number };
}

export function SpaceContextMenu({
  space,
  isOpen,
  onClose,
  onDelete,
  onRename,
  onUpdateDescription,
  onUpdateThumbnail,
  onReorder,
  onToggle360,
  on360AxisChange,
  on360VolumeChange,
  on360MuteToggle,
  position
}: SpaceContextMenuProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [newName, setNewName] = useState(space.name);
  const [newDescription, setNewDescription] = useState(space.description || 'Welcome back');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [show360Advanced, setShow360Advanced] = useState(false);
  const [xAxis, setXAxis] = useState(space.xAxis || 0);
  const [yAxis, setYAxis] = useState(space.yAxis || 0);
  const [volume, setVolume] = useState(space.volume || 50);
  const [isMuted, setIsMuted] = useState(space.isMuted !== undefined ? space.isMuted : true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRename = () => {
    if (newName.trim() && newName !== space.name) {
      onRename(space.id, newName.trim());
    }
    setIsRenaming(false);
    onClose();
  };

  const handleDescriptionUpdate = () => {
    if (newDescription.trim() && newDescription !== space.description) {
      onUpdateDescription(space.id, newDescription.trim());
    }
    setIsEditingDescription(false);
    onClose();
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpdateThumbnail) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          onUpdateThumbnail(space.id, result);
          onClose();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (isRenaming) {
        handleRename();
      } else if (isEditingDescription) {
        handleDescriptionUpdate();
      }
    } else if (e.key === 'Escape') {
      setIsRenaming(false);
      setIsEditingDescription(false);
      setNewName(space.name);
      setNewDescription(space.description || 'Welcome back');
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Context Menu */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed z-50 bg-background/95 backdrop-blur-md border border-white/20 rounded-lg shadow-lg min-w-48"
            style={{
              left: Math.min(position.x, window.innerWidth - 200),
              top: position.y + 350 > window.innerHeight 
                ? Math.max(10, window.innerHeight - 460)
                : position.y - 100,
            }}
          >
            <div className="p-2">
              {/* Header */}
              <div className="flex items-center justify-between mb-3 px-2">
                <h3 className="text-sm font-medium text-foreground/80">Space Options</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-white/10"
                  onClick={onClose}
                >
                  <X size={12} />
                </Button>
              </div>

              {/* Rename Section */}
              {isRenaming ? (
                <div className="mb-3 px-2">
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={handleKeyPress}
                    onBlur={handleRename}
                    className="text-sm h-8"
                    autoFocus
                    placeholder="Space name"
                  />
                </div>
              ) : isEditingDescription ? (
                <div className="mb-3 px-2">
                  <Textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    onKeyDown={handleKeyPress}
                    onBlur={handleDescriptionUpdate}
                    className="text-sm resize-none"
                    rows={2}
                    autoFocus
                    placeholder="Welcome back phrase"
                  />
                </div>
              ) : (
                <div className="mb-3 px-2 space-y-1">
                  <p 
                    className="text-sm text-foreground font-medium cursor-pointer hover:text-primary transition-colors" 
                    onClick={() => setIsRenaming(true)}
                  >
                    {space.name}
                  </p>
                  <p 
                    className="text-xs text-foreground/60 cursor-pointer hover:text-foreground/80 transition-colors" 
                    onClick={() => setIsEditingDescription(true)}
                  >
                    {space.description || 'Welcome back'}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-1">
                {/* 360° Toggle */}
                <div className="border-b border-white/10 pb-2 mb-2">
                  <div 
                    className="flex items-center justify-between px-2 py-2 hover:bg-white/10 rounded cursor-pointer"
                    onClick={() => {
                      onToggle360(space.id, !space.show360);
                    }}
                  >
                    <div className="flex items-center">
                      <Globe size={14} className="mr-2" />
                      <span className="text-sm">360° View</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={space.show360 || false}
                        onCheckedChange={(checked) => {
                          onToggle360(space.id, checked);
                        }}
                      />
                      {space.show360 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShow360Advanced(!show360Advanced);
                          }}
                          className="p-1 hover:bg-white/10 rounded"
                        >
                          {show360Advanced ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Advanced 360° Controls */}
                  {space.show360 && show360Advanced && (
                    <div className="px-2 py-3 space-y-4 bg-background/50 rounded-md mx-2 mt-2">
                      {/* X Axis Control */}
                      <div className="space-y-2">
                        <label className="text-xs text-foreground/70">X Axis</label>
                        <Slider
                          value={[xAxis]}
                          onValueChange={(value) => {
                            setXAxis(value[0]);
                            on360AxisChange?.(space.id, 'x', value[0]);
                          }}
                          min={-180}
                          max={180}
                          step={1}
                          className="w-full"
                        />
                        <span className="text-xs text-foreground/60">{xAxis}°</span>
                      </div>

                      {/* Y Axis Control */}
                      <div className="space-y-2">
                        <label className="text-xs text-foreground/70">Y Axis</label>
                        <Slider
                          value={[yAxis]}
                          onValueChange={(value) => {
                            setYAxis(value[0]);
                            on360AxisChange?.(space.id, 'y', value[0]);
                          }}
                          min={-90}
                          max={90}
                          step={1}
                          className="w-full"
                        />
                        <span className="text-xs text-foreground/60">{yAxis}°</span>
                      </div>

                      {/* Mute Toggle */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {isMuted ? <VolumeX size={12} className="mr-2" /> : <Volume2 size={12} className="mr-2" />}
                          <span className="text-xs">Audio</span>
                        </div>
                        <Switch
                          checked={!isMuted}
                          onCheckedChange={(checked) => {
                            setIsMuted(!checked);
                            on360MuteToggle?.(space.id, !checked);
                          }}
                        />
                      </div>

                      {/* Volume Control */}
                      {!isMuted && (
                        <div className="space-y-2">
                          <label className="text-xs text-foreground/70">Volume</label>
                          <Slider
                            value={[volume]}
                            onValueChange={(value) => {
                              setVolume(value[0]);
                              on360VolumeChange?.(space.id, value[0]);
                            }}
                            min={0}
                            max={100}
                            step={1}
                            className="w-full"
                          />
                          <span className="text-xs text-foreground/60">{volume}%</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-8 px-2 hover:bg-white/10"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Image size={14} className="mr-2" />
                  Change Thumbnail
                </Button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  style={{ display: 'none' }}
                />

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-8 px-2 hover:bg-white/10"
                  onClick={() => setIsRenaming(true)}
                  disabled={isRenaming || isEditingDescription}
                >
                  <Edit3 size={14} className="mr-2" />
                  Rename
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-8 px-2 hover:bg-white/10"
                  onClick={() => setIsEditingDescription(true)}
                  disabled={isRenaming || isEditingDescription}
                >
                  <MessageSquare size={14} className="mr-2" />
                  Edit Description
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-8 px-2 hover:bg-white/10"
                  onClick={() => onReorder(space.id, 'left')}
                >
                  <GripVertical size={14} className="mr-2" />
                  Move Left
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-8 px-2 hover:bg-white/10"
                  onClick={() => {
                    onReorder(space.id, 'right');
                    onClose();
                  }}
                >
                  <GripVertical size={14} className="mr-2" />
                  Move Right
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-8 px-2 hover:bg-destructive/20 text-destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 size={14} className="mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Space</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{space.name}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => {
                    onDelete(space.id);
                    setShowDeleteConfirm(false);
                    onClose();
                  }}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </AnimatePresence>
  );
}