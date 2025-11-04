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
          className="absolute left-3 top-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-grab active:cursor-grabbing"
        >
          <div className="bg-black/20 dark:bg-white/20 backdrop-blur-sm rounded-lg p-2 hover:bg-black/30 dark:hover:bg-white/30 transition-colors">
            <div className="flex gap-0.5">
              <div className="w-1 h-1 rounded-full bg-white/60 dark:bg-black/60"></div>
              <div className="w-1 h-1 rounded-full bg-white/60 dark:bg-black/60"></div>
            </div>
            <div className="flex gap-0.5 mt-0.5">
              <div className="w-1 h-1 rounded-full bg-white/60 dark:bg-black/60"></div>
              <div className="w-1 h-1 rounded-full bg-white/60 dark:bg-black/60"></div>
            </div>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
