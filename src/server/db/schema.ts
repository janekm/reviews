import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  workosId: text("workos_id").notNull().unique(),
  email: text("email").notNull(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  role: text("role", { enum: ["viewer", "user", "editor", "admin"] })
    .notNull()
    .default("viewer"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const venues = sqliteTable("venues", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type", { enum: ["restaurant", "cafe", "shop", "bar"] }).notNull(),
  address: text("address"),
  description: text("description"),
  website: text("website"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  creatorId: text("creator_id").references(() => users.id),
  mainPhotoId: text("main_photo_id"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
  updatedById: text("updated_by_id").references(() => users.id),
});

export const reviews = sqliteTable("reviews", {
  id: text("id").primaryKey(),
  venueId: text("venue_id")
    .notNull()
    .references(() => venues.id),
  userId: text("user_id").notNull(),
  rating: integer("rating").notNull(),
  title: text("title"),
  content: text("content"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

export const photos = sqliteTable("photos", {
  id: text("id").primaryKey(),
  venueId: text("venue_id")
    .notNull()
    .references(() => venues.id),
  reviewId: text("review_id").references(() => reviews.id),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  storageKey: text("storage_key").notNull(),
  originalFilename: text("original_filename"),
  caption: text("caption"),
  width: integer("width"),
  height: integer("height"),
  sizeBytes: integer("size_bytes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const favorites = sqliteTable("favorites", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  venueId: text("venue_id")
    .notNull()
    .references(() => venues.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
