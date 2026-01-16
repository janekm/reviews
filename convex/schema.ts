import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    workosUserId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    role: v.union(
      v.literal("viewer"),
      v.literal("user"),
      v.literal("editor"),
      v.literal("admin")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workos_id", ["workosUserId"])
    .index("by_email", ["email"]),

  venues: defineTable({
    name: v.string(),
    type: v.string(), // restaurant, cafe, shop, bar
    address: v.string(),
    description: v.optional(v.string()),
    website: v.optional(v.string()),
    phone: v.optional(v.string()),
    priceRange: v.optional(
      v.union(
        v.literal("$"),
        v.literal("$$"),
        v.literal("$$$"),
        v.literal("$$$$")
      )
    ),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    mainPhotoId: v.optional(v.id("photos")),
    mainPhotoStorageKey: v.optional(v.string()), // Denormalized for fast list queries
    // Denormalized stats (updated when reviews/photos change)
    avgRating: v.optional(v.number()),
    reviewCount: v.optional(v.number()),
    photoCount: v.optional(v.number()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_type", ["type"])
    .index("by_created_by", ["createdBy"]),

  reviews: defineTable({
    venueId: v.id("venues"),
    userId: v.id("users"),
    rating: v.number(),
    content: v.string(),
    visitedAt: v.optional(v.number()),
    // Denormalized author info (avoids joins)
    authorName: v.optional(v.string()),
    authorEmail: v.optional(v.string()),
    authorAvatarUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_venue", ["venueId"])
    .index("by_user", ["userId"])
    .index("by_venue_and_user", ["venueId", "userId"]),

  photos: defineTable({
    venueId: v.id("venues"),
    reviewId: v.optional(v.id("reviews")), // Optional - photo can be on venue or review
    userId: v.id("users"),
    storageId: v.optional(v.id("_storage")), // Optional for R2 migration
    storageKey: v.string(), // R2 path or Convex storage key
    originalFilename: v.optional(v.string()),
    caption: v.optional(v.string()),
    // Denormalized uploader info (avoids joins)
    uploaderName: v.optional(v.string()),
    uploaderEmail: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_venue", ["venueId"])
    .index("by_review", ["reviewId"])
    .index("by_user", ["userId"]),

  favorites: defineTable({
    userId: v.id("users"),
    venueId: v.id("venues"),
    // Denormalized venue info (avoids joins)
    venueName: v.optional(v.string()),
    venueType: v.optional(v.string()),
    venueAddress: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_venue", ["venueId"])
    .index("by_user_and_venue", ["userId", "venueId"]),

  activity: defineTable({
    userId: v.id("users"),
    venueId: v.id("venues"),
    actionType: v.union(
      v.literal("review_created"),
      v.literal("review_updated"),
      v.literal("photo_added"),
      v.literal("venue_created"),
      v.literal("favorite_added")
    ),
    // Denormalized user/venue info (avoids joins)
    userName: v.optional(v.string()),
    userAvatarUrl: v.optional(v.string()),
    venueName: v.optional(v.string()),
    venueType: v.optional(v.string()),
    // Typed metadata based on action type
    metadata: v.optional(
      v.union(
        v.object({ reviewId: v.id("reviews"), rating: v.number() }), // review_created
        v.object({ reviewId: v.id("reviews") }), // review_updated
        v.object({ photoId: v.id("photos"), reviewId: v.optional(v.id("reviews")) }), // photo_added
        v.null() // venue_created, favorite_added
      )
    ),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_venue", ["venueId"])
    .index("by_created_at", ["createdAt"]),
});
