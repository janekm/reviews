import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { hasMinRole } from "./users";

// Return type for review with author info (uses denormalized fields)
const reviewWithAuthorValidator = v.object({
  _id: v.id("reviews"),
  _creationTime: v.number(),
  venueId: v.id("venues"),
  userId: v.id("users"),
  rating: v.number(),
  content: v.string(),
  visitedAt: v.optional(v.number()),
  authorName: v.optional(v.string()),
  authorEmail: v.optional(v.string()),
  authorAvatarUrl: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
  // Computed at query time
  author: v.object({
    _id: v.id("users"),
    name: v.optional(v.string()),
    email: v.string(),
    avatarUrl: v.optional(v.string()),
  }),
  canEdit: v.boolean(),
  canDelete: v.boolean(),
});

// Helper to get current user
async function getCurrentUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  return await ctx.db
    .query("users")
    .withIndex("by_workos_id", (q: any) => q.eq("workosUserId", identity.subject))
    .unique();
}

// Helper to incrementally update venue review stats (avoids full recalculation race conditions)
async function incrementReviewStats(ctx: any, venueId: Id<"venues">, newRating: number) {
  const venue = await ctx.db.get(venueId);
  if (!venue) return;

  const oldCount = venue.reviewCount ?? 0;
  const oldAvg = venue.avgRating ?? 0;
  const newCount = oldCount + 1;
  // New average: ((oldAvg * oldCount) + newRating) / newCount
  const newAvg = oldCount === 0 ? newRating : ((oldAvg * oldCount) + newRating) / newCount;

  await ctx.db.patch(venueId, {
    reviewCount: newCount,
    avgRating: newAvg,
    updatedAt: Date.now(),
  });
}

async function updateReviewStatsOnRatingChange(ctx: any, venueId: Id<"venues">, oldRating: number, newRating: number) {
  const venue = await ctx.db.get(venueId);
  if (!venue) return;

  const count = venue.reviewCount ?? 1;
  const oldAvg = venue.avgRating ?? oldRating;
  // Update average: ((oldAvg * count) - oldRating + newRating) / count
  const newAvg = count === 1 ? newRating : ((oldAvg * count) - oldRating + newRating) / count;

  await ctx.db.patch(venueId, {
    avgRating: newAvg,
    updatedAt: Date.now(),
  });
}

async function decrementReviewStats(ctx: any, venueId: Id<"venues">, deletedRating: number) {
  const venue = await ctx.db.get(venueId);
  if (!venue) return;

  const oldCount = venue.reviewCount ?? 1;
  const oldAvg = venue.avgRating ?? deletedRating;
  const newCount = Math.max(0, oldCount - 1);
  // New average: ((oldAvg * oldCount) - deletedRating) / newCount
  const newAvg = newCount === 0 ? undefined : ((oldAvg * oldCount) - deletedRating) / newCount;

  await ctx.db.patch(venueId, {
    reviewCount: newCount,
    avgRating: newAvg,
    updatedAt: Date.now(),
  });
}

/**
 * List reviews for a venue
 * Uses denormalized author fields - no joins needed!
 */
export const listByVenue = query({
  args: { venueId: v.id("venues") },
  returns: v.array(reviewWithAuthorValidator),
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const isAdmin = currentUser && hasMinRole(currentUser.role, "admin");

    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_venue", (q) => q.eq("venueId", args.venueId))
      .order("desc")
      .collect();

    // No joins needed - use denormalized author fields
    return reviews.map((review) => {
      const isOwner = currentUser?._id === review.userId;
      return {
        ...review,
        author: {
          _id: review.userId,
          name: review.authorName,
          email: review.authorEmail ?? "",
          avatarUrl: review.authorAvatarUrl,
        },
        canEdit: isOwner || false,
        canDelete: isOwner || isAdmin || false,
      };
    });
  },
});

/**
 * List reviews by a user
 * Uses denormalized venue fields - no joins needed!
 */
export const listByUser = query({
  args: { userId: v.id("users") },
  returns: v.array(
    v.object({
      _id: v.id("reviews"),
      _creationTime: v.number(),
      venueId: v.id("venues"),
      userId: v.id("users"),
      rating: v.number(),
      content: v.string(),
      visitedAt: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
      venueName: v.string(),
      venueType: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(50);

    // Use denormalized venue fields - no joins needed
    return reviews
      .filter((r) => r.venueName) // Only return reviews with denormalized data
      .map((review) => ({
        ...review,
        venueName: review.venueName ?? "Unknown",
        venueType: review.venueType ?? "unknown",
      }));
  },
});

/**
 * Get a single review
 * Uses denormalized author fields - no joins needed!
 */
export const get = query({
  args: { id: v.id("reviews") },
  returns: v.union(reviewWithAuthorValidator, v.null()),
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const review = await ctx.db.get(args.id);
    if (!review) {
      return null;
    }

    const isOwner = currentUser?._id === review.userId;
    const isAdmin = currentUser && hasMinRole(currentUser.role, "admin");

    // Use denormalized author fields - no user fetch needed
    return {
      ...review,
      author: {
        _id: review.userId,
        name: review.authorName,
        email: review.authorEmail ?? "",
        avatarUrl: review.authorAvatarUrl,
      },
      canEdit: isOwner || false,
      canDelete: isOwner || isAdmin || false,
    };
  },
});

/**
 * Check if user has reviewed a venue
 */
export const getUserReviewForVenue = query({
  args: { venueId: v.id("venues") },
  returns: v.union(
    v.object({
      _id: v.id("reviews"),
      _creationTime: v.number(),
      venueId: v.id("venues"),
      userId: v.id("users"),
      rating: v.number(),
      content: v.string(),
      visitedAt: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser) {
      return null;
    }

    return await ctx.db
      .query("reviews")
      .withIndex("by_venue_and_user", (q) =>
        q.eq("venueId", args.venueId).eq("userId", currentUser._id)
      )
      .unique();
  },
});

/**
 * Create a review (requires user role or higher)
 */
export const create = mutation({
  args: {
    venueId: v.id("venues"),
    rating: v.number(),
    content: v.string(),
    visitedAt: v.optional(v.number()),
  },
  returns: v.id("reviews"),
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser) {
      throw new Error("Not authenticated");
    }

    if (!hasMinRole(currentUser.role, "user")) {
      throw new Error("You need to be upgraded to 'user' role to write reviews");
    }

    // Validate rating
    if (args.rating < 1 || args.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    // Check venue exists
    const venue = await ctx.db.get(args.venueId);
    if (!venue) {
      throw new Error("Venue not found");
    }

    // Check if user already reviewed this venue
    const existingReview = await ctx.db
      .query("reviews")
      .withIndex("by_venue_and_user", (q) =>
        q.eq("venueId", args.venueId).eq("userId", currentUser._id)
      )
      .unique();

    if (existingReview) {
      throw new Error("You have already reviewed this venue");
    }

    const now = Date.now();
    const reviewId = await ctx.db.insert("reviews", {
      venueId: args.venueId,
      userId: currentUser._id,
      rating: args.rating,
      content: args.content,
      visitedAt: args.visitedAt,
      // Denormalized author info (avoids joins on read)
      authorName: currentUser.name,
      authorEmail: currentUser.email,
      authorAvatarUrl: currentUser.avatarUrl,
      // Denormalized venue info (avoids joins in listByUser)
      venueName: venue.name,
      venueType: venue.type,
      createdAt: now,
      updatedAt: now,
    });

    // Create activity entry with denormalized user/venue info
    await ctx.db.insert("activity", {
      userId: currentUser._id,
      venueId: args.venueId,
      actionType: "review_created",
      userName: currentUser.name,
      userAvatarUrl: currentUser.avatarUrl,
      venueName: venue.name,
      venueType: venue.type,
      metadata: { reviewId, rating: args.rating },
      createdAt: now,
    });

    // Incrementally update venue stats (avoids race conditions)
    await incrementReviewStats(ctx, args.venueId, args.rating);

    return reviewId;
  },
});

/**
 * Update a review (owner only)
 */
export const update = mutation({
  args: {
    id: v.id("reviews"),
    rating: v.optional(v.number()),
    content: v.optional(v.string()),
    visitedAt: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser) {
      throw new Error("Not authenticated");
    }

    const review = await ctx.db.get(args.id);
    if (!review) {
      throw new Error("Review not found");
    }

    // Only owner can update
    if (review.userId !== currentUser._id) {
      throw new Error("Not authorized to edit this review");
    }

    // Validate rating if provided
    if (args.rating !== undefined && (args.rating < 1 || args.rating > 5)) {
      throw new Error("Rating must be between 1 and 5");
    }

    const now = Date.now();
    const updates: Record<string, unknown> = { updatedAt: now };
    if (args.rating !== undefined) updates.rating = args.rating;
    if (args.content !== undefined) updates.content = args.content;
    if (args.visitedAt !== undefined) updates.visitedAt = args.visitedAt;

    await ctx.db.patch(args.id, updates);

    // Get venue for activity denormalization
    const venue = await ctx.db.get(review.venueId);

    // Create activity entry with denormalized info
    await ctx.db.insert("activity", {
      userId: currentUser._id,
      venueId: review.venueId,
      actionType: "review_updated",
      userName: currentUser.name,
      userAvatarUrl: currentUser.avatarUrl,
      venueName: venue?.name,
      venueType: venue?.type,
      metadata: { reviewId: args.id },
      createdAt: now,
    });

    // Update venue stats if rating changed (incremental update avoids race conditions)
    if (args.rating !== undefined && args.rating !== review.rating) {
      await updateReviewStatsOnRatingChange(ctx, review.venueId, review.rating, args.rating);
    }

    return null;
  },
});

/**
 * Delete a review (owner or admin)
 */
export const remove = mutation({
  args: { id: v.id("reviews") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser) {
      throw new Error("Not authenticated");
    }

    const review = await ctx.db.get(args.id);
    if (!review) {
      throw new Error("Review not found");
    }

    // Owner or admin can delete
    const canDelete = review.userId === currentUser._id || hasMinRole(currentUser.role, "admin");
    if (!canDelete) {
      throw new Error("Not authorized to delete this review");
    }

    const venueId = review.venueId;
    const deletedRating = review.rating;
    await ctx.db.delete(args.id);

    // Decrementally update venue stats (avoids race conditions)
    await decrementReviewStats(ctx, venueId, deletedRating);

    return null;
  },
});
