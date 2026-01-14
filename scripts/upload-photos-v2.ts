/**
 * Upload photos to R2 with correct paths and update database.
 * Run with: bun run scripts/upload-photos-v2.ts
 */

import { readdir } from "fs/promises";

const PHOTOS_DIR = "scripts/photos";
const USER_ID = "2f2859e6-2779-46ae-9018-5581ce7065b7"; // Admin user

async function main() {
  const files = await readdir(PHOTOS_DIR);
  const jpgFiles = files.filter(f => f.endsWith(".jpg")).sort();

  console.log(`Found ${jpgFiles.length} photos to upload\n`);

  const sqlStatements: string[] = [
    "-- Photo seed data",
    `-- Generated: ${new Date().toISOString()}`,
    ""
  ];

  for (const file of jpgFiles) {
    const venueId = file.replace(".jpg", "");
    const photoId = crypto.randomUUID();
    const storageKey = `photos/${venueId}/${photoId}.jpg`;
    const filePath = `${PHOTOS_DIR}/${file}`;

    console.log(`Uploading ${file} -> ${storageKey}`);

    // Upload to R2 using wrangler with --remote flag
    const proc = Bun.spawn([
      "bunx", "wrangler", "r2", "object", "put",
      `reviews-photos/${storageKey}`,
      "--file", filePath,
      "--content-type", "image/jpeg",
      "--remote"  // IMPORTANT: Upload to remote, not local
    ], {
      stdout: "pipe",
      stderr: "pipe"
    });

    await proc.exited;

    if (proc.exitCode === 0) {
      console.log(`  Uploaded successfully`);

      sqlStatements.push(
        `INSERT INTO photos (id, venue_id, user_id, storage_key, original_filename, caption, created_at) ` +
        `VALUES ('${photoId}', '${venueId}', '${USER_ID}', '${storageKey}', 'google-places.jpg', NULL, unixepoch());`
      );
    } else {
      const stderr = await new Response(proc.stderr).text();
      console.error(`  FAILED: ${stderr.substring(0, 200)}`);
    }
  }

  // Write SQL file
  const sqlPath = "scripts/seed-photos-v2.sql";
  await Bun.write(sqlPath, sqlStatements.join("\n"));
  console.log(`\nGenerated ${sqlPath}`);
  console.log("Run: bunx wrangler d1 execute reviews-db --remote --file=scripts/seed-photos-v2.sql");
}

main().catch(console.error);
