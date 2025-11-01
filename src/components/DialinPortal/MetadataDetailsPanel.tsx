import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, Tag, Users, Eye, Sparkles } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MetadataDetailsPanelProps {
  fileId: string;
}

interface ItemMetadata {
  hashtags: string[];
  dial_values: Record<string, any>;
  detected_objects: any[];
  detected_people: any[];
  detected_location: any;
  ai_confidence: number;
}

export const MetadataDetailsPanel = ({ fileId }: MetadataDetailsPanelProps) => {
  const [metadata, setMetadata] = useState<ItemMetadata | null>(null);
  const [viewCount, setViewCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetadata = async () => {
      setLoading(true);
      
      // Fetch item metadata
      const { data: metaData } = await supabase
        .from('item_metadata')
        .select('*')
        .eq('file_id', fileId)
        .single();

      // Fetch view count from files table
      const { data: fileData } = await supabase
        .from('files')
        .select('view_count')
        .eq('id', fileId)
        .single();

      if (metaData) {
        setMetadata(metaData as ItemMetadata);
      }
      
      if (fileData) {
        setViewCount(fileData.view_count || 0);
      }
      
      setLoading(false);
    };

    fetchMetadata();
  }, [fileId]);

  if (loading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading metadata...</div>;
  }

  if (!metadata) {
    return <div className="p-4 text-sm text-muted-foreground">No metadata available</div>;
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-4 p-4">
        {/* Performance Data */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4 text-primary" />
            <h3 className="font-semibold">Performance</h3>
          </div>
          <div className="text-2xl font-bold">{viewCount.toLocaleString()} views</div>
        </Card>

        {/* AI Confidence */}
        {metadata.ai_confidence > 0 && (
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="font-semibold">AI Confidence</h3>
            </div>
            <div className="text-sm text-muted-foreground">
              {(metadata.ai_confidence * 100).toFixed(0)}% confidence in analysis
            </div>
          </Card>
        )}

        {/* Hashtags */}
        {metadata.hashtags && metadata.hashtags.length > 0 && (
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-primary" />
              <h3 className="font-semibold">Hashtags</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {metadata.hashtags.map((tag, idx) => (
                <Badge key={idx} variant="secondary">
                  #{tag}
                </Badge>
              ))}
            </div>
          </Card>
        )}

        {/* Dial Values */}
        {metadata.dial_values && Object.keys(metadata.dial_values).length > 0 && (
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Dial Values</h3>
            <div className="space-y-2">
              {Object.entries(metadata.dial_values).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-sm capitalize">{key.replace(/_/g, ' ')}</span>
                  <Badge variant="outline">{String(value)}</Badge>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Detected Location */}
        {metadata.detected_location && (
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-primary" />
              <h3 className="font-semibold">Location</h3>
            </div>
            <div className="text-sm">
              {typeof metadata.detected_location === 'string' 
                ? metadata.detected_location 
                : JSON.stringify(metadata.detected_location, null, 2)}
            </div>
          </Card>
        )}

        {/* Detected People */}
        {metadata.detected_people && metadata.detected_people.length > 0 && (
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-primary" />
              <h3 className="font-semibold">Detected People</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {metadata.detected_people.map((person, idx) => (
                <Badge key={idx} variant="secondary">
                  {typeof person === 'string' ? person : JSON.stringify(person)}
                </Badge>
              ))}
            </div>
          </Card>
        )}

        {/* Detected Objects */}
        {metadata.detected_objects && metadata.detected_objects.length > 0 && (
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Detected Objects</h3>
            <div className="flex flex-wrap gap-2">
              {metadata.detected_objects.map((obj, idx) => (
                <Badge key={idx} variant="outline">
                  {typeof obj === 'string' ? obj : JSON.stringify(obj)}
                </Badge>
              ))}
            </div>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
};
