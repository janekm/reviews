import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { eq, desc, sql } from "drizzle-orm";
import { reviews, venues, users, photos } from "../db/schema";
import {
  requireAuth,
  canCreateContent,
  isAdmin,
  type AuthUser,
} from "../middleware/auth";
import { CacheService, CacheKeys, CacheTTL } from "../cache";
import type { Env } from "../index";
import type { ReviewWithUser, PhotoWithUser } from "../../shared/types";

export const reviewsRoute = new Hono<{
  Bindings: Env;
  Variables: { user: AuthUser };
}>();

/**
 * Fetch photos for a review with user info.
 */
async function fetchReviewPhotos(
  db: ReturnType<typeof drizzle>,
  reviewId: string
): Promise<PhotoWithUser[]> {
  const results = await db
    .select({
      id: photos.id,
      venueId: photos.venueId,
      reviewId: photos.reviewId,
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
    .where(eq(photos.reviewId, reviewId))
    .orderBy(photos.createdAt);

  return results.map((p) => ({
    id: p.id,
    venueId: p.venueId,
    reviewId: p.reviewId,
    userId: p.userId,
    storageKey: p.storageKey,
    originalFilename: p.originalFilename,
    caption: p.caption,
    width: p.width,
    height: p.height,
    sizeBytes: p.sizeBytes,
    createdAt: p.createdAt instanceof Date ? p.createdAt.getTime() : p.createdAt,
    user: p.userId
      ? {
          id: p.userId,
          name: p.userName,
          avatarUrl: p.userAvatar,
        }
      : null,
  }));
}

/**
 * Fetch reviews for a venue with user info using a single JOIN query.
 */
async function fetchVenueReviewsWithUsers(
  db: ReturnType<typeof drizzle>,
  venueId: string
): Promise<ReviewWithUser[]> {
  const results = await db
    .select({
      id: reviews.id,
      venueId: reviews.venueId,
      userId: reviews.userId,
      rating: reviews.rating,
      title: reviews.title,
      content: reviews.content,
      createdAt: reviews.createdAt,
      updatedAt: reviews.updatedAt,
      // User fields
      userName: users.name,
      userAvatar: users.avatarUrl,
    })
    .from(reviews)
    .leftJoin(users, eq(reviews.userId, users.id))
    .where(eq(reviews.venueId, venueId))
    .orderBy(desc(reviews.createdAt));

  // Fetch photos for each review
  const reviewsWithPhotos = await Promise.all(
    results.map(async (r) => {
      const reviewPhotos = await fetchReviewPhotos(db, r.id);
      return {
        id: r.id,
        venueId: r.venueId,
        userId: r.userId,
        rating: r.rating,
        title: r.title,
        content: r.content,
        createdAt:
          r.createdAt instanceof Date ? r.createdAt.getTime() : r.createdAt,
        updatedAt: r.updatedAt
          ? r.updatedAt instanceof Date
            ? r.updatedAt.getTime()
            : r.updatedAt
          : null,
        user: r.userId
          ? {
              id: r.userId,
              name: r.userName,
              avatarUrl: r.userAvatar,
            }
          : null,
        photos: reviewPhotos.length > 0 ? reviewPhotos : undefined,
      };
    })
  );

  return reviewsWithPhotos;
}

/**
 * Fetch recent reviews with user info using a single JOIN query.
 */
async function fetchRecentReviewsWithUsers(
  db: ReturnType<typeof drizzle>,
  limit = 20
): Promise<ReviewWithUser[]> {
  const results = await db
    .select({
      id: reviews.id,
      venueId: reviews.venueId,
      userId: reviews.userId,
      rating: reviews.rating,
      title: reviews.title,
      content: reviews.content,
      createdAt: reviews.createdAt,
      updatedAt: reviews.updatedAt,
      // User fields
      userName: users.name,
      userAvatar: users.avatarUrl,
    })
    .from(reviews)
    .leftJoin(users, eq(reviews.userId, users.id))
    .orderBy(desc(reviews.createdAt))
    .limit(limit);

  return results.map((r) => ({
    id: r.id,
    venueId: r.venueId,
    userId: r.userId,
    rating: r.rating,
    title: r.title,
    content: r.content,
    createdAt:
      r.createdAt instanceof Date ? r.createdAt.getTime() : r.createdAt,
    updatedAt: r.updatedAt
      ? r.updatedAt instanceof Date
        ? r.updatedAt.getTime()
        : r.updatedAt
      : null,
    user: r.userId
      ? {
          id: r.userId,
          name: r.userName,
          avatarUrl: r.userAvatar,
        }
      : null,
  }));
}

// GET reviews with user info (public, cached for venue-specific queries)
reviewsRoute.get("/", async (c) => {
  const cache = new CacheService(c.env.CACHE);
  const db = drizzle(c.env.DB);
  const venueId = c.req.query("venueId");

  if (venueId) {
    // Venue-specific reviews - cached
    const reviewsWithUsers = await cache.getOrSet<ReviewWithUser[]>(
      CacheKeys.venueReviews(venueId),
      () => fetchVenueReviewsWithUsers(db, venueId),
      CacheTTL.venueReviews
    );
    return c.json(reviewsWithUsers);
  }

  // Recent reviews - not cached (changes frequently, not venue-specific)
  const reviewsWithUsers = await fetchRecentReviewsWithUsers(db, 20);
  return c.json(reviewsWithUsers);
});

// GET single review with user info (public)
reviewsRoute.get("/:id", async (c) => {
  const cache = new CacheService(c.env.CACHE);
  const db = drizzle(c.env.DB);
  const id = c.req.param("id");

  const review = await cache.getOrSet<ReviewWithUser>(
    CacheKeys.review(id),
    async () => {
      const result = await db
        .select({
          id: reviews.id,
          venueId: reviews.venueId,
          userId: reviews.userId,
          rating: reviews.rating,
          title: reviews.title,
          content: reviews.content,
          createdAt: reviews.createdAt,
          userName: users.name,
          userAvatar: users.avatarUrl,
        })
        .from(reviews)
        .leftJoin(users, eq(reviews.userId, users.id))
        .where(eq(reviews.id, id))
        .get();

      if (!result) return null;

      return {
        id: result.id,
        venueId: result.venueId,
        userId: result.userId,
        rating: result.rating,
        title: result.title,
        content: result.content,
        createdAt:
          result.createdAt instanceof Date
            ? result.createdAt.getTime()
            : result.createdAt,
        user: result.userId
          ? {
              id: result.userId,
              name: result.userName,
              avatarUrl: result.userAvatar,
            }
          : null,
      };
    },
    CacheTTL.venueReviews
  );

  if (!review) {
    return c.json({ error: "Review not found" }, 404);
  }

  return c.json(review);
});

// POST create review (requires auth + user role or higher)
reviewsRoute.post("/", requireAuth, async (c) => {
  const cache = new CacheService(c.env.CACHE);
  const db = drizzle(c.env.DB);
  const user = c.get("user");

  if (!canCreateContent(user)) {
    return c.json(
      {
        error:
          "Viewers cannot create reviews. Ask an editor to upgrade your account.",
      },
      403
    );
  }

  const body = await c.req.json<{
    venueId: string;
    rating: number;
    title?: string;
    content?: string;
  }>();

  if (body.rating < 1 || body.rating > 5) {
    return c.json({ error: "Rating must be between 1 and 5" }, 400);
  }

  const venue = await db
    .select()
    .from(venues)
    .where(eq(venues.id, body.venueId))
    .get();

  if (!venue) {
    return c.json({ error: "Venue not found" }, 404);
  }

  const id = crypto.randomUUID();

  await db.insert(reviews).values({
    id,
    venueId: body.venueId,
    userId: user.id,
    rating: body.rating,
    title: body.title ?? null,
    content: body.content ?? null,
  });

  // Invalidate reviews cache for this venue
  await cache.invalidate("review", id, { venueId: body.venueId });

  return c.json({ id }, 201);
});

// PUT update review (owner only)
reviewsRoute.put("/:id", requireAuth, async (c) => {
  const cache = new CacheService(c.env.CACHE);
  const db = drizzle(c.env.DB);
  const user = c.get("user");
  const reviewId = c.req.param("id");

  const review = await db
    .select({ id: reviews.id, userId: reviews.userId, venueId: reviews.venueId })
    .from(reviews)
    .where(eq(reviews.id, reviewId))
    .get();

  if (!review) {
    return c.json({ error: "Review not found" }, 404);
  }

  // Only owner can edit their review
  if (review.userId !== user.id) {
    return c.json({ error: "You can only edit your own reviews" }, 403);
  }

  const body = await c.req.json<{
    rating?: number;
    title?: string | null;
    content?: string | null;
  }>();

  // Validate rating if provided
  if (body.rating !== undefined && (body.rating < 1 || body.rating > 5)) {
    return c.json({ error: "Rating must be between 1 and 5" }, 400);
  }

  // Build update object
  const updates: Partial<typeof reviews.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (body.rating !== undefined) updates.rating = body.rating;
  if (body.title !== undefined) updates.title = body.title;
  if (body.content !== undefined) updates.content = body.content;

  await db.update(reviews).set(updates).where(eq(reviews.id, reviewId));

  // Invalidate caches
  await cache.invalidate("review", reviewId, { venueId: review.venueId });

  return c.json({ success: true });
});

// DELETE review (owner or admin)
reviewsRoute.delete("/:id", requireAuth, async (c) => {
  const cache = new CacheService(c.env.CACHE);
  const db = drizzle(c.env.DB);
  const user = c.get("user");
  const reviewId = c.req.param("id");

  const review = await db
    .select({ id: reviews.id, userId: reviews.userId, venueId: reviews.venueId })
    .from(reviews)
    .where(eq(reviews.id, reviewId))
    .get();

  if (!review) {
    return c.json({ error: "Review not found" }, 404);
  }

  // Check permission: review owner or admin
  const isOwner = review.userId === user.id;
  if (!isOwner && !isAdmin(user)) {
    return c.json({ error: "You do not have permission to delete this review" }, 403);
  }

  await db.delete(reviews).where(eq(reviews.id, reviewId));

  // Invalidate caches
  await cache.invalidate("review", reviewId, { venueId: review.venueId });

  return c.json({ success: true });
});
