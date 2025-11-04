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
          className="absolute left-2 top-2 z-10 opacity-30 group-hover:opacity-100 transition-all duration-200 cursor-grab active:cursor-grabbing hover:scale-110"
        >
          <div className="bg-dialin-purple/80 backdrop-blur-sm border-2 border-dialin-gold/50 rounded-lg p-1.5 shadow-lg">
            <GripVertical className="h-5 w-5 text-dialin-gold" />
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
