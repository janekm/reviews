-- Add main_photo_id to venues for explicit main photo selection
ALTER TABLE venues ADD COLUMN main_photo_id TEXT REFERENCES photos(id);

-- Create index for the foreign key
CREATE INDEX idx_venues_main_photo ON venues(main_photo_id);
