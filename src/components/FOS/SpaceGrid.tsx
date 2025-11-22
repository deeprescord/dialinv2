import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Grid3x3, Globe } from 'lucide-react';
import { useItems } from '@/hooks/useItems';
import { useFileUpload } from '@/hooks/useFileUpload';
import { DragDropZone } from '@/components/DialinPortal/DragDropZone';
import { LensCard } from './LensCard';
import { ImmersiveView } from './ImmersiveView';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface SpaceGridProps {
  selectedSpace: string;
  viewMode: 'grid' | '360';
  setViewMode: (mode: 'grid' | '360') => void;
}

export function SpaceGrid({ selectedSpace, viewMode, setViewMode }: SpaceGridProps) {
  const { items, loading, fetchItems } = useItems();
  const { uploadMultipleFiles, uploading } = useFileUpload();

  useEffect(() => {
    fetchItems();
  }, []);

  const handleFilesDropped = async (files: File[]) => {
    try {
      // For now, we'll use a temporary space ID - in production this would come from user's spaces
      const tempSpaceId = 'temp-space-id';
      
      await uploadMultipleFiles(files, tempSpaceId);
      
      toast({
        title: "Item Entangled",
        description: `${files.length} item${files.length > 1 ? 's' : ''} successfully entangled into the field`,
      });
      
      // Refresh items after upload
      fetchItems();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Entanglement Failed",
        description: "Failed to entangle items into the field",
        variant: "destructive",
      });
    }
  };

  if (loading && items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-muted-foreground">Loading items...</div>
      </div>
    );
  }

  return (
    <DragDropZone onFilesDropped={handleFilesDropped}>
      <main className="flex-1 overflow-auto p-6 relative">
        {/* View Toggle */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-6 right-6 z-10 glass-card rounded-lg border border-border/20 p-1 flex gap-1"
        >
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="gap-2"
          >
            <Grid3x3 className="w-4 h-4" />
            Grid
          </Button>
          <Button
            variant={viewMode === '360' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('360')}
            className="gap-2"
          >
            <Globe className="w-4 h-4" />
            360
          </Button>
        </motion.div>

        {viewMode === 'grid' ? (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <h2 className="text-3xl font-bold text-foreground mb-2">
                {selectedSpace === 'all' ? 'All Items' : selectedSpace.charAt(0).toUpperCase() + selectedSpace.slice(1)}
              </h2>
              <p className="text-muted-foreground">
                {items.length} items in the field
              </p>
            </motion.div>

            {items.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-96 glass-card rounded-2xl border-2 border-dashed border-primary/30"
              >
                <p className="text-xl text-muted-foreground mb-2">Drop files here to entangle</p>
                <p className="text-sm text-muted-foreground/60">Or click to select files</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {items.map((item, index) => (
                  <LensCard key={item.id} item={item} index={index} />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="h-full">
            <ImmersiveView items={items} />
          </div>
        )}

        {uploading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed bottom-6 right-6 glass-card p-4 rounded-lg"
          >
            <p className="text-sm text-foreground">Entangling items...</p>
          </motion.div>
        )}
      </main>
    </DragDropZone>
  );
}
