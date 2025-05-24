-- Create photo_logs table for storing compressed images and location data
CREATE TABLE IF NOT EXISTS photo_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    image_url TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS (Row Level Security) policies
ALTER TABLE photo_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read all photo logs
CREATE POLICY "Allow authenticated users to read photo logs" ON photo_logs
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to insert photo logs
CREATE POLICY "Allow authenticated users to insert photo logs" ON photo_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to update photo logs
CREATE POLICY "Allow authenticated users to update photo logs" ON photo_logs
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to delete photo logs
CREATE POLICY "Allow authenticated users to delete photo logs" ON photo_logs
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create index for better performance on created_at queries
CREATE INDEX IF NOT EXISTS idx_photo_logs_created_at ON photo_logs(created_at DESC);

-- Create index for location-based queries
CREATE INDEX IF NOT EXISTS idx_photo_logs_location ON photo_logs(latitude, longitude);

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_photo_logs_updated_at BEFORE UPDATE ON photo_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();