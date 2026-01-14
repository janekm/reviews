/**
 * Cache key builders for consistent key naming across the app.
 * All cache keys are defined here to ensure consistency and easy refactoring.
 */

export const CacheKeys = {
  // Venue keys
  venue: (id: string) => `venue:${id}`,
  venueWithUsers: (id: string) => `venue:${id}:full`,
  venueCanEdit: (venueId: string, userId: string) =>
    `venue:${venueId}:canEdit:${userId}`,

  // Venue collections
  venuesList: () => `venues:list`,
  venuesListByType: (type: string) => `venues:list:type:${type}`,

  // Review keys
  review: (id: string) => `review:${id}`,
  venueReviews: (venueId: string) => `venue:${venueId}:reviews`,

  // User keys
  user: (id: string) => `user:${id}`,
  userSummary: (id: string) => `user:${id}:summary`,

  // Pattern prefixes (for bulk invalidation)
  venuePrefix: (id: string) => `venue:${id}:`,
  userVenuesPrefix: (userId: string) => `venues:creator:${userId}`,
} as const;

/** TTL values in seconds */
export const CacheTTL = {
  venueWithUsers: 300, // 5 minutes
  venueReviews: 120, // 2 minutes
  venuesList: 60, // 1 minute
  user: 3600, // 1 hour
  canEdit: 300, // 5 minutes
} as const;
