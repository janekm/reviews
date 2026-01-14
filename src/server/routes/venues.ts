import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { eq, sql } from "drizzle-orm";
import { getSignedCookie } from "hono/cookie";
import { venues, users, photos, reviews } from "../db/schema";
import {
  requireAuth,
  canEditVenue,
  canCreateContent,
  isAdmin,
  type AuthUser,
} from "../middleware/auth";
import { CacheService, CacheKeys, CacheTTL } from "../cache";
import type { Env } from "../index";
import type { VenueWithUsers, Venue } from "../../shared/types";

export const venuesRoute = new Hono<{
  Bindings: Env;
  Variables: { user: AuthUser };
}>();

/**
 * Fetch a venue with creator and updatedBy user info using a single JOIN query.
 */
async function fetchVenueWithUsers(
  db: ReturnType<typeof drizzle>,
  id: string
): Promise<VenueWithUsers | null> {
  // Alias tables for self-join
  const creator = users;
  const updater = users;

  // Single query with JOINs
  const result = await db
    .select({
      // Venue fields
      id: venues.id,
      name: venues.name,
      type: venues.type,
      address: venues.address,
      description: venues.description,
      website: venues.website,
      latitude: venues.latitude,
      longitude: venues.longitude,
      creatorId: venues.creatorId,
      mainPhotoId: venues.mainPhotoId,
      createdAt: venues.createdAt,
      updatedAt: venues.updatedAt,
      updatedById: venues.updatedById,
      // Creator fields (aliased)
      creatorName: sql<string | null>`c.name`.as("creator_name"),
      creatorAvatar: sql<string | null>`c.avatar_url`.as("creator_avatar"),
      // Updater fields (aliased)
      updaterName: sql<string | null>`u.name`.as("updater_name"),
      updaterAvatar: sql<string | null>`u.avatar_url`.as("updater_avatar"),
    })
    .from(venues)
    .leftJoin(sql`${users} as c`, sql`${venues.creatorId} = c.id`)
    .leftJoin(sql`${users} as u`, sql`${venues.updatedById} = u.id`)
    .where(eq(venues.id, id))
    .get();

  if (!result) return null;

  // Transform to VenueWithUsers shape
  return {
    id: result.id,
    name: result.name,
    type: result.type,
    address: result.address,
    description: result.description,
    website: result.website,
    latitude: result.latitude,
    longitude: result.longitude,
    creatorId: result.creatorId,
    mainPhotoId: result.mainPhotoId ?? null,
    createdAt:
      result.createdAt instanceof Date
        ? result.createdAt.getTime()
        : result.createdAt,
    updatedAt: result.updatedAt
      ? result.updatedAt instanceof Date
        ? result.updatedAt.getTime()
        : result.updatedAt
      : null,
    updatedById: result.updatedById,
    creator: result.creatorId
      ? {
          id: result.creatorId,
          name: result.creatorName,
          avatarUrl: result.creatorAvatar,
        }
      : null,
    updatedBy: result.updatedById
      ? {
          id: result.updatedById,
          name: result.updaterName,
          avatarUrl: result.updaterAvatar,
        }
      : null,
  };
}

// GET all venues (public, cached)
venuesRoute.get("/", async (c) => {
  const cache = new CacheService(c.env.CACHE);
  const db = drizzle(c.env.DB);
  const type = c.req.query("type");

  const cacheKey = type
    ? CacheKeys.venuesListByType(type)
    : CacheKeys.venuesList();

  const venuesList = await cache.getOrSet<Venue[]>(
    cacheKey,
    async () => {
      // Use D1 directly for the raw SQL query with subquery
      const typeFilter = type && ["restaurant", "cafe", "shop", "bar"].includes(type)
        ? `WHERE v.type = '${type}'`
        : "";

      const stmt = c.env.DB.prepare(`
        SELECT
          v.id,
          v.name,
          v.type,
          v.address,
          v.description,
          v.website,
          v.latitude,
          v.longitude,
          v.creator_id,
          v.main_photo_id,
          v.created_at,
          v.updated_at,
          v.updated_by_id,
          COALESCE(
            (SELECT p.storage_key FROM photos p WHERE p.id = v.main_photo_id),
            (SELECT p.storage_key FROM photos p WHERE p.venue_id = v.id ORDER BY p.created_at ASC LIMIT 1)
          ) as photo_storage_key,
          (
            SELECT COUNT(*) FROM reviews r
            WHERE r.venue_id = v.id
          ) as review_count,
          (
            SELECT AVG(r.rating) FROM reviews r
            WHERE r.venue_id = v.id
          ) as avg_rating
        FROM venues v
        ${typeFilter}
        ORDER BY
          (photo_storage_key IS NOT NULL) DESC,
          review_count DESC,
          avg_rating DESC NULLS LAST,
          v.created_at DESC
      `);

      const { results } = await stmt.all<{
        id: string;
        name: string;
        type: string;
        address: string | null;
        description: string | null;
        website: string | null;
        latitude: number | null;
        longitude: number | null;
        creator_id: string | null;
        main_photo_id: string | null;
        created_at: number;
        updated_at: number | null;
        updated_by_id: string | null;
        photo_storage_key: string | null;
        review_count: number;
        avg_rating: number | null;
      }>();

      return results.map((row) => ({
        id: row.id,
        name: row.name,
        type: row.type as Venue["type"],
        address: row.address,
        description: row.description,
        website: row.website,
        latitude: row.latitude,
        longitude: row.longitude,
        creatorId: row.creator_id,
        mainPhotoId: row.main_photo_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        updatedById: row.updated_by_id,
        photoStorageKey: row.photo_storage_key,
        reviewCount: row.review_count,
        avgRating: row.avg_rating,
      }));
    },
    CacheTTL.venuesList
  );

  return c.json(venuesList);
});

// GET single venue with user info (public, cached)
venuesRoute.get("/:id", async (c) => {
  const cache = new CacheService(c.env.CACHE);
  const db = drizzle(c.env.DB);
  const id = c.req.param("id");

  const venue = await cache.getOrSet<VenueWithUsers>(
    CacheKeys.venueWithUsers(id),
    () => fetchVenueWithUsers(db, id),
    CacheTTL.venueWithUsers
  );

  if (!venue) {
    return c.json({ error: "Venue not found" }, 404);
  }

  return c.json(venue);
});

// GET check if current user can edit venue (cached per user+venue)
venuesRoute.get("/:id/can-edit", async (c) => {
  const userId = await getSignedCookie(c, c.env.COOKIE_SECRET, "user_id");

  if (!userId) {
    return c.json({ canEdit: false });
  }

  const cache = new CacheService(c.env.CACHE);
  const db = drizzle(c.env.DB);
  const venueId = c.req.param("id");

  const result = await cache.getOrSet<{ canEdit: boolean }>(
    CacheKeys.venueCanEdit(venueId, userId),
    async () => {
      const [user, venue] = await Promise.all([
        db
          .select({ id: users.id, role: users.role })
          .from(users)
          .where(eq(users.id, userId))
          .get(),
        db
          .select({ creatorId: venues.creatorId })
          .from(venues)
          .where(eq(venues.id, venueId))
          .get(),
      ]);

      if (!user || !venue) {
        return { canEdit: false };
      }

      return {
        canEdit: canEditVenue(
          { id: user.id, email: "", role: user.role as AuthUser["role"] },
          venue.creatorId
        ),
      };
    },
    CacheTTL.canEdit
  );

  return c.json(result);
});

// POST create venue (requires auth + user role or higher)
venuesRoute.post("/", requireAuth, async (c) => {
  const cache = new CacheService(c.env.CACHE);
  const db = drizzle(c.env.DB);
  const user = c.get("user");

  if (!canCreateContent(user)) {
    return c.json(
      {
        error:
          "Viewers cannot create venues. Ask an editor to upgrade your account.",
      },
      403
    );
  }

  const body = await c.req.json<{
    name: string;
    type: "restaurant" | "cafe" | "shop" | "bar";
    address?: string;
    description?: string;
    website?: string;
    latitude?: number;
    longitude?: number;
  }>();

  const id = crypto.randomUUID();

  await db.insert(venues).values({
    id,
    name: body.name,
    type: body.type,
    address: body.address ?? null,
    description: body.description ?? null,
    website: body.website ?? null,
    latitude: body.latitude ?? null,
    longitude: body.longitude ?? null,
    creatorId: user.id,
  });

  // Invalidate venue caches (lists need refreshing)
  await cache.invalidate("venue", id);

  return c.json({ id }, 201);
});

// PUT update venue (requires auth + permission)
venuesRoute.put("/:id", requireAuth, async (c) => {
  const cache = new CacheService(c.env.CACHE);
  const db = drizzle(c.env.DB);
  const user = c.get("user");
  const venueId = c.req.param("id");

  // Fetch the venue (bypass cache for permission check - need fresh data)
  const venue = await db
    .select()
    .from(venues)
    .where(eq(venues.id, venueId))
    .get();

  if (!venue) {
    return c.json({ error: "Venue not found" }, 404);
  }

  // Check permission
  if (!canEditVenue(user, venue.creatorId)) {
    return c.json(
      { error: "You do not have permission to edit this venue" },
      403
    );
  }

  // Parse body
  const body = await c.req.json<{
    name?: string;
    type?: "restaurant" | "cafe" | "shop" | "bar";
    address?: string | null;
    description?: string | null;
    website?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  }>();

  // Validate type if provided
  if (
    body.type &&
    !["restaurant", "cafe", "shop", "bar"].includes(body.type)
  ) {
    return c.json({ error: "Invalid venue type" }, 400);
  }

  // Build update object
  const updates: Partial<typeof venues.$inferInsert> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.type !== undefined) updates.type = body.type;
  if (body.address !== undefined) updates.address = body.address;
  if (body.description !== undefined) updates.description = body.description;
  if (body.website !== undefined) updates.website = body.website;
  if (body.latitude !== undefined) updates.latitude = body.latitude;
  if (body.longitude !== undefined) updates.longitude = body.longitude;

  if (Object.keys(updates).length === 0) {
    return c.json({ error: "No fields to update" }, 400);
  }

  // Track who edited and when
  updates.updatedAt = new Date();
  updates.updatedById = user.id;

  await db.update(venues).set(updates).where(eq(venues.id, venueId));

  // Invalidate venue caches
  await cache.invalidate("venue", venueId);

  // Fetch and return updated venue with user info
  const updatedVenue = await fetchVenueWithUsers(db, venueId);

  return c.json(updatedVenue);
});

// DELETE venue (admin only, cascade deletes photos and reviews)
venuesRoute.delete("/:id", requireAuth, async (c) => {
  const cache = new CacheService(c.env.CACHE);
  const db = drizzle(c.env.DB);
  const user = c.get("user");
  const venueId = c.req.param("id");

  // Only admins can delete venues
  if (!isAdmin(user)) {
    return c.json({ error: "Only admins can delete venues" }, 403);
  }

  // Check venue exists
  const venue = await db
    .select({ id: venues.id })
    .from(venues)
    .where(eq(venues.id, venueId))
    .get();

  if (!venue) {
    return c.json({ error: "Venue not found" }, 404);
  }

  // Get all photos to delete from R2
  const venuePhotos = await db
    .select({ storageKey: photos.storageKey })
    .from(photos)
    .where(eq(photos.venueId, venueId));

  // Delete photos from R2
  await Promise.all(
    venuePhotos.map((p) => c.env.PHOTOS.delete(p.storageKey))
  );

  // Delete from D1 (cascade: photos, reviews, then venue)
  await db.delete(photos).where(eq(photos.venueId, venueId));
  await db.delete(reviews).where(eq(reviews.venueId, venueId));
  await db.delete(venues).where(eq(venues.id, venueId));

  // Invalidate all venue-related caches
  await cache.invalidate("venue", venueId);

  return c.json({ success: true });
});

// PATCH set main photo for venue (requires auth + permission)
venuesRoute.patch("/:id/main-photo", requireAuth, async (c) => {
  const cache = new CacheService(c.env.CACHE);
  const db = drizzle(c.env.DB);
  const user = c.get("user");
  const venueId = c.req.param("id");

  // Fetch the venue
  const venue = await db
    .select({ id: venues.id, creatorId: venues.creatorId })
    .from(venues)
    .where(eq(venues.id, venueId))
    .get();

  if (!venue) {
    return c.json({ error: "Venue not found" }, 404);
  }

  // Check permission (creator, editor, or admin)
  if (!canEditVenue(user, venue.creatorId)) {
    return c.json(
      { error: "You do not have permission to edit this venue" },
      403
    );
  }

  const body = await c.req.json<{ photoId: string | null }>();

  // If photoId is provided, verify it belongs to this venue
  if (body.photoId) {
    const photo = await db
      .select({ id: photos.id })
      .from(photos)
      .where(eq(photos.id, body.photoId))
      .get();

    if (!photo) {
      return c.json({ error: "Photo not found" }, 404);
    }
  }

  // Update venue with main photo
  await db
    .update(venues)
    .set({
      mainPhotoId: body.photoId,
      updatedAt: new Date(),
      updatedById: user.id,
    })
    .where(eq(venues.id, venueId));

  // Invalidate caches
  await cache.invalidate("venue", venueId);

  return c.json({ success: true });
});
