import type { SpaceItem } from '@/hooks/useSpaceItems';
import type { SortOrder } from '@/types/organization';

export function sortItems(items: SpaceItem[], sortOrder: SortOrder): SpaceItem[] {
  const sorted = [...items];

  switch (sortOrder) {
    case 'custom':
      return sorted.sort((a, b) => (a.position || 0) - (b.position || 0));
    
    case 'date-newest':
      return sorted.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    
    case 'date-oldest':
      return sorted.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    
    case 'name-az':
      return sorted.sort((a, b) => 
        a.original_name.localeCompare(b.original_name)
      );
    
    case 'name-za':
      return sorted.sort((a, b) => 
        b.original_name.localeCompare(a.original_name)
      );
    
    case 'size-largest':
      return sorted.sort((a, b) => (b.file_size || 0) - (a.file_size || 0));
    
    case 'size-smallest':
      return sorted.sort((a, b) => (a.file_size || 0) - (b.file_size || 0));
    
    case 'type':
      return sorted.sort((a, b) => {
        // Spaces first, then by file type
        if (a.is_space && !b.is_space) return -1;
        if (!a.is_space && b.is_space) return 1;
        return a.file_type.localeCompare(b.file_type);
      });
    
    default:
      return sorted;
  }
}
