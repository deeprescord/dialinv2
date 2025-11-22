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
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed top-[12vh] left-0 right-0 z-[200] mx-auto w-[95%] max-w-6xl"
        >
          <div className="glass-card backdrop-blur-2xl bg-background/40 border-2 border-primary/30 rounded-3xl shadow-2xl p-4 relative overflow-hidden">
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none rounded-3xl" />
            
            <div className="relative z-10">
              {/* Header with count and cancel */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-primary/30 flex items-center justify-center border border-primary/50">
                    <span className="text-lg font-bold text-primary">{selectedItems.length}</span>
                  </div>
                  <div>
                    <span className="text-base font-semibold text-foreground block">
                      Selection Mode
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Tap items in space bar to select
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearSelection}
                  className="h-12 w-12 rounded-2xl hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Selected items scroll area - horizontal carousel */}
              <div className="flex items-center gap-3 overflow-x-auto pb-3 mb-4 border-b border-primary/20 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                {selectedItems.map(item => (
                  <div
                    key={item.id}
                    className="flex-shrink-0 w-24 h-24 rounded-2xl glass-card bg-secondary/30 border border-primary/30 flex items-center justify-center text-xs text-center p-3 hover:border-primary/50 transition-all hover:scale-105"
                  >
                    {item.thumbnailUrl && (
                      <img 
                        src={item.thumbnailUrl} 
                        alt={item.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    )}
                    {!item.thumbnailUrl && (
                      <span className="line-clamp-3 font-medium">{item.name}</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={clearSelection}
                  className="flex flex-col gap-2 h-auto py-4 rounded-2xl glass-card border-border/50 hover:border-border hover:bg-secondary/50"
                >
                  <X className="w-5 h-5" />
                  <span className="text-xs font-medium">Cancel</span>
                </Button>

                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => setShowAddModal(true)}
                  className="flex flex-col gap-2 h-auto py-4 rounded-2xl glass-card border-primary/20 hover:border-primary/40 hover:bg-primary/10"
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-xs font-medium">Add</span>
                </Button>

                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => setShowMoveModal(true)}
                  className="flex flex-col gap-2 h-auto py-4 rounded-2xl glass-card border-primary/20 hover:border-primary/40 hover:bg-primary/10"
                >
                  <Move className="w-5 h-5" />
                  <span className="text-xs font-medium">Move</span>
                </Button>

                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => setShowConnectModal(true)}
                  className="flex flex-col gap-2 h-auto py-4 rounded-2xl glass-card border-primary/20 hover:border-primary/40 hover:bg-primary/10"
                >
                  <Link2 className="w-5 h-5" />
                  <span className="text-xs font-medium">Connect</span>
                </Button>

                <Button
                  variant="destructive"
                  size="lg"
                  onClick={() => setShowDeleteDialog(true)}
                  className="flex flex-col gap-2 h-auto py-4 rounded-2xl glass-card border-destructive/30 hover:border-destructive/50"
                >
                  <Trash2 className="w-5 h-5" />
                  <span className="text-xs font-medium">Delete</span>
                </Button>
              </div>
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
