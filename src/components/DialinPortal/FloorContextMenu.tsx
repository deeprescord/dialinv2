import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Trash2, Edit3, GripVertical, X, Globe, MessageSquare } from 'lucide-react';
import { Floor } from '@/data/catalogs';
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

interface FloorContextMenuProps {
  floor: Floor;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (floorId: string) => void;
  onRename: (floorId: string, newName: string) => void;
  onUpdateDescription: (floorId: string, newDescription: string) => void;
  onReorder: (floorId: string, direction: 'left' | 'right') => void;
  onToggle360: (floorId: string, enabled: boolean) => void;
  position: { x: number; y: number };
}

export function FloorContextMenu({
  floor,
  isOpen,
  onClose,
  onDelete,
  onRename,
  onUpdateDescription,
  onReorder,
  onToggle360,
  position
}: FloorContextMenuProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [newName, setNewName] = useState(floor.name);
  const [newDescription, setNewDescription] = useState(floor.description || 'Welcome back');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleRename = () => {
    if (newName.trim() && newName !== floor.name) {
      onRename(floor.id, newName.trim());
    }
    setIsRenaming(false);
    onClose();
  };

  const handleDescriptionUpdate = () => {
    if (newDescription.trim() && newDescription !== floor.description) {
      onUpdateDescription(floor.id, newDescription.trim());
    }
    setIsEditingDescription(false);
    onClose();
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
      setNewName(floor.name);
      setNewDescription(floor.description || 'Welcome back');
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
              top: position.y + 250 > window.innerHeight 
                ? Math.max(10, position.y - 250)
                : position.y,
            }}
          >
            <div className="p-2">
              {/* Header */}
              <div className="flex items-center justify-between mb-3 px-2">
                <h3 className="text-sm font-medium text-foreground/80">Floor Options</h3>
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
                    placeholder="Floor name"
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
                  <p className="text-sm text-foreground font-medium">{floor.name}</p>
                  <p className="text-xs text-foreground/60">{floor.description || 'Welcome back'}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-1">
                {/* 360° Toggle */}
                <div 
                  className="flex items-center justify-between px-2 py-2 hover:bg-white/10 rounded cursor-pointer"
                  onClick={() => {
                    onToggle360(floor.id, !floor.show360);
                    onClose();
                  }}
                >
                  <div className="flex items-center">
                    <Globe size={14} className="mr-2" />
                    <span className="text-sm">360° View</span>
                  </div>
                  <Switch
                    checked={floor.show360 || false}
                    onCheckedChange={(checked) => {
                      onToggle360(floor.id, checked);
                      onClose();
                    }}
                  />
                </div>

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
                  onClick={() => {
                    onReorder(floor.id, 'left');
                    onClose();
                  }}
                >
                  <GripVertical size={14} className="mr-2" />
                  Move Left
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-8 px-2 hover:bg-white/10"
                  onClick={() => {
                    onReorder(floor.id, 'right');
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
                <AlertDialogTitle>Delete Floor</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{floor.name}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => {
                    onDelete(floor.id);
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