import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Card } from '../ui/card';
import { ImageFallback } from '../ui/image-fallback';
import { DraggableItem } from './DraggableItem';
import { OrganizationMenu } from './OrganizationMenu';

interface GridItem {
  id: string;
  title: string;
  thumb: string;
  sharedBy?: string;
  sharedByAvatar?: string;
  duration?: string;
  artist?: string;
  distance?: string;
}

interface MediaGridProps {
  items: GridItem[];
  onItemClick: (item: any) => void;
  onItemLongPress?: (item: any) => void;
  enableDragDrop?: boolean;
  onReorder?: (itemIds: string[]) => void;
  onAdd?: (itemId: string, isSpace: boolean) => void;
  onMove?: (itemId: string, isSpace: boolean) => void;
  onConnect?: (itemId: string) => void;
  onDelete?: (itemId: string, isSpace: boolean) => void;
}

export function MediaGrid({ 
  items, 
  onItemClick, 
  onItemLongPress,
  enableDragDrop = false,
  onReorder,
  onAdd,
  onMove,
  onConnect,
  onDelete
}: MediaGridProps) {
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [isPressed, setIsPressed] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id && onReorder) {
      const oldIndex = items.findIndex(item => item.id === active.id);
      const newIndex = items.findIndex(item => item.id === over.id);
      
      const newItems = [...items];
      const [movedItem] = newItems.splice(oldIndex, 1);
      newItems.splice(newIndex, 0, movedItem);
      
      onReorder(newItems.map(item => item.id));
    }
  };

  const handleMouseDown = (item: GridItem) => {
    setIsPressed(item.id);
    if (onItemLongPress) {
      const timer = setTimeout(() => {
        onItemLongPress(item);
        setIsPressed(null);
      }, 550);
      setPressTimer(timer);
    }
  };

  const handleMouseUp = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
    setIsPressed(null);
  };

  const handleClick = (item: GridItem) => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
      setIsPressed(null);
    }
    onItemClick(item);
  };

  const gridContent = (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 px-4">
      {items.map((item, index) => {
        const isSpace = !!(item as any).is_space;
        const cardContent = (
          <Card 
            className={`glass-card hover:bg-white/10 cursor-pointer transition-all duration-200 ${
              enableDragDrop ? 'overflow-visible' : 'overflow-hidden'
            } group hover-lift ${
              isPressed === item.id ? 'scale-95' : ''
            }`}
            onMouseDown={() => handleMouseDown(item)}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={() => handleClick(item)}
          >
            <div className={`relative ${enableDragDrop ? '' : 'overflow-hidden'}`}>
              <ImageFallback 
                src={item.thumb} 
                alt={item.title}
                className={`w-full h-32 sm:h-40 object-cover ${enableDragDrop ? 'rounded-t-lg' : ''}`}
              />
              {item.duration && (
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {item.duration}
                </div>
              )}
            </div>
            <div className="p-3 sm:p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm mb-1 line-clamp-3">{item.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {item.sharedBy || item.artist || item.distance || ''}
                  </p>
                </div>
                {item.sharedByAvatar && (
                  <Avatar className="h-6 w-6 flex-shrink-0">
                    <AvatarImage src={item.sharedByAvatar} />
                    <AvatarFallback>{item.sharedBy?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>
          </Card>
        );

        const wrappedCard = enableDragDrop ? (
          <DraggableItem key={item.id} id={item.id}>
            {cardContent}
          </DraggableItem>
        ) : (
          <div key={item.id}>{cardContent}</div>
        );

        const withContextMenu = (onAdd || onMove || onConnect || onDelete) ? (
          <OrganizationMenu
            key={item.id}
            itemId={item.id}
            isSpace={isSpace}
            onAdd={onAdd ? () => onAdd(item.id, isSpace) : undefined}
            onMove={onMove ? () => onMove(item.id, isSpace) : undefined}
            onConnect={isSpace && onConnect ? () => onConnect(item.id) : undefined}
            onDelete={onDelete ? () => onDelete(item.id, isSpace) : undefined}
            isDraggable={enableDragDrop}
          >
            {wrappedCard}
          </OrganizationMenu>
        ) : wrappedCard;

        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            {withContextMenu}
          </motion.div>
        );
      })}
    </div>
  );

  if (enableDragDrop) {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items.map(i => i.id)} strategy={rectSortingStrategy}>
          {gridContent}
        </SortableContext>
      </DndContext>
    );
  }

  return gridContent;
}