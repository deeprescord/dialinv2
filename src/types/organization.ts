// Types for space and item organization features

export type SortOrder = 
  | 'custom' 
  | 'date-newest' 
  | 'date-oldest' 
  | 'name-az' 
  | 'name-za' 
  | 'size-largest' 
  | 'size-smallest'
  | 'type';

export interface SpaceConnection {
  id: string;
  from_space_id: string;
  to_space_id: string;
  created_by: string;
  created_at: string;
}

export interface OrganizationAction {
  type: 'add' | 'move' | 'connect' | 'delete' | 'reorder';
  itemId?: string;
  spaceId?: string;
  targetSpaceId?: string;
  isSpace?: boolean;
}
