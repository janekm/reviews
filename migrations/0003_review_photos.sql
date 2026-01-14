-- Add reviewId to photos table for review-attached photos
ALTER TABLE photos ADD COLUMN review_id TEXT REFERENCES reviews(id);

-- Add updatedAt to reviews table for edit tracking
ALTER TABLE reviews ADD COLUMN updated_at INTEGER;

-- Create index for efficient review photo lookups
CREATE INDEX idx_photos_review_id ON photos(review_id);
