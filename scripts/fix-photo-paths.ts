/**
 * Fix photo paths - move from google-places/ to photos/ structure
 * Run with: bun run scripts/fix-photo-paths.ts
 */

// Get all photos with google-places prefix from DB
async function main() {
  console.log("Fetching photos with google-places prefix...\n");

  // Query the database for google-places photos
  const proc = Bun.spawn([
    "bunx", "wrangler", "d1", "execute", "reviews-db", "--remote",
    "--command", "SELECT id, venue_id, storage_key FROM photos WHERE storage_key LIKE 'google-places/%'",
    "--json"
  ], {
    stdout: "pipe",
    stderr: "pipe"
  });

  await proc.exited;
  const output = await new Response(proc.stdout).text();
  const data = JSON.parse(output);

  if (!data[0]?.results?.length) {
    console.log("No photos to fix");
    return;
  }

  const photos = data[0].results as Array<{id: string, venue_id: string, storage_key: string}>;
  console.log(`Found ${photos.length} photos to move\n`);

  const sqlUpdates: string[] = [
    "-- Fix photo paths from google-places/ to photos/",
    `-- Generated: ${new Date().toISOString()}`,
    ""
  ];

  for (const photo of photos) {
    const oldKey = photo.storage_key;
    const newKey = `photos/${photo.venue_id}/${photo.id}.jpg`;

    console.log(`Moving: ${oldKey} -> ${newKey}`);

    // Copy object in R2
    const copyProc = Bun.spawn([
      "bunx", "wrangler", "r2", "object", "get",
      `reviews-photos/${oldKey}`,
      "--pipe"
    ], {
      stdout: "pipe",
      stderr: "pipe"
    });

    const photoData = await new Response(copyProc.stdout).arrayBuffer();
    await copyProc.exited;

    if (copyProc.exitCode !== 0) {
      console.error(`  Failed to get: ${oldKey}`);
      continue;
    }

    // Write to temp file and upload to new location
    const tempPath = `/tmp/${photo.id}.jpg`;
    await Bun.write(tempPath, photoData);

    const putProc = Bun.spawn([
      "bunx", "wrangler", "r2", "object", "put",
      `reviews-photos/${newKey}`,
      "--file", tempPath,
      "--content-type", "image/jpeg"
    ], {
      stdout: "pipe",
      stderr: "pipe"
    });

    await putProc.exited;

    if (putProc.exitCode !== 0) {
      console.error(`  Failed to put: ${newKey}`);
      continue;
    }

    // Delete old object
    const delProc = Bun.spawn([
      "bunx", "wrangler", "r2", "object", "delete",
      `reviews-photos/${oldKey}`
    ], {
      stdout: "pipe",
      stderr: "pipe"
    });
    await delProc.exited;

    // Update SQL
    sqlUpdates.push(`UPDATE photos SET storage_key = '${newKey}' WHERE id = '${photo.id}';`);

    console.log(`  Done`);
  }

  // Write SQL file
  const sqlPath = "scripts/fix-photo-paths.sql";
  await Bun.write(sqlPath, sqlUpdates.join("\n"));
  console.log(`\nGenerated ${sqlPath}`);
  console.log("Run: bunx wrangler d1 execute reviews-db --remote --file=scripts/fix-photo-paths.sql");
}

main().catch(console.error);
