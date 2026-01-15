import { query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Action type validator
const actionTypeValidator = v.union(
  v.literal("review_created"),
  v.literal("review_updated"),
  v.literal("photo_added"),
  v.literal("venue_created"),
  v.literal("favorite_added")
);

// Activity item with details
const activityItemValidator = v.object({
  _id: v.id("activity"),
  _creationTime: v.number(),
  userId: v.id("users"),
  venueId: v.id("venues"),
  actionType: actionTypeValidator,
  metadata: v.optional(v.any()),
  createdAt: v.number(),
  user: v.object({
    _id: v.id("users"),
    name: v.optional(v.string()),
    email: v.string(),
    avatarUrl: v.optional(v.string()),
  }),
  venue: v.object({
    _id: v.id("venues"),
    name: v.string(),
    type: v.string(),
  }),
});

/**
 * List recent activity (global feed)
 */
export const listRecent = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(activityItemValidator),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    const activities = await ctx.db
      .query("activity")
      .withIndex("by_created_at")
      .order("desc")
      .take(limit);

    const result: Array<typeof activityItemValidator.type> = [];

    for (const activity of activities) {
      const user = await ctx.db.get(activity.userId);
      const venue = await ctx.db.get(activity.venueId);

      if (!user || !venue) continue;

      result.push({
        ...activity,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
        },
        venue: {
          _id: venue._id,
          name: venue.name,
          type: venue.type,
        },
      });
    }

    return result;
  },
});

/**
 * List activity for a specific user
 */
export const listByUser = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  returns: v.array(activityItemValidator),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    const activities = await ctx.db
      .query("activity")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    const result: Array<typeof activityItemValidator.type> = [];
    const user = await ctx.db.get(args.userId);
    if (!user) return [];

    for (const activity of activities) {
      const venue = await ctx.db.get(activity.venueId);
      if (!venue) continue;

      result.push({
        ...activity,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
        },
        venue: {
          _id: venue._id,
          name: venue.name,
          type: venue.type,
        },
      });
    }

    return result;
  },
});

/**
 * List activity for a specific venue
 */
export const listByVenue = query({
  args: {
    venueId: v.id("venues"),
    limit: v.optional(v.number()),
  },
  returns: v.array(activityItemValidator),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    // We need to query all and filter since we don't have a by_venue index
    // This is acceptable for small amounts of data
    const allActivities = await ctx.db
      .query("activity")
      .withIndex("by_created_at")
      .order("desc")
      .collect();

    const venueActivities = allActivities
      .filter((a) => a.venueId === args.venueId)
      .slice(0, limit);

    const result: Array<typeof activityItemValidator.type> = [];
    const venue = await ctx.db.get(args.venueId);
    if (!venue) return [];

    for (const activity of venueActivities) {
      const user = await ctx.db.get(activity.userId);
      if (!user) continue;

      result.push({
        ...activity,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
        },
        venue: {
          _id: venue._id,
          name: venue.name,
          type: venue.type,
        },
      });
    }

    return result;
  },
});

/**
 * Get activity stats (for dashboard)
 */
export const getStats = query({
  args: {},
  returns: v.object({
    totalReviews: v.number(),
    totalPhotos: v.number(),
    totalVenues: v.number(),
    recentActivityCount: v.number(),
  }),
  handler: async (ctx) => {
    // Count activities by type
    const allActivities = await ctx.db.query("activity").collect();

    const reviewCount = allActivities.filter(
      (a) => a.actionType === "review_created"
    ).length;

    const photoCount = allActivities.filter(
      (a) => a.actionType === "photo_added"
    ).length;

    const venueCount = allActivities.filter(
      (a) => a.actionType === "venue_created"
    ).length;

    // Recent activity (last 7 days)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentCount = allActivities.filter(
      (a) => a.createdAt > sevenDaysAgo
    ).length;

    return {
      totalReviews: reviewCount,
      totalPhotos: photoCount,
      totalVenues: venueCount,
      recentActivityCount: recentCount,
    };
  },
});
