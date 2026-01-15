import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { hasMinRole } from "./users";

// Return type for review with author info
const reviewWithAuthorValidator = v.object({
  _id: v.id("reviews"),
  _creationTime: v.number(),
  venueId: v.id("venues"),
  userId: v.id("users"),
  rating: v.number(),
  content: v.string(),
  visitedAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
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

/**
 * List reviews for a venue
 */
export const listByVenue = query({
  args: { venueId: v.id("venues") },
  returns: v.array(reviewWithAuthorValidator),
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_venue", (q) => q.eq("venueId", args.venueId))
      .order("desc")
      .collect();

    const result: Array<typeof reviewWithAuthorValidator.type> = [];

    for (const review of reviews) {
      const author = await ctx.db.get(review.userId);
      if (!author) continue;

      const isOwner = currentUser?._id === review.userId;
      const isAdmin = currentUser && hasMinRole(currentUser.role, "admin");

      result.push({
        ...review,
        author: {
          _id: author._id,
          name: author.name,
          email: author.email,
          avatarUrl: author.avatarUrl,
        },
        canEdit: isOwner || false,
        canDelete: isOwner || isAdmin || false,
      });
    }

    return result;
  },
});

/**
 * List reviews by a user
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
      .collect();

    const result: Array<{
      _id: Id<"reviews">;
      _creationTime: number;
      venueId: Id<"venues">;
      userId: Id<"users">;
      rating: number;
      content: string;
      visitedAt?: number;
      createdAt: number;
      updatedAt: number;
      venueName: string;
      venueType: string;
    }> = [];

    for (const review of reviews) {
      const venue = await ctx.db.get(review.venueId);
      if (!venue) continue;

      result.push({
        ...review,
        venueName: venue.name,
        venueType: venue.type,
      });
    }

    return result;
  },
});

/**
 * Get a single review
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

    const author = await ctx.db.get(review.userId);
    if (!author) {
      return null;
    }

    const isOwner = currentUser?._id === review.userId;
    const isAdmin = currentUser && hasMinRole(currentUser.role, "admin");

    return {
      ...review,
      author: {
        _id: author._id,
        name: author.name,
        email: author.email,
        avatarUrl: author.avatarUrl,
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
      createdAt: now,
      updatedAt: now,
    });

    // Create activity entry
    await ctx.db.insert("activity", {
      userId: currentUser._id,
      venueId: args.venueId,
      actionType: "review_created",
      metadata: { reviewId, rating: args.rating },
      createdAt: now,
    });

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

    // Create activity entry
    await ctx.db.insert("activity", {
      userId: currentUser._id,
      venueId: review.venueId,
      actionType: "review_updated",
      metadata: { reviewId: args.id },
      createdAt: now,
    });

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

    await ctx.db.delete(args.id);
    return null;
  },
});
