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
          className="absolute left-3 top-3 z-10 opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-grab active:cursor-grabbing"
        >
          <div className="bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-2xl border border-foreground/10 rounded-2xl p-2.5 shadow-xl hover:shadow-2xl hover:border-foreground/20 transition-all duration-200 hover:scale-105 active:scale-95">
            <div className="flex gap-0.5">
              <div className="w-1 h-1 rounded-full bg-foreground/40"></div>
              <div className="w-1 h-1 rounded-full bg-foreground/40"></div>
            </div>
            <div className="flex gap-0.5 mt-0.5">
              <div className="w-1 h-1 rounded-full bg-foreground/40"></div>
              <div className="w-1 h-1 rounded-full bg-foreground/40"></div>
            </div>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
