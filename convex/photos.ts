import { query, mutation, action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { hasMinRole } from "./users";
import { internal } from "./_generated/api";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Return type for photo
const photoValidator = v.object({
  _id: v.id("photos"),
  _creationTime: v.number(),
  venueId: v.id("venues"),
  reviewId: v.optional(v.id("reviews")),
  userId: v.id("users"),
  storageId: v.optional(v.id("_storage")),
  storageKey: v.string(),
  originalFilename: v.optional(v.string()),
  caption: v.optional(v.string()),
  createdAt: v.number(),
});

// Photo with computed fields
const photoWithDetailsValidator = v.object({
  _id: v.id("photos"),
  _creationTime: v.number(),
  venueId: v.id("venues"),
  reviewId: v.optional(v.id("reviews")),
  userId: v.id("users"),
  storageId: v.optional(v.id("_storage")),
  storageKey: v.string(),
  originalFilename: v.optional(v.string()),
  caption: v.optional(v.string()),
  createdAt: v.number(),
  url: v.union(v.string(), v.null()),
  uploader: v.object({
    _id: v.id("users"),
    name: v.optional(v.string()),
    email: v.string(),
  }),
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
 * List photos for a venue
 */
export const listByVenue = query({
  args: { venueId: v.id("venues") },
  returns: v.array(photoWithDetailsValidator),
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const photos = await ctx.db
      .query("photos")
      .withIndex("by_venue", (q) => q.eq("venueId", args.venueId))
      .order("desc")
      .collect();

    const result: Array<typeof photoWithDetailsValidator.type> = [];

    for (const photo of photos) {
      const uploader = await ctx.db.get(photo.userId);
      if (!uploader) continue;

      // Get URL - either from Convex storage or construct ImageKit URL for R2
      let url: string | null = null;
      if (photo.storageId) {
        // New photo in Convex storage
        url = await ctx.storage.getUrl(photo.storageId);
      } else if (photo.storageKey) {
        // Legacy photo in R2 - use ImageKit URL
        // ImageKit URL will be constructed on the client side
        url = photo.storageKey;
      }

      const isOwner = currentUser?._id === photo.userId;
      const isEditor = currentUser && hasMinRole(currentUser.role, "editor");

      result.push({
        ...photo,
        url,
        uploader: {
          _id: uploader._id,
          name: uploader.name,
          email: uploader.email,
        },
        canDelete: isOwner || isEditor || false,
      });
    }

    return result;
  },
});

/**
 * Get a single photo
 */
export const get = query({
  args: { id: v.id("photos") },
  returns: v.union(photoWithDetailsValidator, v.null()),
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const photo = await ctx.db.get(args.id);
    if (!photo) {
      return null;
    }

    const uploader = await ctx.db.get(photo.userId);
    if (!uploader) {
      return null;
    }

    let url: string | null = null;
    if (photo.storageId) {
      url = await ctx.storage.getUrl(photo.storageId);
    } else if (photo.storageKey) {
      url = photo.storageKey;
    }

    const isOwner = currentUser?._id === photo.userId;
    const isEditor = currentUser && hasMinRole(currentUser.role, "editor");

    return {
      ...photo,
      url,
      uploader: {
        _id: uploader._id,
        name: uploader.name,
        email: uploader.email,
      },
      canDelete: isOwner || isEditor || false,
    };
  },
});

/**
 * Upload photo to R2 and save to database
 * This action:
 * 1. Gets the file from Convex temp storage
 * 2. Uploads to R2
 * 3. Deletes from Convex storage
 * 4. Saves photo record with R2 storage key
 */
export const uploadPhotoToR2 = action({
  args: {
    venueId: v.id("venues"),
    reviewId: v.optional(v.id("reviews")),
    storageId: v.id("_storage"),
    originalFilename: v.optional(v.string()),
    caption: v.optional(v.string()),
  },
  returns: v.id("photos"),
  handler: async (ctx, args): Promise<Id<"photos">> => {
    // Get R2 credentials from environment
    const r2AccountId = process.env.R2_ACCOUNT_ID;
    const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID;
    const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const r2BucketName = process.env.R2_BUCKET_NAME || "reviews-photos";

    if (!r2AccountId || !r2AccessKeyId || !r2SecretAccessKey) {
      throw new Error("R2 credentials not configured");
    }

    // Get the file from Convex storage
    const fileUrl = await ctx.storage.getUrl(args.storageId);
    if (!fileUrl) {
      throw new Error("File not found in storage");
    }

    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error("Failed to fetch file from storage");
    }

    const fileBuffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/jpeg";

    // Determine file extension
    let ext = "jpg";
    if (contentType.includes("png")) ext = "png";
    else if (contentType.includes("webp")) ext = "webp";
    else if (contentType.includes("gif")) ext = "gif";

    // Generate R2 storage key
    const photoId = crypto.randomUUID();
    const storageKey = args.reviewId
      ? `photos/${args.venueId}/reviews/${photoId}.${ext}`
      : `photos/${args.venueId}/${photoId}.${ext}`;

    // Upload to R2
    const s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: r2AccessKeyId,
        secretAccessKey: r2SecretAccessKey,
      },
    });

    await s3Client.send(
      new PutObjectCommand({
        Bucket: r2BucketName,
        Key: storageKey,
        Body: new Uint8Array(fileBuffer),
        ContentType: contentType,
      })
    );

    // Delete from Convex storage
    await ctx.storage.delete(args.storageId);

    // Save photo record via internal mutation
    const photoRecordId = await ctx.runMutation(internal.photos.savePhotoRecord, {
      venueId: args.venueId,
      reviewId: args.reviewId,
      storageKey,
      originalFilename: args.originalFilename,
      caption: args.caption,
    });

    return photoRecordId;
  },
});

/**
 * Internal mutation to save photo record (called by uploadPhotoToR2 action)
 */
export const savePhotoRecord = internalMutation({
  args: {
    venueId: v.id("venues"),
    reviewId: v.optional(v.id("reviews")),
    storageKey: v.string(),
    originalFilename: v.optional(v.string()),
    caption: v.optional(v.string()),
  },
  returns: v.id("photos"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosUserId", identity.subject))
      .unique();

    if (!currentUser) {
      throw new Error("User not found");
    }

    const venue = await ctx.db.get(args.venueId);
    if (!venue) {
      throw new Error("Venue not found");
    }

    const now = Date.now();
    const id = await ctx.db.insert("photos", {
      venueId: args.venueId,
      reviewId: args.reviewId,
      userId: currentUser._id,
      storageKey: args.storageKey,
      originalFilename: args.originalFilename,
      caption: args.caption,
      createdAt: now,
    });

    // Create activity entry
    await ctx.db.insert("activity", {
      userId: currentUser._id,
      venueId: args.venueId,
      actionType: "photo_added",
      metadata: { photoId: id, reviewId: args.reviewId },
      createdAt: now,
    });

    // If venue has no main photo and this is a venue photo, set as main
    if (!venue.mainPhotoId && !args.reviewId) {
      await ctx.db.patch(args.venueId, {
        mainPhotoId: id,
        updatedAt: now,
      });
    }

    return id;
  },
});

/**
 * Generate an upload URL for a new photo
 */
export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser) {
      throw new Error("Not authenticated");
    }

    if (!hasMinRole(currentUser.role, "user")) {
      throw new Error("You need to be upgraded to 'user' role to upload photos");
    }

    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Save a photo after upload completes
 */
export const savePhoto = mutation({
  args: {
    venueId: v.id("venues"),
    reviewId: v.optional(v.id("reviews")),
    storageId: v.id("_storage"),
    originalFilename: v.optional(v.string()),
    caption: v.optional(v.string()),
  },
  returns: v.id("photos"),
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser) {
      throw new Error("Not authenticated");
    }

    if (!hasMinRole(currentUser.role, "user")) {
      throw new Error("You need to be upgraded to 'user' role to upload photos");
    }

    // Verify venue exists
    const venue = await ctx.db.get(args.venueId);
    if (!venue) {
      throw new Error("Venue not found");
    }

    // If reviewId provided, verify it exists and belongs to the venue
    if (args.reviewId) {
      const review = await ctx.db.get(args.reviewId);
      if (!review) {
        throw new Error("Review not found");
      }
      if (review.venueId !== args.venueId) {
        throw new Error("Review does not belong to this venue");
      }
    }

    // Generate a storage key for this photo
    const photoId = crypto.randomUUID();
    const storageKey = `convex/${args.venueId}/${photoId}`;

    const now = Date.now();
    const id = await ctx.db.insert("photos", {
      venueId: args.venueId,
      reviewId: args.reviewId,
      userId: currentUser._id,
      storageId: args.storageId,
      storageKey,
      originalFilename: args.originalFilename,
      caption: args.caption,
      createdAt: now,
    });

    // Create activity entry
    await ctx.db.insert("activity", {
      userId: currentUser._id,
      venueId: args.venueId,
      actionType: "photo_added",
      metadata: { photoId: id, reviewId: args.reviewId },
      createdAt: now,
    });

    // If venue has no main photo and this is a venue photo (not review), set as main
    if (!venue.mainPhotoId && !args.reviewId) {
      await ctx.db.patch(args.venueId, {
        mainPhotoId: id,
        updatedAt: now,
      });
    }

    return id;
  },
});

/**
 * List photos for a review
 */
export const listByReview = query({
  args: { reviewId: v.id("reviews") },
  returns: v.array(photoWithDetailsValidator),
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const photos = await ctx.db
      .query("photos")
      .withIndex("by_review", (q) => q.eq("reviewId", args.reviewId))
      .order("desc")
      .collect();

    const result: Array<typeof photoWithDetailsValidator.type> = [];

    for (const photo of photos) {
      const uploader = await ctx.db.get(photo.userId);
      if (!uploader) continue;

      let url: string | null = null;
      if (photo.storageId) {
        url = await ctx.storage.getUrl(photo.storageId);
      } else if (photo.storageKey) {
        url = photo.storageKey;
      }

      const isOwner = currentUser?._id === photo.userId;
      const isEditor = currentUser && hasMinRole(currentUser.role, "editor");

      result.push({
        ...photo,
        url,
        uploader: {
          _id: uploader._id,
          name: uploader.name,
          email: uploader.email,
        },
        canDelete: isOwner || isEditor || false,
      });
    }

    return result;
  },
});

/**
 * Update photo caption
 */
export const updateCaption = mutation({
  args: {
    id: v.id("photos"),
    caption: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser) {
      throw new Error("Not authenticated");
    }

    const photo = await ctx.db.get(args.id);
    if (!photo) {
      throw new Error("Photo not found");
    }

    // Only owner can update caption
    if (photo.userId !== currentUser._id) {
      throw new Error("Not authorized to update this photo");
    }

    await ctx.db.patch(args.id, { caption: args.caption });
    return null;
  },
});

/**
 * Delete a photo (owner or editor/admin)
 */
export const remove = mutation({
  args: { id: v.id("photos") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser) {
      throw new Error("Not authenticated");
    }

    const photo = await ctx.db.get(args.id);
    if (!photo) {
      throw new Error("Photo not found");
    }

    // Owner or editor/admin can delete
    const canDelete = photo.userId === currentUser._id || hasMinRole(currentUser.role, "editor");
    if (!canDelete) {
      throw new Error("Not authorized to delete this photo");
    }

    // Delete from Convex storage if it exists there
    if (photo.storageId) {
      await ctx.storage.delete(photo.storageId);
    }

    // If this was the main photo, clear the venue's mainPhotoId
    const venue = await ctx.db.get(photo.venueId);
    if (venue && venue.mainPhotoId === args.id) {
      // Find another photo to set as main, or clear it
      const otherPhotos = await ctx.db
        .query("photos")
        .withIndex("by_venue", (q) => q.eq("venueId", photo.venueId))
        .collect();

      const newMainPhoto = otherPhotos.find(p => p._id !== args.id);
      await ctx.db.patch(photo.venueId, {
        mainPhotoId: newMainPhoto?._id,
        updatedAt: Date.now(),
      });
    }

    // Delete the photo record
    await ctx.db.delete(args.id);
    return null;
  },
});
