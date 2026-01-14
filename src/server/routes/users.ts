import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { users, venues, reviews, photos } from "../db/schema";
import {
  requireAuth,
  canPromoteUsers,
  canSetRole,
  isAdmin,
  type AuthUser,
} from "../middleware/auth";
import { CacheService } from "../cache";
import type { Env } from "../index";
import type { UserRole } from "../../shared/types";

export const usersRoute = new Hono<{
  Bindings: Env;
  Variables: { user: AuthUser };
}>();

// GET all users (editors and admins only)
usersRoute.get("/", requireAuth, async (c) => {
  const user = c.get("user");

  if (!canPromoteUsers(user)) {
    return c.json({ error: "You do not have permission to view users" }, 403);
  }

  const db = drizzle(c.env.DB);
  const allUsers = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      avatarUrl: users.avatarUrl,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users);

  return c.json(allUsers);
});

// PUT update user role (editors and admins only)
usersRoute.put("/:id/role", requireAuth, async (c) => {
  const promoter = c.get("user");
  const targetUserId = c.req.param("id");

  if (!canPromoteUsers(promoter)) {
    return c.json(
      { error: "You do not have permission to change user roles" },
      403
    );
  }

  const body = await c.req.json<{ role: UserRole }>();

  // Validate role
  if (!["viewer", "user", "editor", "admin"].includes(body.role)) {
    return c.json({ error: "Invalid role" }, 400);
  }

  // Check if promoter can set this role
  if (!canSetRole(promoter, body.role)) {
    return c.json(
      { error: "You cannot promote users to this role level" },
      403
    );
  }

  // Prevent self-demotion for safety
  if (targetUserId === promoter.id && body.role !== promoter.role) {
    return c.json({ error: "You cannot change your own role" }, 400);
  }

  const db = drizzle(c.env.DB);

  // Check target user exists
  const targetUser = await db
    .select()
    .from(users)
    .where(eq(users.id, targetUserId))
    .get();

  if (!targetUser) {
    return c.json({ error: "User not found" }, 404);
  }

  // Update role
  await db
    .update(users)
    .set({ role: body.role })
    .where(eq(users.id, targetUserId));

  // Invalidate caches related to this user's role
  const cache = new CacheService(c.env.CACHE);
  await cache.invalidate("userRole", targetUserId);

  return c.json({ success: true, role: body.role });
});

// DELETE user (admin only, cascade deletes all user content)
usersRoute.delete("/:id", requireAuth, async (c) => {
  const admin = c.get("user");
  const targetUserId = c.req.param("id");

  // Only admins can delete users
  if (!isAdmin(admin)) {
    return c.json({ error: "Only admins can delete users" }, 403);
  }

  // Prevent self-deletion
  if (targetUserId === admin.id) {
    return c.json({ error: "You cannot delete your own account" }, 400);
  }

  const db = drizzle(c.env.DB);

  // Check target user exists
  const targetUser = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.id, targetUserId))
    .get();

  if (!targetUser) {
    return c.json({ error: "User not found" }, 404);
  }

  // Get all photos uploaded by this user to delete from R2
  const userPhotos = await db
    .select({ storageKey: photos.storageKey })
    .from(photos)
    .where(eq(photos.userId, targetUserId));

  // Delete photos from R2
  await Promise.all(
    userPhotos.map((p) => c.env.PHOTOS.delete(p.storageKey))
  );

  // Get venues created by this user (to cascade delete their photos/reviews)
  const userVenues = await db
    .select({ id: venues.id })
    .from(venues)
    .where(eq(venues.creatorId, targetUserId));

  // Delete photos and reviews for each venue, then the venues
  for (const venue of userVenues) {
    const venuePhotos = await db
      .select({ storageKey: photos.storageKey })
      .from(photos)
      .where(eq(photos.venueId, venue.id));

    await Promise.all(
      venuePhotos.map((p) => c.env.PHOTOS.delete(p.storageKey))
    );

    await db.delete(photos).where(eq(photos.venueId, venue.id));
    await db.delete(reviews).where(eq(reviews.venueId, venue.id));
  }

  // Delete all user's direct content
  await db.delete(photos).where(eq(photos.userId, targetUserId));
  await db.delete(reviews).where(eq(reviews.userId, targetUserId));
  await db.delete(venues).where(eq(venues.creatorId, targetUserId));

  // Finally delete the user
  await db.delete(users).where(eq(users.id, targetUserId));

  // Invalidate caches
  const cache = new CacheService(c.env.CACHE);
  await cache.invalidate("user", targetUserId);

  return c.json({ success: true });
});
