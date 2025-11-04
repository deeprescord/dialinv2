import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DraggableItemProps {
  id: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export function DraggableItem({ id, children, disabled = false, className }: DraggableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group',
        isDragging && 'opacity-50 z-50',
        className
      )}
    >
      {!disabled && (
        <div
          {...attributes}
          {...listeners}
          className="absolute left-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-grab active:cursor-grabbing"
        >
          <div className="bg-background/60 backdrop-blur-xl border border-border/40 rounded-xl p-2 shadow-2xl hover:shadow-primary/20 hover:border-primary/60 hover:bg-background/80 transition-all duration-200 hover:scale-110">
            <GripVertical className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
