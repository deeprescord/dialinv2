-- Add position column to space_files for custom ordering
ALTER TABLE space_files ADD COLUMN position INTEGER DEFAULT 0;

-- Add position column to spaces for child space ordering
ALTER TABLE spaces ADD COLUMN position INTEGER DEFAULT 0;

-- Create space_connections table for linking spaces
CREATE TABLE space_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  to_space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(from_space_id, to_space_id)
);

-- Enable RLS on space_connections
ALTER TABLE space_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for space_connections
CREATE POLICY "Users can create connections for their own spaces"
  ON space_connections
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM spaces 
      WHERE id = from_space_id AND user_id = auth.uid()
    ) AND auth.uid() = created_by
  );

CREATE POLICY "Users can view connections for their spaces"
  ON space_connections
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM spaces 
      WHERE (id = from_space_id OR id = to_space_id) AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete connections for their own spaces"
  ON space_connections
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM spaces 
      WHERE id = from_space_id AND user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_space_files_position ON space_files(space_id, position);
CREATE INDEX idx_spaces_position ON spaces(parent_id, position);
CREATE INDEX idx_space_connections_from ON space_connections(from_space_id);
CREATE INDEX idx_space_connections_to ON space_connections(to_space_id);