import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Trash2, Move, Plus, Link2, X } from 'lucide-react';
import { useSelection } from '@/contexts/SelectionContext';
import { useSpaceOrganization } from '@/hooks/useSpaceOrganization';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { SpacePickerModal } from './SpacePickerModal';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export function FloatingSelectionPanel() {
  const { selectedItems, clearSelection, isSelectMode } = useSelection();
  const { addToSpace, moveToSpace, connectSpaces } = useSpaceOrganization();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);

  if (!isSelectMode || selectedItems.length === 0) return null;

  const handleDelete = async () => {
    try {
      for (const item of selectedItems) {
        if (item.isSpace) {
          await supabase.from('spaces').delete().eq('id', item.id);
        } else {
          await supabase.from('files').delete().eq('id', item.id);
        }
      }
      toast.success(`Deleted ${selectedItems.length} item(s)`);
      clearSelection();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete items');
    }
    setShowDeleteDialog(false);
  };

  const handleMove = async (targetSpaceId: string) => {
    try {
      const currentSpaceId = window.location.pathname.split('/').pop();
      if (!currentSpaceId) throw new Error('No current space');

      for (const item of selectedItems) {
        await moveToSpace(item.id, currentSpaceId, targetSpaceId, item.isSpace);
      }
      toast.success(`Moved ${selectedItems.length} item(s)`);
      clearSelection();
    } catch (error) {
      console.error('Move error:', error);
      toast.error('Failed to move items');
    }
    setShowMoveModal(false);
  };

  const handleAdd = async (targetSpaceId: string) => {
    try {
      for (const item of selectedItems) {
        await addToSpace(item.id, targetSpaceId, item.isSpace);
      }
      toast.success(`Added ${selectedItems.length} item(s)`);
      clearSelection();
    } catch (error) {
      console.error('Add error:', error);
      toast.error('Failed to add items');
    }
    setShowAddModal(false);
  };

  const handleConnect = async (targetSpaceId: string) => {
    try {
      const spaces = selectedItems.filter(i => i.isSpace);
      if (spaces.length === 0) {
        toast.error('Can only connect spaces');
        return;
      }

      for (const space of spaces) {
        await connectSpaces(space.id, targetSpaceId);
      }
      toast.success(`Connected ${spaces.length} space(s)`);
      clearSelection();
    } catch (error) {
      console.error('Connect error:', error);
      toast.error('Failed to connect spaces');
    }
    setShowConnectModal(false);
  };

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-1/4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-2xl"
        >
          <div className="bg-background/95 backdrop-blur-lg border border-border rounded-2xl shadow-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {selectedItems.length} Selected
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearSelection}
                className="h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto pb-4 mb-4 border-b border-border">
              {selectedItems.map(item => (
                <div
                  key={item.id}
                  className="flex-shrink-0 w-16 h-16 rounded-lg bg-secondary/50 flex items-center justify-center text-xs text-center p-1 border border-border"
                >
                  {item.name}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-4 gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                className="flex flex-col gap-1 h-auto py-3"
              >
                <Trash2 className="w-5 h-5" />
                <span className="text-xs">Delete</span>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowMoveModal(true)}
                className="flex flex-col gap-1 h-auto py-3"
              >
                <Move className="w-5 h-5" />
                <span className="text-xs">Move</span>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowAddModal(true)}
                className="flex flex-col gap-1 h-auto py-3"
              >
                <Plus className="w-5 h-5" />
                <span className="text-xs">Add</span>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowConnectModal(true)}
                className="flex flex-col gap-1 h-auto py-3"
              >
                <Link2 className="w-5 h-5" />
                <span className="text-xs">Connect</span>
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedItems.length} item(s). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SpacePickerModal
        open={showMoveModal}
        onClose={() => setShowMoveModal(false)}
        onSelect={handleMove}
        title="Move to Space"
        description="Select the destination space"
      />

      <SpacePickerModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSelect={handleAdd}
        title="Add to Space"
        description="Select a space to add items to"
      />

      <SpacePickerModal
        open={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        onSelect={handleConnect}
        title="Connect to Space"
        description="Select a space to create semantic connections"
      />
    </>
  );
}
