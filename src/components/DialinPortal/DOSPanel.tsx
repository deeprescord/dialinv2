import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { X, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DOSMindMap } from './DOSMindMap';
import { DOSHeatMap } from './DOSHeatMap';
import { DOSCharts } from './DOSCharts';
import { DOSVennDiagram } from './DOSVennDiagram';

interface DOSPanelProps {
  onClose: () => void;
  itemId?: string;
  spaceId?: string;
  isSpace?: boolean;
}

export interface MetadataItem {
  id: string;
  file_id: string;
  hashtags: string[];
  dial_values: Json;
  detected_objects: Json;
  detected_people: Json;
  ai_confidence: number;
  created_at: string;
}

export function DOSPanel({ onClose, itemId, spaceId, isSpace }: DOSPanelProps) {
  const [metadata, setMetadata] = useState<MetadataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    loadMetadata();
  }, [itemId, spaceId]);

  const loadMetadata = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('item_metadata')
        .select('*')
        .eq('user_id', user.id);

      // If specific item, load just that
      if (itemId && !isSpace) {
        query = query.eq('file_id', itemId);
      }
      // If space, load all items in that space
      else if (spaceId) {
        const { data: spaceFiles } = await supabase
          .from('space_files')
          .select('file_id')
          .eq('space_id', spaceId);

        if (spaceFiles?.length) {
          const fileIds = spaceFiles.map(sf => sf.file_id);
          query = query.in('file_id', fileIds);
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setMetadata(data || []);
    } catch (error) {
      console.error('Error loading metadata:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-background/95 backdrop-blur-sm">
      <div className={`container mx-auto h-full flex flex-col max-w-4xl max-h-[92vh] overflow-y-auto ${
        isCompact ? 'p-3 md:p-4 mt-3 md:mt-4' : 'p-6 md:p-8 mt-6 md:mt-8'
      }`}>
        {/* Header */}
        <div className={`sticky top-0 z-10 bg-background/95 backdrop-blur flex items-center justify-between border-b border-border ${
          isCompact ? 'mb-3 md:mb-4 pb-2' : 'mb-6 md:mb-8 pb-3 md:pb-4'
        }`}>
          <div className="flex-1 min-w-0 pr-4">
            <h1 className={`font-bold text-foreground ${isCompact ? 'text-lg mb-0.5' : 'text-2xl mb-1'}`}>
              Data Observation System
            </h1>
            <p className={`text-muted-foreground ${isCompact ? 'text-xs' : 'text-sm'}`}>
              {isSpace ? 'Analyzing space metadata' : 'Analyzing item metadata'}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button 
              onClick={() => setIsCompact(!isCompact)} 
              variant="ghost" 
              size="icon"
              title={isCompact ? "Expand view" : "Compact view"}
            >
              {isCompact ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button onClick={onClose} variant="ghost" size="icon">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Visualization Tabs */}
        <Tabs defaultValue="mindmap" className="flex-1 flex flex-col min-h-0">
          <TabsList className={`grid w-full grid-cols-4 bg-muted ${isCompact ? 'mb-3 h-8' : 'mb-6'}`}>
            <TabsTrigger value="mindmap" className={isCompact ? 'text-xs px-2' : ''}>
              {isCompact ? 'Mind' : 'Mind Map'}
            </TabsTrigger>
            <TabsTrigger value="heatmap" className={isCompact ? 'text-xs px-2' : ''}>
              {isCompact ? 'Heat' : 'Heat Map'}
            </TabsTrigger>
            <TabsTrigger value="charts" className={isCompact ? 'text-xs px-2' : ''}>
              Charts
            </TabsTrigger>
            <TabsTrigger value="venn" className={isCompact ? 'text-xs px-2' : ''}>
              Venn
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-0">
            <TabsContent 
              value="mindmap" 
              className={`m-0 data-[state=active]:flex data-[state=active]:flex-col ${
                isCompact ? 'h-[50vh] min-h-[280px]' : 'h-[60vh] min-h-[360px]'
              }`}
            >
              <DOSMindMap metadata={metadata} loading={loading} />
            </TabsContent>

            <TabsContent 
              value="heatmap" 
              className={`m-0 data-[state=active]:flex data-[state=active]:flex-col ${
                isCompact ? 'h-[50vh] min-h-[280px]' : 'h-[60vh] min-h-[360px]'
              }`}
            >
              <DOSHeatMap metadata={metadata} loading={loading} />
            </TabsContent>

            <TabsContent 
              value="charts" 
              className={`m-0 data-[state=active]:flex data-[state=active]:flex-col ${
                isCompact ? 'h-[50vh] min-h-[280px]' : 'h-[60vh] min-h-[360px]'
              }`}
            >
              <DOSCharts metadata={metadata} loading={loading} />
            </TabsContent>

            <TabsContent 
              value="venn" 
              className={`m-0 data-[state=active]:flex data-[state=active]:flex-col ${
                isCompact ? 'h-[50vh] min-h-[280px]' : 'h-[60vh] min-h-[360px]'
              }`}
            >
              <DOSVennDiagram metadata={metadata} loading={loading} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
