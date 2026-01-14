import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { eq, and } from "drizzle-orm";
import { favorites, venues, users } from "../db/schema";
import { requireAuth, type AuthUser } from "../middleware/auth";
import type { Env } from "../index";

export const favoritesRoute = new Hono<{
  Bindings: Env;
  Variables: { user: AuthUser };
}>();

// GET user's favorites
favoritesRoute.get("/", requireAuth, async (c) => {
  const db = drizzle(c.env.DB);
  const user = c.get("user");

  const results = await db
    .select({
      id: favorites.id,
      visibilityId: favorites.venueId,
      createdAt: favorites.createdAt,
      venue: {
        id: venues.id,
        name: venues.name,
        type: venues.type,
        address: venues.address,
      },
    })
    .from(favorites)
    .innerJoin(venues, eq(favorites.venueId, venues.id))
    .where(eq(favorites.userId, user.id))
    .orderBy(favorites.createdAt);

  return c.json(
    results.map((r) => ({
      id: r.id,
      venueId: r.venue.id,
      createdAt: r.createdAt instanceof Date ? r.createdAt.getTime() : r.createdAt,
      venue: r.venue,
    }))
  );
});

// GET check if venue is favorited
favoritesRoute.get("/check/:venueId", requireAuth, async (c) => {
  const db = drizzle(c.env.DB);
  const user = c.get("user");
  const venueId = c.req.param("venueId");

  const favorite = await db
    .select({ id: favorites.id })
    .from(favorites)
    .where(and(eq(favorites.userId, user.id), eq(favorites.venueId, venueId)))
    .get();

  return c.json({ isFavorited: !!favorite });
});

// POST add favorite
favoritesRoute.post("/:venueId", requireAuth, async (c) => {
  const db = drizzle(c.env.DB);
  const user = c.get("user");
  const venueId = c.req.param("venueId");

  // Check if venue exists
  const venue = await db
    .select({ id: venues.id })
    .from(venues)
    .where(eq(venues.id, venueId))
    .get();

  if (!venue) {
    return c.json({ error: "Venue not found" }, 404);
  }

  // Check if already favorited
  const existing = await db
    .select({ id: favorites.id })
    .from(favorites)
    .where(and(eq(favorites.userId, user.id), eq(favorites.venueId, venueId)))
    .get();

  if (existing) {
    return c.json({ error: "Already favorited" }, 400);
  }

  const id = crypto.randomUUID();
  await db.insert(favorites).values({
    id,
    userId: user.id,
    venueId,
  });

  return c.json({ id }, 201);
});

// DELETE remove favorite
favoritesRoute.delete("/:venueId", requireAuth, async (c) => {
  const db = drizzle(c.env.DB);
  const user = c.get("user");
  const venueId = c.req.param("venueId");

  await db
    .delete(favorites)
    .where(and(eq(favorites.userId, user.id), eq(favorites.venueId, venueId)));

  return c.json({ success: true });
});
