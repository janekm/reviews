import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Maps old D1 IDs to new Convex IDs
type IdMap = Record<string, Id<any>>;

/**
 * Migration: Import users from D1 export
 */
export const importUsers = internalMutation({
  args: {
    users: v.array(v.object({
      id: v.string(),
      workos_id: v.string(),
      email: v.string(),
      name: v.optional(v.union(v.string(), v.null())),
      avatar_url: v.optional(v.union(v.string(), v.null())),
      created_at: v.number(),
      role: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const idMap: IdMap = {};

    for (const user of args.users) {
      // Check if user already exists by email (for production migration)
      const existingByEmail = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", user.email))
        .unique();

      if (existingByEmail) {
        // Update role from D1 data
        await ctx.db.patch(existingByEmail._id, {
          role: user.role as "viewer" | "user" | "editor" | "admin",
          name: user.name ?? existingByEmail.name,
          avatarUrl: user.avatar_url ?? existingByEmail.avatarUrl,
        });
        idMap[user.id] = existingByEmail._id;
        console.log(`User ${user.email} already exists, updated role to ${user.role}`);
        continue;
      }

      // Check by workos_id as fallback
      const existingByWorkos = await ctx.db
        .query("users")
        .withIndex("by_workos_id", (q) => q.eq("workosUserId", user.workos_id))
        .unique();

      if (existingByWorkos) {
        idMap[user.id] = existingByWorkos._id;
        console.log(`User ${user.email} already exists by workos_id, skipping`);
        continue;
      }

      // Create new user with placeholder workos_id (they'll get a real one when they sign in)
      const id = await ctx.db.insert("users", {
        workosUserId: `d1_migration_${user.workos_id}`,
        email: user.email,
        name: user.name ?? undefined,
        avatarUrl: user.avatar_url ?? undefined,
        role: user.role as "viewer" | "user" | "editor" | "admin",
        createdAt: user.created_at * 1000,
        updatedAt: Date.now(),
      });

      idMap[user.id] = id;
      console.log(`Imported new user: ${user.email}`);
    }

    return idMap;
  },
});

/**
 * Migration: Import venues from D1 export
 */
export const importVenues = internalMutation({
  args: {
    venues: v.array(v.object({
      id: v.string(),
      name: v.string(),
      type: v.string(),
      address: v.optional(v.union(v.string(), v.null())),
      description: v.optional(v.union(v.string(), v.null())),
      latitude: v.optional(v.union(v.number(), v.null())),
      longitude: v.optional(v.union(v.number(), v.null())),
      website: v.optional(v.union(v.string(), v.null())),
      created_at: v.number(),
      creator_id: v.optional(v.union(v.string(), v.null())),
      main_photo_id: v.optional(v.union(v.string(), v.null())),
      updated_at: v.optional(v.union(v.number(), v.null())),
      updated_by_id: v.optional(v.union(v.string(), v.null())),
    })),
    userIdMap: v.record(v.string(), v.string()),
    defaultUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const idMap: IdMap = {};

    for (const venue of args.venues) {
      // Check if venue already exists by name (simple dedup)
      const existing = await ctx.db
        .query("venues")
        .filter((q) => q.eq(q.field("name"), venue.name))
        .first();

      if (existing) {
        idMap[venue.id] = existing._id;
        console.log(`Venue ${venue.name} already exists, skipping`);
        continue;
      }

      const creatorId = venue.creator_id && args.userIdMap[venue.creator_id]
        ? (args.userIdMap[venue.creator_id] as Id<"users">)
        : args.defaultUserId;

      const id = await ctx.db.insert("venues", {
        name: venue.name,
        type: venue.type,
        address: venue.address ?? "",
        description: venue.description ?? undefined,
        latitude: venue.latitude ?? undefined,
        longitude: venue.longitude ?? undefined,
        website: venue.website ?? undefined,
        createdBy: creatorId,
        createdAt: venue.created_at * 1000,
        updatedAt: Date.now(),
      });

      idMap[venue.id] = id;
      console.log(`Imported venue: ${venue.name}`);
    }

    return idMap;
  },
});

/**
 * Migration: Import reviews from D1 export
 */
export const importReviews = internalMutation({
  args: {
    reviews: v.array(v.object({
      id: v.string(),
      venue_id: v.string(),
      user_id: v.string(),
      rating: v.number(),
      title: v.optional(v.union(v.string(), v.null())),
      content: v.optional(v.union(v.string(), v.null())),
      visited_at: v.optional(v.union(v.number(), v.null())),
      created_at: v.number(),
      updated_at: v.optional(v.union(v.number(), v.null())),
    })),
    userIdMap: v.record(v.string(), v.string()),
    venueIdMap: v.record(v.string(), v.string()),
  },
  handler: async (ctx, args) => {
    const idMap: IdMap = {};

    for (const review of args.reviews) {
      const userId = args.userIdMap[review.user_id] as Id<"users"> | undefined;
      const venueId = args.venueIdMap[review.venue_id] as Id<"venues"> | undefined;

      if (!userId || !venueId) {
        console.log(`Skipping review ${review.id} - missing user or venue mapping`);
        continue;
      }

      // Check if review already exists
      const existing = await ctx.db
        .query("reviews")
        .withIndex("by_venue_and_user", (q) =>
          q.eq("venueId", venueId).eq("userId", userId)
        )
        .first();

      if (existing) {
        idMap[review.id] = existing._id;
        console.log(`Review already exists, skipping`);
        continue;
      }

      const id = await ctx.db.insert("reviews", {
        venueId,
        userId,
        rating: review.rating,
        content: review.content ?? "",
        visitedAt: review.visited_at ? review.visited_at * 1000 : undefined,
        createdAt: review.created_at * 1000,
        updatedAt: Date.now(),
      });

      idMap[review.id] = id;
      console.log(`Imported review for venue`);
    }

    return idMap;
  },
});

/**
 * Migration: Import photos from D1 export
 */
export const importPhotos = internalMutation({
  args: {
    photos: v.array(v.object({
      id: v.string(),
      venue_id: v.string(),
      review_id: v.optional(v.union(v.string(), v.null())),
      user_id: v.string(),
      storage_key: v.string(),
      original_filename: v.optional(v.union(v.string(), v.null())),
      caption: v.optional(v.union(v.string(), v.null())),
      created_at: v.number(),
      width: v.optional(v.union(v.number(), v.null())),
      height: v.optional(v.union(v.number(), v.null())),
      size_bytes: v.optional(v.union(v.number(), v.null())),
    })),
    userIdMap: v.record(v.string(), v.string()),
    venueIdMap: v.record(v.string(), v.string()),
    reviewIdMap: v.record(v.string(), v.string()),
  },
  handler: async (ctx, args) => {
    const idMap: IdMap = {};

    for (const photo of args.photos) {
      const userId = args.userIdMap[photo.user_id] as Id<"users"> | undefined;
      const venueId = args.venueIdMap[photo.venue_id] as Id<"venues"> | undefined;
      const reviewId = photo.review_id && args.reviewIdMap[photo.review_id]
        ? (args.reviewIdMap[photo.review_id] as Id<"reviews">)
        : undefined;

      if (!userId || !venueId) {
        console.log(`Skipping photo ${photo.id} - missing user or venue mapping`);
        continue;
      }

      // Check if photo already exists by storage_key
      const existing = await ctx.db
        .query("photos")
        .filter((q) => q.eq(q.field("storageKey"), photo.storage_key))
        .first();

      if (existing) {
        idMap[photo.id] = existing._id;
        console.log(`Photo already exists, skipping`);
        continue;
      }

      const id = await ctx.db.insert("photos", {
        venueId,
        reviewId,
        userId,
        storageKey: photo.storage_key,
        originalFilename: photo.original_filename ?? undefined,
        caption: photo.caption ?? undefined,
        createdAt: photo.created_at * 1000,
      });

      idMap[photo.id] = id;
    }

    console.log(`Imported ${Object.keys(idMap).length} photos`);
    return idMap;
  },
});

/**
 * Migration: Import favorites from D1 export
 */
export const importFavorites = internalMutation({
  args: {
    favorites: v.array(v.object({
      id: v.string(),
      user_id: v.string(),
      venue_id: v.string(),
      created_at: v.number(),
    })),
    userIdMap: v.record(v.string(), v.string()),
    venueIdMap: v.record(v.string(), v.string()),
  },
  handler: async (ctx, args) => {
    let imported = 0;

    for (const fav of args.favorites) {
      const userId = args.userIdMap[fav.user_id] as Id<"users"> | undefined;
      const venueId = args.venueIdMap[fav.venue_id] as Id<"venues"> | undefined;

      if (!userId || !venueId) {
        console.log(`Skipping favorite - missing user or venue mapping`);
        continue;
      }

      // Check if favorite already exists
      const existing = await ctx.db
        .query("favorites")
        .withIndex("by_user_and_venue", (q) =>
          q.eq("userId", userId).eq("venueId", venueId)
        )
        .first();

      if (existing) {
        console.log(`Favorite already exists, skipping`);
        continue;
      }

      await ctx.db.insert("favorites", {
        userId,
        venueId,
        createdAt: fav.created_at * 1000,
      });

      imported++;
    }

    console.log(`Imported ${imported} favorites`);
  },
});

/**
 * Migration: Update venue main photos after all photos are imported
 */
export const updateVenueMainPhotos = internalMutation({
  args: {
    venuePhotoMap: v.record(v.string(), v.string()), // old venue ID -> old photo ID
    venueIdMap: v.record(v.string(), v.string()),
    photoIdMap: v.record(v.string(), v.string()),
  },
  handler: async (ctx, args) => {
    for (const [oldVenueId, oldPhotoId] of Object.entries(args.venuePhotoMap)) {
      const venueId = args.venueIdMap[oldVenueId] as Id<"venues"> | undefined;
      const photoId = args.photoIdMap[oldPhotoId] as Id<"photos"> | undefined;

      if (venueId && photoId) {
        await ctx.db.patch(venueId, { mainPhotoId: photoId });
        console.log(`Set main photo for venue`);
      }
    }
  },
});

/**
 * Migration: Delete Convex-uploaded photos and reset venue main photos
 */
export const deleteConvexPhotos = internalMutation({
  args: {},
  handler: async (ctx) => {
    const photos = await ctx.db.query("photos").collect();
    const convexPhotos = photos.filter(p => p.storageKey.startsWith("convex/"));

    for (const photo of convexPhotos) {
      // Delete from Convex storage
      if (photo.storageId) {
        await ctx.storage.delete(photo.storageId);
      }
      // Delete the photo record
      await ctx.db.delete(photo._id);
      console.log(`Deleted photo ${photo._id}`);

      // If this was a venue's main photo, reset it
      const venue = await ctx.db.get(photo.venueId);
      if (venue && venue.mainPhotoId === photo._id) {
        // Find another photo for this venue
        const nextPhoto = await ctx.db
          .query("photos")
          .withIndex("by_venue", (q) => q.eq("venueId", photo.venueId))
          .first();

        await ctx.db.patch(photo.venueId, {
          mainPhotoId: nextPhoto?._id,
          updatedAt: Date.now()
        });
        console.log(`Reset main photo for venue ${photo.venueId}`);
      }
    }

    return convexPhotos.length;
  },
});

/**
 * Migration: Fix user role from D1 export data
 */
export const fixUserRole = internalMutation({
  args: {
    email: v.string(),
    role: v.union(v.literal("viewer"), v.literal("user"), v.literal("editor"), v.literal("admin")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (user) {
      await ctx.db.patch(user._id, { role: args.role, updatedAt: Date.now() });
      console.log(`Updated ${args.email} role to ${args.role}`);
      return true;
    }
    console.log(`User ${args.email} not found`);
    return false;
  },
});

/**
 * Migration: Set first photo as main photo for venues without one
 */
export const setDefaultMainPhotos = internalMutation({
  args: {},
  handler: async (ctx) => {
    const venues = await ctx.db.query("venues").collect();
    const allPhotos = await ctx.db.query("photos").collect();
    let updated = 0;

    // Group photos by venue
    const photosByVenue = new Map<string, typeof allPhotos>();
    for (const photo of allPhotos) {
      const venueId = photo.venueId as string;
      if (!photosByVenue.has(venueId)) {
        photosByVenue.set(venueId, []);
      }
      photosByVenue.get(venueId)!.push(photo);
    }

    for (const venue of venues) {
      if (!venue.mainPhotoId) {
        const venuePhotos = photosByVenue.get(venue._id as string);
        if (venuePhotos && venuePhotos.length > 0) {
          await ctx.db.patch(venue._id, { mainPhotoId: venuePhotos[0]._id });
          updated++;
        }
      }
    }

    return {
      totalVenues: venues.length,
      totalPhotos: allPhotos.length,
      venuesWithPhotos: photosByVenue.size,
      updated
    };
  },
});

/**
 * Migration: Backfill all venue stats (avgRating, reviewCount, photoCount, mainPhotoStorageKey)
 */
export const backfillVenueStats = internalMutation({
  args: {},
  handler: async (ctx) => {
    const venues = await ctx.db.query("venues").collect();
    const allReviews = await ctx.db.query("reviews").collect();
    const allPhotos = await ctx.db.query("photos").collect();

    // Group reviews by venue
    const reviewsByVenue = new Map<string, typeof allReviews>();
    for (const review of allReviews) {
      const venueId = review.venueId as string;
      if (!reviewsByVenue.has(venueId)) {
        reviewsByVenue.set(venueId, []);
      }
      reviewsByVenue.get(venueId)!.push(review);
    }

    // Group photos by venue
    const photosByVenue = new Map<string, typeof allPhotos>();
    for (const photo of allPhotos) {
      const venueId = photo.venueId as string;
      if (!photosByVenue.has(venueId)) {
        photosByVenue.set(venueId, []);
      }
      photosByVenue.get(venueId)!.push(photo);
    }

    // Create photo lookup by ID
    const photosById = new Map<string, typeof allPhotos[0]>();
    for (const photo of allPhotos) {
      photosById.set(photo._id as string, photo);
    }

    let updated = 0;
    for (const venue of venues) {
      const venueReviews = reviewsByVenue.get(venue._id as string) ?? [];
      const venuePhotos = photosByVenue.get(venue._id as string) ?? [];

      const reviewCount = venueReviews.length;
      const avgRating = reviewCount > 0
        ? venueReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
        : undefined;
      const photoCount = venuePhotos.length;

      // Get main photo storage key
      let mainPhotoStorageKey: string | undefined;
      if (venue.mainPhotoId) {
        const mainPhoto = photosById.get(venue.mainPhotoId as string);
        mainPhotoStorageKey = mainPhoto?.storageKey;
      }

      await ctx.db.patch(venue._id, {
        avgRating,
        reviewCount,
        photoCount,
        mainPhotoStorageKey,
      });
      updated++;
    }

    return {
      totalVenues: venues.length,
      updated,
      totalReviews: allReviews.length,
      totalPhotos: allPhotos.length,
    };
  },
});

/**
 * Migration: Backfill denormalized fields on reviews, photos, favorites, and activity
 * This populates author/uploader info, venue info, etc. to eliminate join queries
 */
export const backfillDenormalizedFields = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Load all data first for efficient lookups
    const allUsers = await ctx.db.query("users").collect();
    const allVenues = await ctx.db.query("venues").collect();
    const allReviews = await ctx.db.query("reviews").collect();
    const allPhotos = await ctx.db.query("photos").collect();
    const allFavorites = await ctx.db.query("favorites").collect();
    const allActivity = await ctx.db.query("activity").collect();

    // Create lookup maps
    const usersById = new Map(allUsers.map(u => [u._id as string, u]));
    const venuesById = new Map(allVenues.map(v => [v._id as string, v]));

    const stats = {
      reviews: 0,
      photos: 0,
      favorites: 0,
      activity: 0,
    };

    // Backfill reviews with author and venue info
    for (const review of allReviews) {
      const user = usersById.get(review.userId as string);
      const venue = venuesById.get(review.venueId as string);
      const needsAuthor = user && !review.authorName;
      const needsVenue = venue && !review.venueName;

      if (needsAuthor || needsVenue) {
        await ctx.db.patch(review._id, {
          ...(needsAuthor && {
            authorName: user.name,
            authorEmail: user.email,
            authorAvatarUrl: user.avatarUrl,
          }),
          ...(needsVenue && {
            venueName: venue.name,
            venueType: venue.type,
          }),
        });
        stats.reviews++;
      }
    }

    // Backfill photos with uploader info
    for (const photo of allPhotos) {
      const user = usersById.get(photo.userId as string);
      if (user && !photo.uploaderName) {
        await ctx.db.patch(photo._id, {
          uploaderName: user.name,
          uploaderEmail: user.email,
        });
        stats.photos++;
      }
    }

    // Backfill favorites with venue info
    for (const favorite of allFavorites) {
      const venue = venuesById.get(favorite.venueId as string);
      if (venue && !favorite.venueName) {
        await ctx.db.patch(favorite._id, {
          venueName: venue.name,
          venueType: venue.type,
          venueAddress: venue.address,
        });
        stats.favorites++;
      }
    }

    // Backfill activity with user and venue info
    for (const activity of allActivity) {
      const user = usersById.get(activity.userId as string);
      const venue = venuesById.get(activity.venueId as string);

      if ((user || venue) && !activity.userName && !activity.venueName) {
        await ctx.db.patch(activity._id, {
          userName: user?.name,
          userAvatarUrl: user?.avatarUrl,
          venueName: venue?.name,
          venueType: venue?.type,
        });
        stats.activity++;
      }
    }

    console.log(`Backfilled denormalized fields:`, stats);
    return {
      totalRecords: {
        reviews: allReviews.length,
        photos: allPhotos.length,
        favorites: allFavorites.length,
        activity: allActivity.length,
      },
      updated: stats,
    };
  },
});
