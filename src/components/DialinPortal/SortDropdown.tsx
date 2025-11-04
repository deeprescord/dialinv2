import { ArrowUpDown, Calendar, Type as TypeIcon, FileDigit, FolderTree } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import type { SortOrder } from '@/types/organization';

interface SortDropdownProps {
  currentSort: SortOrder;
  onSortChange: (sort: SortOrder) => void;
}

export function SortDropdown({ currentSort, onSortChange }: SortDropdownProps) {
  const sortOptions: { value: SortOrder; label: string; icon: any }[] = [
    { value: 'custom', label: 'Custom order', icon: FolderTree },
    { value: 'date-newest', label: 'Date (newest first)', icon: Calendar },
    { value: 'date-oldest', label: 'Date (oldest first)', icon: Calendar },
    { value: 'name-az', label: 'Name (A-Z)', icon: TypeIcon },
    { value: 'name-za', label: 'Name (Z-A)', icon: TypeIcon },
    { value: 'size-largest', label: 'Size (largest)', icon: FileDigit },
    { value: 'size-smallest', label: 'Size (smallest)', icon: FileDigit },
    { value: 'type', label: 'Type', icon: TypeIcon },
  ];

  const currentOption = sortOptions.find(opt => opt.value === currentSort);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="gap-2 bg-background/50 backdrop-blur-sm border-border/50"
        >
          <ArrowUpDown className="h-4 w-4" />
          <span className="hidden sm:inline">{currentOption?.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-background/95 backdrop-blur-sm border-border/50">
        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {sortOptions.map((option) => {
          const Icon = option.icon;
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onSortChange(option.value)}
              className={currentSort === option.value ? 'bg-accent' : ''}
            >
              <Icon className="mr-2 h-4 w-4" />
              {option.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
