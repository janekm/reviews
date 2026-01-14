/**
 * Upload downloaded photos to R2 and generate SQL for database insertion.
 * Run with: bun run scripts/upload-photos-to-r2.ts
 */

import { readdir } from "fs/promises";

const PHOTOS_DIR = "scripts/photos";

async function main() {
  // Get all jpg files
  const files = await readdir(PHOTOS_DIR);
  const jpgFiles = files.filter(f => f.endsWith(".jpg")).sort();

  console.log(`Found ${jpgFiles.length} photos to process\n`);

  const sqlStatements: string[] = [
    "-- Photo seed data from Google Places API",
    `-- Generated: ${new Date().toISOString()}`,
    "-- Run with: bunx wrangler d1 execute reviews-db --remote --file=scripts/seed-photos.sql",
    "",
  ];

  for (const file of jpgFiles) {
    const venueId = file.replace(".jpg", "");
    const photoId = crypto.randomUUID();
    const timestamp = Date.now();
    const storageKey = `google-places/${venueId}.jpg`;

    // Upload to R2
    const filePath = `${PHOTOS_DIR}/${file}`;
    const photoData = await Bun.file(filePath).arrayBuffer();

    console.log(`Uploading ${file} (${(photoData.byteLength / 1024).toFixed(1)}KB)...`);

    // Use wrangler to upload to R2
    const proc = Bun.spawn([
      "bunx", "wrangler", "r2", "object", "put",
      `reviews-photos/${storageKey}`,
      "--file", filePath,
      "--content-type", "image/jpeg"
    ], {
      stdout: "pipe",
      stderr: "pipe"
    });

    await proc.exited;

    if (proc.exitCode === 0) {
      console.log(`  Uploaded: ${storageKey}`);

      sqlStatements.push(
        `INSERT INTO photos (id, venue_id, user_id, storage_key, original_filename, caption, created_at) ` +
        `VALUES ('${photoId}', '${venueId}', 'system', '${storageKey}', 'google-places.jpg', NULL, unixepoch());`
      );
    } else {
      const stderr = await new Response(proc.stderr).text();
      console.error(`  Failed: ${stderr}`);
    }
  }

  // Write SQL file
  const sqlPath = "scripts/seed-photos.sql";
  await Bun.write(sqlPath, sqlStatements.join("\n"));
  console.log(`\nGenerated ${sqlPath}`);
  console.log("Run: bunx wrangler d1 execute reviews-db --remote --file=scripts/seed-photos.sql");
}

main().catch(console.error);
