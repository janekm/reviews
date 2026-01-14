import { CacheKeys } from "./keys";

/**
 * Metadata that can be passed to invalidation rules for context-aware invalidation.
 */
export interface InvalidationMeta {
  venueId?: string;
  creatorId?: string;
  updatedById?: string;
}

/**
 * Invalidation rules define which cache keys should be deleted when an entity changes.
 * This centralizes all invalidation logic in one place.
 *
 * Rules can return:
 * - Exact keys to delete
 * - Patterns ending with "*" for prefix-based deletion
 */
export const InvalidationRules = {
  /**
   * When a venue is created, updated, or deleted
   */
  venue: (id: string, meta?: InvalidationMeta): string[] => {
    const keys = [
      // Direct venue caches
      CacheKeys.venue(id),
      CacheKeys.venueWithUsers(id),
      // List caches (venue might appear in lists)
      CacheKeys.venuesList(),
      // All type-specific lists (we don't know which type changed)
      CacheKeys.venuesListByType("restaurant"),
      CacheKeys.venuesListByType("cafe"),
      CacheKeys.venuesListByType("shop"),
      CacheKeys.venuesListByType("bar"),
      // All canEdit checks for this venue
      `venue:${id}:canEdit:*`,
    ];

    return keys;
  },

  /**
   * When a review is created, updated, or deleted
   */
  review: (id: string, meta?: InvalidationMeta): string[] => {
    const keys = [CacheKeys.review(id)];

    // If we know the venue, invalidate its reviews cache
    if (meta?.venueId) {
      keys.push(CacheKeys.venueReviews(meta.venueId));
    }

    return keys;
  },

  /**
   * When a user is updated (name, avatar, role change)
   */
  user: (id: string, meta?: InvalidationMeta): string[] => {
    return [
      // Direct user caches
      CacheKeys.user(id),
      CacheKeys.userSummary(id),
      // Any venue this user created or edited will have stale user data
      // We use pattern matching to find and invalidate these
      `venue:*:full`, // All full venue caches (they embed user data)
      `venue:*:reviews`, // All review caches (they embed user data)
    ];
  },

  /**
   * When user role changes (affects canEdit checks)
   */
  userRole: (id: string, _meta?: InvalidationMeta): string[] => {
    return [
      CacheKeys.user(id),
      // All canEdit checks by this user are now invalid
      `venue:*:canEdit:${id}`,
    ];
  },
} as const;

export type InvalidationEntity = keyof typeof InvalidationRules;
