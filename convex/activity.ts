import { query } from "./_generated/server";
import { v } from "convex/values";

// Action type validator
const actionTypeValidator = v.union(
  v.literal("review_created"),
  v.literal("review_updated"),
  v.literal("photo_added"),
  v.literal("venue_created"),
  v.literal("favorite_added")
);

// Activity item with details (uses denormalized fields)
const activityItemValidator = v.object({
  _id: v.id("activity"),
  _creationTime: v.number(),
  userId: v.id("users"),
  venueId: v.id("venues"),
  actionType: actionTypeValidator,
  // Denormalized fields
  userName: v.optional(v.string()),
  userAvatarUrl: v.optional(v.string()),
  venueName: v.optional(v.string()),
  venueType: v.optional(v.string()),
  metadata: v.optional(v.any()),
  createdAt: v.number(),
  // Computed for backward compatibility
  user: v.object({
    _id: v.id("users"),
    name: v.optional(v.string()),
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
 * Uses denormalized fields - no joins needed!
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

    // No joins needed - use denormalized fields
    return activities
      .filter((a) => a.venueName) // Only return activities with denormalized data
      .map((activity) => ({
        ...activity,
        user: {
          _id: activity.userId,
          name: activity.userName,
          avatarUrl: activity.userAvatarUrl,
        },
        venue: {
          _id: activity.venueId,
          name: activity.venueName ?? "Unknown",
          type: activity.venueType ?? "unknown",
        },
      }));
  },
});

/**
 * List activity for a specific user
 * Uses denormalized fields - no joins needed!
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

    // No joins needed - use denormalized fields
    return activities
      .filter((a) => a.venueName)
      .map((activity) => ({
        ...activity,
        user: {
          _id: activity.userId,
          name: activity.userName,
          avatarUrl: activity.userAvatarUrl,
        },
        venue: {
          _id: activity.venueId,
          name: activity.venueName ?? "Unknown",
          type: activity.venueType ?? "unknown",
        },
      }));
  },
});

/**
 * List activity for a specific venue
 * Uses denormalized fields and by_venue index - no joins, no table scans!
 */
export const listByVenue = query({
  args: {
    venueId: v.id("venues"),
    limit: v.optional(v.number()),
  },
  returns: v.array(activityItemValidator),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    // Use the by_venue index (O(1) lookup instead of table scan)
    const activities = await ctx.db
      .query("activity")
      .withIndex("by_venue", (q) => q.eq("venueId", args.venueId))
      .order("desc")
      .take(limit);

    // No joins needed - use denormalized fields
    return activities
      .filter((a) => a.venueName)
      .map((activity) => ({
        ...activity,
        user: {
          _id: activity.userId,
          name: activity.userName,
          avatarUrl: activity.userAvatarUrl,
        },
        venue: {
          _id: activity.venueId,
          name: activity.venueName ?? "Unknown",
          type: activity.venueType ?? "unknown",
        },
      }));
  },
});

/**
 * Get activity stats (for dashboard)
 * Returns only recent activity count to avoid full table scans
 * Note: For total counts, consider maintaining denormalized counters in a stats table
 */
export const getStats = query({
  args: {},
  returns: v.object({
    recentActivityCount: v.number(),
  }),
  handler: async (ctx) => {
    // Recent activity (last 7 days) - use index, bounded query
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    const recentActivities = await ctx.db
      .query("activity")
      .withIndex("by_created_at")
      .order("desc")
      .take(100); // Only fetch enough to count recent activity

    const recentCount = recentActivities.filter(
      (a) => a.createdAt > sevenDaysAgo
    ).length;

    return {
      recentActivityCount: recentCount,
    };
  },
});
