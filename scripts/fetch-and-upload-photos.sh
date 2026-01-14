#!/bin/bash
# Fetch photos from Google Places and upload to R2
# Run with: bash scripts/fetch-and-upload-photos.sh

API_KEY="AIzaSyDcfx96DicJ-DuyxlkLitXwEa4x1f0o7BU"
USER_ID="2f2859e6-2779-46ae-9018-5581ce7065b7"

mkdir -p scripts/photos
rm -f scripts/final-photos.sql

# Get venues without photos from database
echo "Getting venues without photos..."
VENUES=$(bunx wrangler d1 execute reviews-db --remote --command "SELECT v.id, v.name, v.address FROM venues v LEFT JOIN photos p ON v.id = p.venue_id WHERE p.id IS NULL" --json 2>/dev/null | jq -r '.[] | .results | .[] | "\(.id)|\(.name)|\(.address)"')

COUNT=0
TOTAL=$(echo "$VENUES" | wc -l | tr -d ' ')

echo "Found $TOTAL venues without photos"
echo ""

while IFS='|' read -r VENUE_ID VENUE_NAME VENUE_ADDRESS; do
  COUNT=$((COUNT + 1))
  echo "[$COUNT/$TOTAL] $VENUE_NAME"

  # Search Google Places
  SEARCH_QUERY=$(echo "$VENUE_NAME, $VENUE_ADDRESS" | sed 's/ /%20/g')
  PLACE_RESPONSE=$(curl -s "https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=$SEARCH_QUERY&inputtype=textquery&fields=place_id&key=$API_KEY")
  PLACE_ID=$(echo "$PLACE_RESPONSE" | jq -r '.candidates[0].place_id // empty')

  if [ -z "$PLACE_ID" ]; then
    echo "  No place found"
    continue
  fi

  # Get place details with photos
  DETAILS=$(curl -s "https://maps.googleapis.com/maps/api/place/details/json?place_id=$PLACE_ID&fields=photos&key=$API_KEY")
  PHOTO_REF=$(echo "$DETAILS" | jq -r '.result.photos[0].photo_reference // empty')

  if [ -z "$PHOTO_REF" ]; then
    echo "  No photos available"
    continue
  fi

  # Download photo
  PHOTO_FILE="scripts/photos/${VENUE_ID}.jpg"
  curl -sL "https://maps.googleapis.com/maps/api/place/photo?photo_reference=$PHOTO_REF&maxwidth=1200&key=$API_KEY" -o "$PHOTO_FILE"

  if [ ! -s "$PHOTO_FILE" ]; then
    echo "  Download failed"
    continue
  fi

  # Generate IDs
  PHOTO_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
  STORAGE_KEY="photos/${VENUE_ID}/${PHOTO_ID}.jpg"

  # Upload to R2 (REMOTE!)
  bunx wrangler r2 object put "reviews-photos/${STORAGE_KEY}" --file "$PHOTO_FILE" --content-type image/jpeg --remote > /dev/null 2>&1

  if [ $? -eq 0 ]; then
    echo "  Uploaded: $STORAGE_KEY"
    echo "INSERT INTO photos (id, venue_id, user_id, storage_key, original_filename, created_at) VALUES ('${PHOTO_ID}', '${VENUE_ID}', '${USER_ID}', '${STORAGE_KEY}', 'google-places.jpg', unixepoch());" >> scripts/final-photos.sql
  else
    echo "  Upload failed"
  fi

  # Rate limit
  sleep 0.2
done <<< "$VENUES"

echo ""
echo "Done! Running SQL..."
bunx wrangler d1 execute reviews-db --remote --file=scripts/final-photos.sql

echo ""
echo "Cleaning up..."
rm -rf scripts/photos
