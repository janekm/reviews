import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";

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
 * Check if a venue is favorited by the current user
 */
export const isFavorite = query({
  args: { venueId: v.id("venues") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser) {
      return false;
    }

    const favorite = await ctx.db
      .query("favorites")
      .withIndex("by_user_and_venue", (q) =>
        q.eq("userId", currentUser._id).eq("venueId", args.venueId)
      )
      .unique();

    return !!favorite;
  },
});

/**
 * List all favorites for the current user
 */
export const listMine = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("favorites"),
      _creationTime: v.number(),
      userId: v.id("users"),
      venueId: v.id("venues"),
      createdAt: v.number(),
      venue: v.object({
        _id: v.id("venues"),
        name: v.string(),
        type: v.string(),
        address: v.string(),
      }),
    })
  ),
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser) {
      return [];
    }

    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
      .order("desc")
      .collect();

    const result: Array<{
      _id: Id<"favorites">;
      _creationTime: number;
      userId: Id<"users">;
      venueId: Id<"venues">;
      createdAt: number;
      venue: {
        _id: Id<"venues">;
        name: string;
        type: string;
        address: string;
      };
    }> = [];

    for (const favorite of favorites) {
      const venue = await ctx.db.get(favorite.venueId);
      if (!venue) continue;

      result.push({
        ...favorite,
        venue: {
          _id: venue._id,
          name: venue.name,
          type: venue.type,
          address: venue.address,
        },
      });
    }

    return result;
  },
});

/**
 * Get favorite venue IDs for current user
 */
export const getMyFavoriteIds = query({
  args: {},
  returns: v.array(v.id("venues")),
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser) {
      return [];
    }

    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
      .collect();

    return favorites.map((f) => f.venueId);
  },
});

/**
 * Add a venue to favorites
 */
export const add = mutation({
  args: { venueId: v.id("venues") },
  returns: v.id("favorites"),
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser) {
      throw new Error("Not authenticated");
    }

    // Verify venue exists
    const venue = await ctx.db.get(args.venueId);
    if (!venue) {
      throw new Error("Venue not found");
    }

    // Check if already favorited
    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user_and_venue", (q) =>
        q.eq("userId", currentUser._id).eq("venueId", args.venueId)
      )
      .unique();

    if (existing) {
      return existing._id;
    }

    const now = Date.now();
    const favoriteId = await ctx.db.insert("favorites", {
      userId: currentUser._id,
      venueId: args.venueId,
      createdAt: now,
    });

    // Create activity entry
    await ctx.db.insert("activity", {
      userId: currentUser._id,
      venueId: args.venueId,
      actionType: "favorite_added",
      createdAt: now,
    });

    return favoriteId;
  },
});

/**
 * Remove a venue from favorites
 */
export const remove = mutation({
  args: { venueId: v.id("venues") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser) {
      throw new Error("Not authenticated");
    }

    const favorite = await ctx.db
      .query("favorites")
      .withIndex("by_user_and_venue", (q) =>
        q.eq("userId", currentUser._id).eq("venueId", args.venueId)
      )
      .unique();

    if (favorite) {
      await ctx.db.delete(favorite._id);
    }

    return null;
  },
});

/**
 * Toggle favorite status for a venue
 */
export const toggle = mutation({
  args: { venueId: v.id("venues") },
  returns: v.boolean(), // Returns new favorite status
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser) {
      throw new Error("Not authenticated");
    }

    // Verify venue exists
    const venue = await ctx.db.get(args.venueId);
    if (!venue) {
      throw new Error("Venue not found");
    }

    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user_and_venue", (q) =>
        q.eq("userId", currentUser._id).eq("venueId", args.venueId)
      )
      .unique();

    if (existing) {
      // Remove favorite
      await ctx.db.delete(existing._id);
      return false;
    } else {
      // Add favorite
      const now = Date.now();
      await ctx.db.insert("favorites", {
        userId: currentUser._id,
        venueId: args.venueId,
        createdAt: now,
      });

      // Create activity entry
      await ctx.db.insert("activity", {
        userId: currentUser._id,
        venueId: args.venueId,
        actionType: "favorite_added",
        createdAt: now,
      });

      return true;
    }
  },
});
