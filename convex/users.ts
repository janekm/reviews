import { query, mutation, internalMutation, action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";

// Validator for user role
const roleValidator = v.union(
  v.literal("viewer"),
  v.literal("user"),
  v.literal("editor"),
  v.literal("admin")
);

// Public return type for user
const publicUserValidator = v.object({
  _id: v.id("users"),
  _creationTime: v.number(),
  workosUserId: v.string(),
  email: v.string(),
  name: v.optional(v.string()),
  avatarUrl: v.optional(v.string()),
  role: roleValidator,
  createdAt: v.number(),
  updatedAt: v.number(),
});

/**
 * Get the current authenticated user
 */
export const getCurrentUser = query({
  args: {},
  returns: v.union(publicUserValidator, v.null()),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Find user by WorkOS subject (user ID)
    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosUserId", identity.subject))
      .unique();

    return user;
  },
});

/**
 * Get or create the current user on first sign-in
 * Fetches user data from WorkOS API server-side for security
 */
export const getOrCreateCurrentUser = action({
  args: {},
  returns: v.union(publicUserValidator, v.null()),
  handler: async (ctx): Promise<Doc<"users"> | null> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Fetch user data from WorkOS API
    const apiKey = process.env.WORKOS_API_KEY;
    if (!apiKey) {
      throw new Error("WORKOS_API_KEY not configured");
    }

    const workosUserId = identity.subject;
    const response = await fetch(`https://api.workos.com/user_management/users/${workosUserId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch user from WorkOS:", response.status, await response.text());
      throw new Error("Failed to fetch user data from WorkOS");
    }

    const workosUser = await response.json();

    // Use internal mutation to create/update user in database
    const user = await ctx.runMutation(internal.users.upsertFromWorkOS, {
      workosUserId: workosUser.id,
      email: workosUser.email,
      name: workosUser.first_name
        ? `${workosUser.first_name}${workosUser.last_name ? ` ${workosUser.last_name}` : ""}`
        : undefined,
      avatarUrl: workosUser.profile_picture_url ?? undefined,
    });

    return user;
  },
});

/**
 * Internal mutation to upsert user from WorkOS data
 */
export const upsertFromWorkOS = internalMutation({
  args: {
    workosUserId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  returns: publicUserValidator,
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosUserId", args.workosUserId))
      .unique();

    const now = Date.now();

    if (existingUser) {
      // Update with latest data from WorkOS
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        name: args.name,
        avatarUrl: args.avatarUrl,
        updatedAt: now,
      });
      return (await ctx.db.get(existingUser._id))!;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      workosUserId: args.workosUserId,
      email: args.email,
      name: args.name,
      avatarUrl: args.avatarUrl,
      role: "viewer",
      createdAt: now,
      updatedAt: now,
    });

    return (await ctx.db.get(userId))!;
  },
});

/**
 * Get a user by ID
 */
export const get = query({
  args: { id: v.id("users") },
  returns: v.union(publicUserValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * List all users (admin only)
 */
export const list = query({
  args: {},
  returns: v.array(publicUserValidator),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // Check if current user is admin
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosUserId", identity.subject))
      .unique();

    if (!currentUser || currentUser.role !== "admin") {
      return [];
    }

    return await ctx.db.query("users").collect();
  },
});

/**
 * Create or update user on sign in (called from auth flow)
 * This upserts the user based on their WorkOS ID
 */
export const upsertFromAuth = internalMutation({
  args: {
    workosUserId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosUserId", args.workosUserId))
      .unique();

    const now = Date.now();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        name: args.name,
        avatarUrl: args.avatarUrl,
        updatedAt: now,
      });
      return existingUser._id;
    }

    // Create new user with default "viewer" role
    return await ctx.db.insert("users", {
      workosUserId: args.workosUserId,
      email: args.email,
      name: args.name,
      avatarUrl: args.avatarUrl,
      role: "viewer",
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update user role (admin only)
 */
export const updateRole = mutation({
  args: {
    userId: v.id("users"),
    role: roleValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if current user is admin
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosUserId", identity.subject))
      .unique();

    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Only admins can update user roles");
    }

    // Prevent admin from demoting themselves
    if (currentUser._id === args.userId && args.role !== "admin") {
      throw new Error("Cannot demote yourself from admin");
    }

    await ctx.db.patch(args.userId, {
      role: args.role,
      updatedAt: Date.now(),
    });

    return null;
  },
});

// Helper type for checking roles
export type UserRole = "viewer" | "user" | "editor" | "admin";

// Role hierarchy for permission checks
export const roleHierarchy: Record<UserRole, number> = {
  viewer: 0,
  user: 1,
  editor: 2,
  admin: 3,
};

/**
 * Check if a role has at least the specified minimum role level
 */
export function hasMinRole(userRole: UserRole, minRole: UserRole): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[minRole];
}
