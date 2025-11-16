import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { X } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto h-full flex flex-col p-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Data Observation System</h1>
            <p className="text-foreground/80">
              Dial Organization System - Collapse the wave
            </p>
          </div>
          <Button onClick={onClose} variant="ghost" size="icon">
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Visualization Tabs */}
        <Tabs defaultValue="mindmap" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="mindmap">Mind Map</TabsTrigger>
            <TabsTrigger value="heatmap">Heat Map</TabsTrigger>
            <TabsTrigger value="charts">Charts</TabsTrigger>
            <TabsTrigger value="venn">Venn Diagram</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="mindmap" className="h-full m-0">
              <DOSMindMap metadata={metadata} loading={loading} />
            </TabsContent>

            <TabsContent value="heatmap" className="h-full m-0">
              <DOSHeatMap metadata={metadata} loading={loading} />
            </TabsContent>

            <TabsContent value="charts" className="h-full m-0">
              <DOSCharts metadata={metadata} loading={loading} />
            </TabsContent>

            <TabsContent value="venn" className="h-full m-0">
              <DOSVennDiagram metadata={metadata} loading={loading} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
