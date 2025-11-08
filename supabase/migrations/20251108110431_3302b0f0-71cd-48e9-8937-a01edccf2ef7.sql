-- Add 360 display settings to files table
ALTER TABLE files
ADD COLUMN show_360 boolean DEFAULT false,
ADD COLUMN rotation_enabled boolean DEFAULT false,
ADD COLUMN rotation_speed numeric DEFAULT 1,
ADD COLUMN rotation_axis text DEFAULT 'x',
ADD COLUMN x_axis_offset numeric DEFAULT 0,
ADD COLUMN y_axis_offset numeric DEFAULT 0;