/**
 * Fetch venues from Google Places API and generate SQL seed data.
 * Run with: bun run scripts/fetch-venues.ts
 */

const API_KEY = "AIzaSyDcfx96DicJ-DuyxlkLitXwEa4x1f0o7BU";
// White's Row / Spitalfields Market core area
const SPITALFIELDS_CENTER = { lat: 51.5192, lng: -0.0748 };
const RADIUS = 200; // meters - tight radius for local density

interface PlaceResult {
  place_id: string;
  name: string;
  vicinity: string;
  geometry: {
    location: { lat: number; lng: number };
  };
  rating?: number;
  user_ratings_total?: number;
  types: string[];
  business_status?: string;
  opening_hours?: { open_now: boolean };
}

interface PlaceDetails {
  name: string;
  formatted_address: string;
  geometry: { location: { lat: number; lng: number } };
  editorial_summary?: { overview: string };
  website?: string;
  rating?: number;
  types: string[];
}

type VenueType = "restaurant" | "cafe" | "bar" | "shop";

interface Venue {
  id: string;
  name: string;
  type: VenueType;
  address: string;
  description: string | null;
  website: string | null;
  latitude: number;
  longitude: number;
}

async function searchNearby(type: string): Promise<PlaceResult[]> {
  const url = new URL(
    "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
  );
  url.searchParams.set("location", `${SPITALFIELDS_CENTER.lat},${SPITALFIELDS_CENTER.lng}`);
  url.searchParams.set("radius", RADIUS.toString());
  url.searchParams.set("type", type);
  url.searchParams.set("key", API_KEY);

  const response = await fetch(url.toString());
  const data = await response.json();

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    console.error(`Error searching for ${type}:`, data.status, data.error_message);
    return [];
  }

  return data.results || [];
}

async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  const url = new URL(
    "https://maps.googleapis.com/maps/api/place/details/json"
  );
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "name,formatted_address,geometry,editorial_summary,website,rating,types");
  url.searchParams.set("key", API_KEY);

  const response = await fetch(url.toString());
  const data = await response.json();

  if (data.status !== "OK") {
    console.error(`Error getting details for ${placeId}:`, data.status);
    return null;
  }

  return data.result;
}

function mapGoogleTypeToVenueType(types: string[]): VenueType | null {
  if (types.includes("bar") || types.includes("night_club")) return "bar";
  if (types.includes("cafe")) return "cafe";
  if (types.includes("restaurant")) return "restaurant";
  if (types.includes("store") || types.includes("clothing_store") || types.includes("shopping_mall")) return "shop";
  return null;
}

function escapeSQL(str: string): string {
  return str.replace(/'/g, "''");
}

function generateSQL(venues: Venue[]): string {
  const lines = [
    "-- Auto-generated venue seed data from Google Places API",
    "-- Generated: " + new Date().toISOString(),
    "-- Run with: wrangler d1 execute reviews-db --local --file=scripts/seed-venues.sql",
    "",
  ];

  for (const venue of venues) {
    const description = venue.description
      ? `'${escapeSQL(venue.description)}'`
      : "NULL";
    const website = venue.website
      ? `'${escapeSQL(venue.website)}'`
      : "NULL";

    lines.push(
      `INSERT INTO venues (id, name, type, address, description, website, latitude, longitude, created_at) VALUES ` +
        `('${venue.id}', '${escapeSQL(venue.name)}', '${venue.type}', '${escapeSQL(venue.address)}', ${description}, ${website}, ${venue.latitude}, ${venue.longitude}, unixepoch());`
    );
  }

  return lines.join("\n");
}

async function main() {
  console.log("Fetching venues from Google Places API...\n");

  const searchTypes = [
    { google: "restaurant", venue: "restaurant" as VenueType },
    { google: "cafe", venue: "cafe" as VenueType },
    { google: "bar", venue: "bar" as VenueType },
    { google: "clothing_store", venue: "shop" as VenueType },
  ];

  const allPlaces = new Map<string, { result: PlaceResult; type: VenueType }>();

  // Search for each type
  for (const { google, venue } of searchTypes) {
    console.log(`Searching for ${google}s...`);
    const results = await searchNearby(google);
    console.log(`  Found ${results.length} results`);

    for (const result of results) {
      // Skip if already added or not operational
      if (allPlaces.has(result.place_id)) continue;
      if (result.business_status && result.business_status !== "OPERATIONAL") continue;

      // Lower threshold to capture local gems
      if (!result.rating || result.rating < 3.0) continue;
      if (!result.user_ratings_total || result.user_ratings_total < 5) continue;

      allPlaces.set(result.place_id, { result, type: venue });
    }

    // Rate limiting
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`\nTotal unique places: ${allPlaces.size}`);
  console.log("Fetching details...\n");

  const venues: Venue[] = [];
  let count = 0;

  for (const [placeId, { result, type }] of allPlaces) {
    // Get more results to filter from
    if (count >= 50) break;

    const details = await getPlaceDetails(placeId);
    if (!details) continue;

    // Determine the best type based on Google's types
    const mappedType = mapGoogleTypeToVenueType(details.types) || type;

    venues.push({
      id: `v${String(count + 61).padStart(3, "0")}`,
      name: details.name,
      type: mappedType,
      address: details.formatted_address.replace(/, UK$/, "").replace(/, United Kingdom$/, ""),
      description: details.editorial_summary?.overview || null,
      website: details.website || null,
      latitude: details.geometry.location.lat,
      longitude: details.geometry.location.lng,
    });

    console.log(`${count + 1}. ${details.name} (${mappedType})`);
    console.log(`   ${details.formatted_address}`);
    console.log(`   ${details.geometry.location.lat}, ${details.geometry.location.lng}`);
    if (details.website) {
      console.log(`   ${details.website}`);
    }
    if (details.editorial_summary?.overview) {
      console.log(`   "${details.editorial_summary.overview.substring(0, 60)}..."`);
    }
    console.log();

    count++;

    // Rate limiting
    await new Promise((r) => setTimeout(r, 100));
  }

  // Generate SQL
  const sql = generateSQL(venues);
  const outputPath = "scripts/seed-venues-whitesrow.sql";
  await Bun.write(outputPath, sql);

  console.log(`\nGenerated ${outputPath} with ${venues.length} venues`);
  console.log("Run: wrangler d1 execute reviews-db --local --file=scripts/seed-venues-whitesrow.sql");
}

main().catch(console.error);
