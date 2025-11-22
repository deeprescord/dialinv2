import { 
  FolderPlus, 
  Move, 
  Link2, 
  Trash2, 
  GripVertical,
  Edit,
  CheckSquare,
  EyeOff
} from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { useSelection } from '@/contexts/SelectionContext';

interface OrganizationMenuProps {
  children: React.ReactNode;
  itemId: string;
  isSpace: boolean;
  itemName: string;
  thumbnailUrl?: string;
  onAdd?: () => void;
  onMove?: () => void;
  onConnect?: () => void;
  onDelete?: () => void;
  onEditMetadata?: () => void;
  onHide?: () => void;
  isDraggable?: boolean;
}

export function OrganizationMenu({
  children,
  itemId,
  isSpace,
  itemName,
  thumbnailUrl,
  onAdd,
  onMove,
  onConnect,
  onDelete,
  onEditMetadata,
  onHide,
  isDraggable = true,
}: OrganizationMenuProps) {
  const { addToSelection, toggleSelectMode, isSelectMode } = useSelection();

  const handleSelect = () => {
    addToSelection({
      id: itemId,
      type: isSpace ? 'space' : 'file',
      name: itemName,
      thumbnailUrl,
      isSpace,
    });
    if (!isSelectMode) {
      toggleSelectMode();
    }
  };

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
        
        {!isSpace && onEditMetadata && (
          <ContextMenuItem onClick={onEditMetadata}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Metadata
          </ContextMenuItem>
        )}
        
        {onHide && (
          <ContextMenuItem onClick={onHide}>
            <EyeOff className="mr-2 h-4 w-4" />
            Hide
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
