import { 
  FolderPlus, 
  Move, 
  Link2, 
  Trash2, 
  GripVertical 
} from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

interface OrganizationMenuProps {
  children: React.ReactNode;
  itemId: string;
  isSpace: boolean;
  onAdd?: () => void;
  onMove?: () => void;
  onConnect?: () => void;
  onDelete?: () => void;
  isDraggable?: boolean;
}

export function OrganizationMenu({
  children,
  itemId,
  isSpace,
  onAdd,
  onMove,
  onConnect,
  onDelete,
  isDraggable = true,
}: OrganizationMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56 bg-background/95 backdrop-blur-sm border-border/50">
        {isDraggable && (
          <>
            <ContextMenuItem disabled className="text-muted-foreground">
              <GripVertical className="mr-2 h-4 w-4" />
              Drag to reorder
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}
        
        {onAdd && (
          <ContextMenuItem onClick={onAdd}>
            <FolderPlus className="mr-2 h-4 w-4" />
            Add to space
          </ContextMenuItem>
        )}
        
        {onMove && (
          <ContextMenuItem onClick={onMove}>
            <Move className="mr-2 h-4 w-4" />
            Move to space
          </ContextMenuItem>
        )}
        
        {isSpace && onConnect && (
          <ContextMenuItem onClick={onConnect}>
            <Link2 className="mr-2 h-4 w-4" />
            Connect spaces
          </ContextMenuItem>
        )}
        
        {onDelete && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem 
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
