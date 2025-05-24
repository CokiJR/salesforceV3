-- Add photo_log_id column to route_stops table to reference photo_logs
ALTER TABLE route_stops 
ADD COLUMN IF NOT EXISTS photo_log_id UUID REFERENCES photo_logs(id) ON DELETE SET NULL;

-- Create index for better performance on photo_log_id queries
CREATE INDEX IF NOT EXISTS idx_route_stops_photo_log_id ON route_stops(photo_log_id);

-- Add comment to explain the column
COMMENT ON COLUMN route_stops.photo_log_id IS 'Reference to photo_logs table for outlet validation photos';