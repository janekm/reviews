import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { photos, users, venues, reviews } from "../db/schema";
import { requireAuth, canEditVenue, canCreateContent, type AuthUser } from "../middleware/auth";
import { CacheService } from "../cache";
import type { Env } from "../index";
import type { PhotoWithUser } from "../../shared/types";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export const photosRoute = new Hono<{
  Bindings: Env;
  Variables: { user: AuthUser };
}>();

// GET photos for a venue
photosRoute.get("/venues/:venueId", async (c) => {
  const db = drizzle(c.env.DB);
  const venueId = c.req.param("venueId");

  const results = await db
    .select({
      id: photos.id,
      venueId: photos.venueId,
      userId: photos.userId,
      storageKey: photos.storageKey,
      originalFilename: photos.originalFilename,
      caption: photos.caption,
      width: photos.width,
      height: photos.height,
      sizeBytes: photos.sizeBytes,
      createdAt: photos.createdAt,
      userName: users.name,
      userAvatar: users.avatarUrl,
    })
    .from(photos)
    .leftJoin(users, eq(photos.userId, users.id))
    .where(eq(photos.venueId, venueId))
    .orderBy(photos.createdAt);

  const photosWithUsers: PhotoWithUser[] = results.map((row) => ({
    id: row.id,
    venueId: row.venueId,
    userId: row.userId,
    storageKey: row.storageKey,
    originalFilename: row.originalFilename,
    caption: row.caption,
    width: row.width,
    height: row.height,
    sizeBytes: row.sizeBytes,
    createdAt: row.createdAt instanceof Date ? row.createdAt.getTime() : row.createdAt,
    user: row.userId
      ? {
          id: row.userId,
          name: row.userName,
          avatarUrl: row.userAvatar,
        }
      : null,
  }));

  return c.json(photosWithUsers);
});

// POST upload photo to venue
photosRoute.post("/venues/:venueId", requireAuth, async (c) => {
  const db = drizzle(c.env.DB);
  const user = c.get("user");
  const venueId = c.req.param("venueId");

  // Check if user can create content
  if (!canCreateContent(user)) {
    return c.json(
      { error: "Viewers cannot upload photos. Ask an editor to upgrade your account." },
      403
    );
  }

  // Verify venue exists
  const venue = await db
    .select({ id: venues.id })
    .from(venues)
    .where(eq(venues.id, venueId))
    .get();

  if (!venue) {
    return c.json({ error: "Venue not found" }, 404);
  }

  // Parse multipart form data
  const formData = await c.req.formData();
  const file = formData.get("file") as File | null;
  const caption = formData.get("caption") as string | null;

  if (!file) {
    return c.json({ error: "No file provided" }, 400);
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return c.json(
      { error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(", ")}` },
      400
    );
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return c.json(
      { error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
      400
    );
  }

  // Generate unique storage key
  const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const photoId = crypto.randomUUID();
  const storageKey = `photos/${venueId}/${photoId}.${fileExt}`;

  // Upload to R2
  const arrayBuffer = await file.arrayBuffer();
  await c.env.PHOTOS.put(storageKey, arrayBuffer, {
    httpMetadata: {
      contentType: file.type,
    },
  });

  // Save metadata to D1
  await db.insert(photos).values({
    id: photoId,
    venueId,
    userId: user.id,
    storageKey,
    originalFilename: file.name,
    caption: caption || null,
    sizeBytes: file.size,
  });

  // Invalidate venue caches so the new photo appears in listings
  const cache = new CacheService(c.env.CACHE);
  await cache.invalidate("venue", venueId);

  return c.json({ id: photoId, storageKey }, 201);
});

// POST upload photo to review
photosRoute.post("/reviews/:reviewId", requireAuth, async (c) => {
  const db = drizzle(c.env.DB);
  const user = c.get("user");
  const reviewId = c.req.param("reviewId");

  // Check if user can create content
  if (!canCreateContent(user)) {
    return c.json(
      { error: "Viewers cannot upload photos. Ask an editor to upgrade your account." },
      403
    );
  }

  // Verify review exists and belongs to user
  const review = await db
    .select({ id: reviews.id, userId: reviews.userId, venueId: reviews.venueId })
    .from(reviews)
    .where(eq(reviews.id, reviewId))
    .get();

  if (!review) {
    return c.json({ error: "Review not found" }, 404);
  }

  // Only review owner can add photos to their review
  if (review.userId !== user.id) {
    return c.json({ error: "You can only add photos to your own reviews" }, 403);
  }

  // Parse multipart form data
  const formData = await c.req.formData();
  const file = formData.get("file") as File | null;
  const caption = formData.get("caption") as string | null;

  if (!file) {
    return c.json({ error: "No file provided" }, 400);
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return c.json(
      { error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(", ")}` },
      400
    );
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return c.json(
      { error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
      400
    );
  }

  // Generate unique storage key (use venue ID in path for organization)
  const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const photoId = crypto.randomUUID();
  const storageKey = `photos/${review.venueId}/reviews/${photoId}.${fileExt}`;

  // Upload to R2
  const arrayBuffer = await file.arrayBuffer();
  await c.env.PHOTOS.put(storageKey, arrayBuffer, {
    httpMetadata: {
      contentType: file.type,
    },
  });

  // Save metadata to D1
  await db.insert(photos).values({
    id: photoId,
    venueId: review.venueId,
    reviewId: reviewId,
    userId: user.id,
    storageKey,
    originalFilename: file.name,
    caption: caption || null,
    sizeBytes: file.size,
  });

  // Invalidate review caches
  const cache = new CacheService(c.env.CACHE);
  await cache.invalidate("review", reviewId, { venueId: review.venueId });

  return c.json({ id: photoId, storageKey }, 201);
});

// DELETE photo
photosRoute.delete("/:id", requireAuth, async (c) => {
  const db = drizzle(c.env.DB);
  const user = c.get("user");
  const photoId = c.req.param("id");

  // Get photo with venue info for permission check
  const photo = await db
    .select({
      id: photos.id,
      userId: photos.userId,
      storageKey: photos.storageKey,
      venueId: photos.venueId,
    })
    .from(photos)
    .where(eq(photos.id, photoId))
    .get();

  if (!photo) {
    return c.json({ error: "Photo not found" }, 404);
  }

  // Get venue creator for permission check
  const venue = await db
    .select({ creatorId: venues.creatorId })
    .from(venues)
    .where(eq(venues.id, photo.venueId))
    .get();

  // Check permission: photo owner, venue owner, or editor/admin
  const isPhotoOwner = photo.userId === user.id;
  const canEditThisVenue = canEditVenue(user, venue?.creatorId ?? null);

  if (!isPhotoOwner && !canEditThisVenue) {
    return c.json({ error: "You do not have permission to delete this photo" }, 403);
  }

  // Delete from R2
  await c.env.PHOTOS.delete(photo.storageKey);

  // Delete from D1
  await db.delete(photos).where(eq(photos.id, photoId));

  // Invalidate venue caches so the photo removal is reflected in listings
  const cache = new CacheService(c.env.CACHE);
  await cache.invalidate("venue", photo.venueId);

  return c.json({ success: true });
});
