/**
 * Fetch photos from Google Places API for venues without photos.
 * Run with: bun run scripts/fetch-photos.ts
 *
 * This script:
 * 1. Fetches all venues from the production database
 * 2. Checks which ones have no photos
 * 3. Searches Google Places for matching venues
 * 4. Downloads photos and uploads to R2
 * 5. Creates photo records in the database
 */

const API_KEY = process.env.GOOGLE_PLACES_API_KEY || "AIzaSyDcfx96DicJ-DuyxlkLitXwEa4x1f0o7BU";
const WORKER_URL = "https://spitalfields-reviews.janekm.workers.dev";

interface Venue {
  id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  photoStorageKey: string | null;
}

interface PlaceSearchResult {
  candidates?: Array<{
    place_id: string;
    name: string;
    photos?: Array<{
      photo_reference: string;
      height: number;
      width: number;
    }>;
  }>;
  status: string;
  error_message?: string;
}

interface PlaceDetailsResult {
  result?: {
    place_id: string;
    name: string;
    photos?: Array<{
      photo_reference: string;
      height: number;
      width: number;
      html_attributions: string[];
    }>;
  };
  status: string;
  error_message?: string;
}

async function findPlace(name: string, address: string | null, lat: number | null, lng: number | null): Promise<string | null> {
  const input = address ? `${name}, ${address}` : name;
  const url = new URL("https://maps.googleapis.com/maps/api/place/findplacefromtext/json");
  url.searchParams.set("input", input);
  url.searchParams.set("inputtype", "textquery");
  url.searchParams.set("fields", "place_id,name,photos");
  url.searchParams.set("key", API_KEY);

  if (lat && lng) {
    url.searchParams.set("locationbias", `point:${lat},${lng}`);
  }

  const response = await fetch(url.toString());
  const data = await response.json() as PlaceSearchResult;

  if (data.status !== "OK" || !data.candidates?.length) {
    return null;
  }

  return data.candidates[0].place_id;
}

async function getPlacePhotos(placeId: string): Promise<string[]> {
  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "photos");
  url.searchParams.set("key", API_KEY);

  const response = await fetch(url.toString());
  const data = await response.json() as PlaceDetailsResult;

  if (data.status !== "OK" || !data.result?.photos?.length) {
    return [];
  }

  // Return up to 3 photo references
  return data.result.photos.slice(0, 3).map(p => p.photo_reference);
}

async function downloadPhoto(photoReference: string): Promise<ArrayBuffer | null> {
  const url = new URL("https://maps.googleapis.com/maps/api/place/photo");
  url.searchParams.set("photo_reference", photoReference);
  url.searchParams.set("maxwidth", "1200");
  url.searchParams.set("key", API_KEY);

  try {
    const response = await fetch(url.toString(), { redirect: "follow" });
    if (!response.ok) {
      console.error(`  Failed to download photo: ${response.status}`);
      return null;
    }
    return await response.arrayBuffer();
  } catch (err) {
    console.error(`  Error downloading photo:`, err);
    return null;
  }
}

async function uploadPhotoToR2(
  venueId: string,
  photoData: ArrayBuffer,
  index: number
): Promise<{ storageKey: string; photoId: string } | null> {
  // Generate storage key
  const timestamp = Date.now();
  const storageKey = `photos/${venueId}/${timestamp}-${index}.jpg`;
  const photoId = crypto.randomUUID();

  // We need to upload directly to R2 via the worker
  // For now, let's output the SQL to insert the photos manually
  console.log(`  Would upload: ${storageKey} (${(photoData.byteLength / 1024).toFixed(1)}KB)`);

  return { storageKey, photoId };
}

async function fetchVenues(): Promise<Venue[]> {
  // Fetch venues from the API
  const response = await fetch(`${WORKER_URL}/api/venues`);
  if (!response.ok) {
    throw new Error(`Failed to fetch venues: ${response.status}`);
  }
  return await response.json() as Venue[];
}

async function main() {
  console.log("Fetching venues from API...\n");

  const venues = await fetchVenues();
  console.log(`Found ${venues.length} total venues\n`);

  // Filter venues without photos
  const venuesWithoutPhotos = venues.filter(v => !v.photoStorageKey);
  console.log(`${venuesWithoutPhotos.length} venues without photos\n`);

  if (venuesWithoutPhotos.length === 0) {
    console.log("All venues have photos!");
    return;
  }

  const sqlStatements: string[] = [
    "-- Photo seed data from Google Places API",
    `-- Generated: ${new Date().toISOString()}`,
    "-- Run with: bunx wrangler d1 execute reviews-db --remote --file=scripts/seed-photos.sql",
    "",
  ];

  let photosAdded = 0;
  let venuesProcessed = 0;

  for (const venue of venuesWithoutPhotos) {
    console.log(`\n[${venuesProcessed + 1}/${venuesWithoutPhotos.length}] ${venue.name}`);

    // Find place on Google
    const placeId = await findPlace(venue.name, venue.address, venue.latitude, venue.longitude);
    if (!placeId) {
      console.log("  No Google Place found");
      venuesProcessed++;
      await new Promise(r => setTimeout(r, 100));
      continue;
    }
    console.log(`  Found place: ${placeId}`);

    // Get photos
    const photoRefs = await getPlacePhotos(placeId);
    if (photoRefs.length === 0) {
      console.log("  No photos available");
      venuesProcessed++;
      await new Promise(r => setTimeout(r, 100));
      continue;
    }
    console.log(`  Found ${photoRefs.length} photos`);

    // Download and prepare upload for first photo only (to save API calls)
    const photoRef = photoRefs[0];
    const photoData = await downloadPhoto(photoRef);

    if (photoData) {
      const photoId = crypto.randomUUID();
      const timestamp = Date.now();
      const storageKey = `google-places/${venue.id}/${timestamp}.jpg`;

      // Save photo to disk for manual R2 upload
      const outputPath = `scripts/photos/${venue.id}.jpg`;
      await Bun.write(outputPath, photoData);
      console.log(`  Saved to ${outputPath}`);

      // Generate SQL
      sqlStatements.push(
        `INSERT INTO photos (id, venue_id, user_id, storage_key, original_filename, caption, created_at) ` +
        `VALUES ('${photoId}', '${venue.id}', 'system', '${storageKey}', 'google-places.jpg', 'Photo from Google Places', unixepoch());`
      );

      photosAdded++;
    }

    venuesProcessed++;

    // Rate limiting - Google Places API has quotas
    await new Promise(r => setTimeout(r, 200));
  }

  // Write SQL file
  if (sqlStatements.length > 4) {
    const sqlPath = "scripts/seed-photos.sql";
    await Bun.write(sqlPath, sqlStatements.join("\n"));
    console.log(`\n\nGenerated ${sqlPath} with ${photosAdded} photos`);
    console.log("\nNext steps:");
    console.log("1. Upload photos from scripts/photos/ to R2 bucket under google-places/ prefix");
    console.log("2. Run: bunx wrangler d1 execute reviews-db --remote --file=scripts/seed-photos.sql");
  }

  console.log(`\nDone! Processed ${venuesProcessed} venues, added ${photosAdded} photos`);
}

// Create photos directory
import { mkdir } from "fs/promises";
await mkdir("scripts/photos", { recursive: true });

main().catch(console.error);
