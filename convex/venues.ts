import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { hasMinRole, UserRole } from "./users";

// Validator for price range
const priceRangeValidator = v.optional(
  v.union(
    v.literal("$"),
    v.literal("$$"),
    v.literal("$$$"),
    v.literal("$$$$")
  )
);

// Return type for venue list (with computed fields)
const venueListItemValidator = v.object({
  _id: v.id("venues"),
  _creationTime: v.number(),
  name: v.string(),
  type: v.string(),
  address: v.string(),
  description: v.optional(v.string()),
  website: v.optional(v.string()),
  phone: v.optional(v.string()),
  priceRange: priceRangeValidator,
  latitude: v.optional(v.number()),
  longitude: v.optional(v.number()),
  mainPhotoId: v.optional(v.id("photos")),
  // Denormalized stats (stored on venue)
  avgRating: v.optional(v.number()),
  reviewCount: v.optional(v.number()),
  photoCount: v.optional(v.number()),
  createdBy: v.id("users"),
  createdAt: v.number(),
  updatedAt: v.number(),
  // Computed at query time
  mainPhotoStorageKey: v.optional(v.string()),
  isFavorite: v.boolean(),
});

// Helper to get current user with role check
async function getCurrentUserWithRole(ctx: any, minRole?: UserRole) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_workos_id", (q: any) => q.eq("workosUserId", identity.subject))
    .unique();

  if (!user) {
    return null;
  }

  if (minRole && !hasMinRole(user.role, minRole)) {
    return null;
  }

  return user;
}

/**
 * List all venues with computed fields
 */
export const list = query({
  args: {
    type: v.optional(v.string()),
    favoritesOnly: v.optional(v.boolean()),
  },
  returns: v.array(venueListItemValidator),
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUserWithRole(ctx);

    // Get venues based on type filter
    let venuesQuery = ctx.db.query("venues");

    let venues: Array<Doc<"venues">>;
    if (args.type) {
      const typeFilter = args.type;
      venues = await venuesQuery
        .withIndex("by_type", (q) => q.eq("type", typeFilter))
        .collect();
    } else {
      venues = await venuesQuery.collect();
    }

    // Get user's favorites if logged in
    const userFavoriteIds = new Set<string>();
    if (currentUser) {
      const favorites = await ctx.db
        .query("favorites")
        .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
        .collect();
      for (const fav of favorites) {
        userFavoriteIds.add(fav.venueId);
      }
    }

    // Filter by favorites if requested
    if (args.favoritesOnly && currentUser) {
      venues = venues.filter((v) => userFavoriteIds.has(v._id));
    }

    // Build result using stored stats (no extra queries needed!)
    const result: Array<typeof venueListItemValidator.type> = venues.map((venue) => ({
      ...venue,
      isFavorite: userFavoriteIds.has(venue._id),
    }));

    // Sort: venues with reviews first, then by average rating (descending), then by review count
    result.sort((a, b) => {
      // First: venues with reviews come before those without
      const aHasReviews = (a.reviewCount ?? 0) > 0;
      const bHasReviews = (b.reviewCount ?? 0) > 0;
      if (aHasReviews && !bHasReviews) return -1;
      if (!aHasReviews && bHasReviews) return 1;

      // Second: sort by average rating (descending)
      if (aHasReviews && bHasReviews) {
        const ratingDiff = (b.avgRating ?? 0) - (a.avgRating ?? 0);
        if (ratingDiff !== 0) return ratingDiff;
        // Third: for same rating, more reviews comes first
        return (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
      }

      // For venues without reviews, sort by creation time (newest first)
      return b._creationTime - a._creationTime;
    });

    return result;
  },
});

/**
 * Get a single venue with all details
 */
export const get = query({
  args: { id: v.id("venues") },
  returns: v.union(
    v.object({
      venue: v.object({
        _id: v.id("venues"),
        _creationTime: v.number(),
        name: v.string(),
        type: v.string(),
        address: v.string(),
        description: v.optional(v.string()),
        website: v.optional(v.string()),
        phone: v.optional(v.string()),
        priceRange: priceRangeValidator,
        latitude: v.optional(v.number()),
        longitude: v.optional(v.number()),
        mainPhotoId: v.optional(v.id("photos")),
        mainPhotoStorageKey: v.optional(v.string()),
        avgRating: v.optional(v.number()),
        reviewCount: v.optional(v.number()),
        photoCount: v.optional(v.number()),
        createdBy: v.id("users"),
        createdAt: v.number(),
        updatedAt: v.number(),
      }),
      avgRating: v.union(v.number(), v.null()),
      reviewCount: v.number(),
      photoCount: v.number(),
      isFavorite: v.boolean(),
      canEdit: v.boolean(),
      creator: v.union(
        v.object({
          _id: v.id("users"),
          name: v.optional(v.string()),
          email: v.string(),
        }),
        v.null()
      ),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const venue = await ctx.db.get(args.id);
    if (!venue) {
      return null;
    }

    const currentUser = await getCurrentUserWithRole(ctx);

    // Get reviews
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_venue", (q) => q.eq("venueId", args.id))
      .collect();

    const reviewCount = reviews.length;
    const avgRating = reviewCount > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : null;

    // Get photo count
    const photos = await ctx.db
      .query("photos")
      .withIndex("by_venue", (q) => q.eq("venueId", args.id))
      .collect();
    const photoCount = photos.length;

    // Check if favorite
    let isFavorite = false;
    if (currentUser) {
      const favorite = await ctx.db
        .query("favorites")
        .withIndex("by_user_and_venue", (q) =>
          q.eq("userId", currentUser._id).eq("venueId", args.id)
        )
        .unique();
      isFavorite = !!favorite;
    }

    // Check if can edit (creator, editor, or admin)
    const canEdit = currentUser
      ? venue.createdBy === currentUser._id || hasMinRole(currentUser.role, "editor")
      : false;

    // Get creator info
    const creator = await ctx.db.get(venue.createdBy);
    const creatorInfo = creator
      ? { _id: creator._id, name: creator.name, email: creator.email }
      : null;

    return {
      venue,
      avgRating,
      reviewCount,
      photoCount,
      isFavorite,
      canEdit,
      creator: creatorInfo,
    };
  },
});

/**
 * Get all venue types
 */
export const getTypes = query({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    const venues = await ctx.db.query("venues").collect();
    const types = new Set<string>();
    for (const venue of venues) {
      types.add(venue.type);
    }
    return Array.from(types).sort();
  },
});

/**
 * Create a new venue (editor or admin only)
 */
export const create = mutation({
  args: {
    name: v.string(),
    type: v.string(),
    address: v.string(),
    description: v.optional(v.string()),
    website: v.optional(v.string()),
    phone: v.optional(v.string()),
    priceRange: priceRangeValidator,
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  },
  returns: v.id("venues"),
  handler: async (ctx, args) => {
    const user = await getCurrentUserWithRole(ctx, "editor");
    if (!user) {
      throw new Error("Only editors and admins can create venues");
    }

    const now = Date.now();
    const venueId = await ctx.db.insert("venues", {
      ...args,
      mainPhotoId: undefined,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    });

    // Create activity entry
    await ctx.db.insert("activity", {
      userId: user._id,
      venueId,
      actionType: "venue_created",
      createdAt: now,
    });

    return venueId;
  },
});

/**
 * Update a venue (creator, editor, or admin only)
 */
export const update = mutation({
  args: {
    id: v.id("venues"),
    name: v.optional(v.string()),
    type: v.optional(v.string()),
    address: v.optional(v.string()),
    description: v.optional(v.string()),
    website: v.optional(v.string()),
    phone: v.optional(v.string()),
    priceRange: priceRangeValidator,
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUserWithRole(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const venue = await ctx.db.get(args.id);
    if (!venue) {
      throw new Error("Venue not found");
    }

    // Check permission: creator, editor, or admin
    const canEdit = venue.createdBy === user._id || hasMinRole(user.role, "editor");
    if (!canEdit) {
      throw new Error("Not authorized to edit this venue");
    }

    const { id, ...updates } = args;
    // Filter out undefined values
    const filteredUpdates: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        filteredUpdates[key] = value;
      }
    }

    await ctx.db.patch(args.id, filteredUpdates);
    return null;
  },
});

/**
 * Set the main photo for a venue
 */
export const setMainPhoto = mutation({
  args: {
    venueId: v.id("venues"),
    photoId: v.id("photos"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUserWithRole(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const venue = await ctx.db.get(args.venueId);
    if (!venue) {
      throw new Error("Venue not found");
    }

    // Check permission: creator, editor, or admin
    const canEdit = venue.createdBy === user._id || hasMinRole(user.role, "editor");
    if (!canEdit) {
      throw new Error("Not authorized to edit this venue");
    }

    // Verify photo belongs to this venue
    const photo = await ctx.db.get(args.photoId);
    if (!photo || photo.venueId !== args.venueId) {
      throw new Error("Photo not found or does not belong to this venue");
    }

    await ctx.db.patch(args.venueId, {
      mainPhotoId: args.photoId,
      mainPhotoStorageKey: photo.storageKey,
      updatedAt: Date.now(),
    });

    return null;
  },
});

/**
 * Delete a venue (admin only)
 */
export const remove = mutation({
  args: { id: v.id("venues") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUserWithRole(ctx, "admin");
    if (!user) {
      throw new Error("Only admins can delete venues");
    }

    const venue = await ctx.db.get(args.id);
    if (!venue) {
      throw new Error("Venue not found");
    }

    // Delete related data
    // Delete reviews
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_venue", (q) => q.eq("venueId", args.id))
      .collect();
    for (const review of reviews) {
      await ctx.db.delete(review._id);
    }

    // Delete photos
    const photos = await ctx.db
      .query("photos")
      .withIndex("by_venue", (q) => q.eq("venueId", args.id))
      .collect();
    for (const photo of photos) {
      if (photo.storageId) {
        await ctx.storage.delete(photo.storageId);
      }
      await ctx.db.delete(photo._id);
    }

    // Delete favorites
    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_venue", (q) => q.eq("venueId", args.id))
      .collect();
    for (const favorite of favorites) {
      await ctx.db.delete(favorite._id);
    }

    // Delete venue
    await ctx.db.delete(args.id);

    return null;
  },
});
