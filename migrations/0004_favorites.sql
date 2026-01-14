-- Favorites table for users to bookmark venues
CREATE TABLE favorites (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  venue_id TEXT NOT NULL REFERENCES venues(id),
  created_at INTEGER NOT NULL,
  UNIQUE(user_id, venue_id)
);

-- Index for efficient lookups
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_venue_id ON favorites(venue_id);
