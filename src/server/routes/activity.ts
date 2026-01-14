import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { desc, eq } from "drizzle-orm";
import { reviews, users, venues } from "../db/schema";
import type { Env } from "../index";

export const activityRoute = new Hono<{ Bindings: Env }>();

interface ActivityItem {
  id: string;
  type: "review";
  createdAt: number;
  review: {
    id: string;
    rating: number;
    title: string | null;
    content: string | null;
  };
  user: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  } | null;
  venue: {
    id: string;
    name: string;
    type: string;
  };
}

// GET recent activity (reviews)
activityRoute.get("/", async (c) => {
  const db = drizzle(c.env.DB);
  const limit = Math.min(parseInt(c.req.query("limit") || "10"), 20);

  const results = await db
    .select({
      reviewId: reviews.id,
      rating: reviews.rating,
      title: reviews.title,
      content: reviews.content,
      createdAt: reviews.createdAt,
      userId: reviews.userId,
      userName: users.name,
      userAvatar: users.avatarUrl,
      venueId: venues.id,
      venueName: venues.name,
      venueType: venues.type,
    })
    .from(reviews)
    .leftJoin(users, eq(reviews.userId, users.id))
    .innerJoin(venues, eq(reviews.venueId, venues.id))
    .orderBy(desc(reviews.createdAt))
    .limit(limit);

  const activity: ActivityItem[] = results.map((r) => ({
    id: r.reviewId,
    type: "review",
    createdAt: r.createdAt instanceof Date ? r.createdAt.getTime() : r.createdAt,
    review: {
      id: r.reviewId,
      rating: r.rating,
      title: r.title,
      content: r.content,
    },
    user: r.userId
      ? {
          id: r.userId,
          name: r.userName,
          avatarUrl: r.userAvatar,
        }
      : null,
    venue: {
      id: r.venueId,
      name: r.venueName,
      type: r.venueType,
    },
  }));

  return c.json(activity);
});
