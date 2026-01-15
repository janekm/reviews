/**
 * Migration script to import D1 data into Convex
 *
 * Run with: bunx tsx scripts/migration/run-migration.ts
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONVEX_URL = process.env.VITE_CONVEX_URL || "https://tremendous-rook-473.convex.cloud";

async function loadJson(filename: string) {
  const filepath = path.join(__dirname, filename);
  const content = fs.readFileSync(filepath, "utf-8");
  const data = JSON.parse(content);
  // D1 export format wraps results in an array
  return data[0]?.results || [];
}

async function main() {
  console.log("🚀 Starting D1 to Convex migration...\n");
  console.log(`Convex URL: ${CONVEX_URL}\n`);

  const client = new ConvexHttpClient(CONVEX_URL);

  // Load exported data
  console.log("📂 Loading exported data...");
  const users = await loadJson("users.json");
  const venues = await loadJson("venues.json");
  const reviews = await loadJson("reviews.json");
  const photos = await loadJson("photos.json");
  const favorites = await loadJson("favorites.json");

  console.log(`  - ${users.length} users`);
  console.log(`  - ${venues.length} venues`);
  console.log(`  - ${reviews.length} reviews`);
  console.log(`  - ${photos.length} photos`);
  console.log(`  - ${favorites.length} favorites\n`);

  // Step 1: Import users
  console.log("👤 Importing users...");
  const userIdMap = await client.mutation(api.migrations.importUsers as any, { users });
  console.log(`  ✓ Mapped ${Object.keys(userIdMap).length} users\n`);

  // Get a default user ID for venues without creator
  const defaultUserId = Object.values(userIdMap)[0];
  if (!defaultUserId) {
    throw new Error("No users imported, cannot continue");
  }

  // Step 2: Import venues
  console.log("🏪 Importing venues...");
  const venueIdMap = await client.mutation(api.migrations.importVenues as any, {
    venues,
    userIdMap,
    defaultUserId,
  });
  console.log(`  ✓ Mapped ${Object.keys(venueIdMap).length} venues\n`);

  // Step 3: Import reviews
  console.log("⭐ Importing reviews...");
  const reviewIdMap = await client.mutation(api.migrations.importReviews as any, {
    reviews,
    userIdMap,
    venueIdMap,
  });
  console.log(`  ✓ Mapped ${Object.keys(reviewIdMap).length} reviews\n`);

  // Step 4: Import photos
  console.log("📷 Importing photos...");
  const photoIdMap = await client.mutation(api.migrations.importPhotos as any, {
    photos,
    userIdMap,
    venueIdMap,
    reviewIdMap,
  });
  console.log(`  ✓ Mapped ${Object.keys(photoIdMap).length} photos\n`);

  // Step 5: Import favorites
  console.log("❤️ Importing favorites...");
  await client.mutation(api.migrations.importFavorites as any, {
    favorites,
    userIdMap,
    venueIdMap,
  });
  console.log(`  ✓ Done\n`);

  // Step 6: Update venue main photos
  console.log("🖼️ Setting venue main photos...");
  const venuePhotoMap: Record<string, string> = {};
  for (const venue of venues) {
    if (venue.main_photo_id) {
      venuePhotoMap[venue.id] = venue.main_photo_id;
    }
  }
  await client.mutation(api.migrations.updateVenueMainPhotos as any, {
    venuePhotoMap,
    venueIdMap,
    photoIdMap,
  });
  console.log(`  ✓ Done\n`);

  console.log("✅ Migration complete!");
  console.log(`
Summary:
  - Users: ${Object.keys(userIdMap).length}
  - Venues: ${Object.keys(venueIdMap).length}
  - Reviews: ${Object.keys(reviewIdMap).length}
  - Photos: ${Object.keys(photoIdMap).length}
`);
}

main().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
