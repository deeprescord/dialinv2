import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Grid3x3, Globe } from 'lucide-react';
import { useItems } from '@/hooks/useItems';
import { LensCard } from './LensCard';
import { ImmersiveView } from './ImmersiveView';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { manualSupabase } from '@/lib/manualSupabase';

interface SpaceGridProps {
  selectedSpace: string;
  viewMode: 'grid' | '360';
  setViewMode: (mode: 'grid' | '360') => void;
}

export function SpaceGrid({ selectedSpace, viewMode, setViewMode }: SpaceGridProps) {
  const { items, loading, fetchItems } = useItems();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (files: File[]) => {
    if (files.length === 0) return;

    // Debug: Log Supabase connection info
    console.log('🔍 SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
    console.log('🔍 Bucket name:', 'user_files');
    console.log('🔍 Files to process:', files.length);

    toast({
      title: "Ingesting Matter...",
      description: `Processing ${files.length} file${files.length > 1 ? 's' : ''}`,
    });

    try {
      const { data: { user } } = await manualSupabase.auth.getUser();
      const ownerId = user?.id || null;
      console.log('🔍 Owner ID:', ownerId || 'anonymous');
      const uploadedItems = [];
      
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const userFolder = ownerId || 'anonymous';
        const fileName = `${userFolder}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        
        console.log('📤 Uploading:', fileName, 'Size:', file.size, 'bytes');
        
        const { data: uploadData, error: uploadError } = await manualSupabase.storage
          .from('user_files')
          .upload(fileName, file);

        if (uploadError) {
          console.error('❌ Upload error:', uploadError);
          toast({
            title: "Upload Failed",
            description: `${file.name}: ${uploadError.message}`,
            variant: "destructive",
          });
          continue;
        }

        console.log('✅ File uploaded to storage:', uploadData.path);

        const { data: itemRecord, error: itemError } = await manualSupabase
          .from('items')
          .insert({
            owner_id: ownerId,
            file_url: uploadData.path,
            original_name: file.name,
            file_type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : 'other',
            mime_type: file.type,
          })
          .select()
          .single();

        if (itemError) {
          console.error('❌ Item creation error:', itemError);
          toast({
            title: "Database Error",
            description: `${file.name}: ${itemError.message}`,
            variant: "destructive",
          });
          continue;
        }

        if (itemRecord) {
          console.log('✅ Item created in database:', itemRecord.id);
          uploadedItems.push(itemRecord);
          toast({
            title: "Upload Successful",
            description: file.name,
          });
        }
      }

      if (uploadedItems.length > 0) {
        console.log('🎉 Entanglement complete! Refreshing items...');
        fetchItems();
        toast({
          title: "Entanglement Complete",
          description: `${uploadedItems.length} item${uploadedItems.length > 1 ? 's' : ''} entangled`,
        });
      } else {
        console.warn('⚠️ No items were successfully uploaded');
      }
    } catch (error) {
      console.error('💥 Unexpected error:', error);
      toast({
        title: "Entanglement Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchItems();

    // Global drop zone - attach to window
    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleWindowDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      console.log('Global drop detected', e.dataTransfer?.files);
      
      if (e.dataTransfer?.files) {
        const files = Array.from(e.dataTransfer.files);
        processFiles(files);
      }
    };

    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('drop', handleWindowDrop);

    return () => {
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      processFiles(files);
    }
  };

  const handleClickToUpload = () => {
    fileInputRef.current?.click();
  };

  if (loading && items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-muted-foreground">Loading items...</div>
      </div>
    );
  }

  return (
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
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileInputChange}
                  className="hidden"
                  accept="*/*"
                />
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={handleClickToUpload}
                  className="flex flex-col items-center justify-center h-96 glass-card rounded-2xl border-2 border-dashed border-primary/30 cursor-pointer hover:border-primary/50 transition-colors"
                >
                  <p className="text-xl text-muted-foreground mb-2">Drop files anywhere to entangle</p>
                  <p className="text-sm text-muted-foreground/60">Or click here to select files</p>
                </motion.div>
              </>
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

    </main>
  );
}
