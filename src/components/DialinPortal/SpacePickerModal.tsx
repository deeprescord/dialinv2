import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Folder, Search, ChevronRight, Home } from 'lucide-react';

interface Space {
  id: string;
  name: string;
  parent_id: string | null;
  is_home: boolean;
}

interface SpacePickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (spaceId: string) => void;
  title: string;
  description: string;
  currentSpaceId?: string;
}

export function SpacePickerModal({
  open,
  onClose,
  onSelect,
  title,
  description,
  currentSpaceId,
}: SpacePickerModalProps) {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchSpaces();
    }
  }, [open]);

  const fetchSpaces = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('spaces')
        .select('id, name, parent_id, is_home')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setSpaces(data || []);
    } catch (error) {
      console.error('Error fetching spaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSpaces = spaces.filter(space => 
    space.id !== currentSpaceId && 
    space.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (spaceId: string) => {
    onSelect(spaceId);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-background/95 backdrop-blur-sm border-border/50">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search spaces..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background/50"
            />
          </div>

          <ScrollArea className="h-[300px] rounded-md border border-border/50">
            <div className="p-2 space-y-1">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading spaces...</div>
              ) : filteredSpaces.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No spaces found</div>
              ) : (
                filteredSpaces.map((space) => (
                  <Button
                    key={space.id}
                    variant="ghost"
                    className="w-full justify-start gap-2 h-auto py-3"
                    onClick={() => handleSelect(space.id)}
                  >
                    {space.is_home ? (
                      <Home className="h-4 w-4 text-primary" />
                    ) : (
                      <Folder className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="flex-1 text-left truncate">{space.name}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
