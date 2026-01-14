import { createMiddleware } from "hono/factory";
import { getSignedCookie } from "hono/cookie";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { users } from "../db/schema";
import type { Env } from "../index";
import type { UserRole } from "../../shared/types";

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
};

type AuthVariables = {
  user: AuthUser;
};

/**
 * Middleware that requires authentication.
 * Extracts user from signed cookie and sets it in context.
 * Returns 401 if not authenticated.
 */
export const requireAuth = createMiddleware<{
  Bindings: Env;
  Variables: AuthVariables;
}>(async (c, next) => {
  const userId = await getSignedCookie(c, c.env.COOKIE_SECRET, "user_id");

  if (!userId) {
    return c.json({ error: "Authentication required" }, 401);
  }

  const db = drizzle(c.env.DB);
  const user = await db
    .select({ id: users.id, email: users.email, role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .get();

  if (!user) {
    return c.json({ error: "User not found" }, 401);
  }

  c.set("user", user as AuthUser);
  await next();
});

/**
 * Check if a user can edit a specific venue.
 * - Editors and admins can edit any venue
 * - Regular users can only edit venues they created
 * - Viewers cannot edit anything
 */
export function canEditVenue(
  user: AuthUser,
  venueCreatorId: string | null
): boolean {
  // Viewers cannot edit
  if (user.role === "viewer") {
    return false;
  }
  // Editors and admins can edit any venue
  if (user.role === "editor" || user.role === "admin") {
    return true;
  }
  // Users can only edit venues they created
  return venueCreatorId === user.id;
}

/**
 * Check if a user can create content (venues, reviews).
 * Viewers cannot create content.
 */
export function canCreateContent(user: AuthUser): boolean {
  return user.role !== "viewer";
}

/**
 * Check if a user can promote other users.
 * Only editors and admins can promote users.
 */
export function canPromoteUsers(user: AuthUser): boolean {
  return user.role === "editor" || user.role === "admin";
}

/**
 * Check if a user is an admin.
 */
export function isAdmin(user: AuthUser): boolean {
  return user.role === "admin";
}

/**
 * Role hierarchy for permission checks.
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  viewer: 0,
  user: 1,
  editor: 2,
  admin: 3,
};

/**
 * Check if promoter can set target role.
 * - Editors can promote to user or editor
 * - Admins can promote to any role
 */
export function canSetRole(
  promoter: AuthUser,
  targetRole: UserRole
): boolean {
  if (promoter.role === "admin") {
    return true;
  }
  if (promoter.role === "editor") {
    // Editors can promote up to editor level
    return ROLE_HIERARCHY[targetRole] <= ROLE_HIERARCHY["editor"];
  }
  return false;
}
