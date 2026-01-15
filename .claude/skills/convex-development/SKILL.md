---
name: convex-development
description: Convex function patterns, validators, queries with indexes, mutations with auth checks, and real-time data. Use when writing Convex queries, mutations, actions, schema changes, or debugging Convex code.
allowed-tools:
  - Read
  - Edit
  - Write
  - Glob
  - Grep
  - Bash(bun run dev:backend:*)
  - Bash(npx convex:*)
---

# Convex Development Patterns

Use this skill when working with Convex functions in this codebase. Our patterns ensure type safety, proper authorization, and consistent code style.

## When to Use
- Writing new queries, mutations, or actions
- Modifying the Convex schema
- Debugging Convex function errors
- Adding indexes or optimizing queries

## Core Patterns

### Function Syntax (REQUIRED)
Always use the new function syntax with explicit validators:

```typescript
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const myQuery = query({
  args: { id: v.id("tableName") },
  returns: v.object({ /* shape */ }),
  handler: async (ctx, args) => {
    // implementation
  },
});
```

### Return Validators
ALWAYS include `returns` validator. Use `v.null()` for void functions:

```typescript
export const doSomething = mutation({
  args: { venueId: v.id("venues") },
  returns: v.null(),  // Required even for void
  handler: async (ctx, args) => {
    await ctx.db.patch(args.venueId, { updatedAt: Date.now() });
    return null;
  },
});
```

### Query with Index (NO filter())
Never use `.filter()`. Always use indexes:

```typescript
// CORRECT - use index
const reviews = await ctx.db
  .query("reviews")
  .withIndex("by_venue", (q) => q.eq("venueId", args.venueId))
  .order("desc")
  .collect();

// WRONG - avoid filter
const reviews = await ctx.db
  .query("reviews")
  .filter((q) => q.eq(q.field("venueId"), args.venueId))
  .collect();
```

### Authentication Pattern
Use the standard `getCurrentUser` helper:

```typescript
async function getCurrentUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  return await ctx.db
    .query("users")
    .withIndex("by_workos_id", (q: any) => q.eq("workosUserId", identity.subject))
    .unique();
}
```

### Role-Based Authorization
Check roles using `hasMinRole`:

```typescript
import { hasMinRole } from "./users";

// In mutation handler
const user = await getCurrentUser(ctx);
if (!user) throw new Error("Not authenticated");
if (!hasMinRole(user.role, "editor")) {
  throw new Error("Editor role required");
}
```

Role hierarchy: `viewer < user < editor < admin`

### Computed Fields Pattern
Add computed fields to query results:

```typescript
export const listWithComputed = query({
  args: { userId: v.id("users") },
  returns: v.array(v.object({
    _id: v.id("reviews"),
    _creationTime: v.number(),
    // ... base fields
    venueName: v.string(),      // computed
    avgRating: v.number(),      // computed
    canEdit: v.boolean(),       // computed permission
  })),
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    const result = [];
    for (const review of reviews) {
      const venue = await ctx.db.get(review.venueId);
      if (!venue) continue;

      // Calculate avgRating from all venue reviews
      const allReviews = await ctx.db
        .query("reviews")
        .withIndex("by_venue", (q) => q.eq("venueId", review.venueId))
        .collect();
      const avgRating = allReviews.length > 0
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
        : 0;

      result.push({
        ...review,
        venueName: venue.name,
        avgRating,
        canEdit: currentUser?._id === review.userId,
      });
    }
    return result;
  },
});
```

### Activity Tracking
Create activity entries for user actions:

```typescript
await ctx.db.insert("activity", {
  userId: currentUser._id,
  venueId: args.venueId,
  actionType: "review_created",
  metadata: { reviewId, rating: args.rating },
  createdAt: Date.now(),
});
```

Valid action types: `review_created`, `review_updated`, `photo_added`, `venue_created`, `favorite_added`

### Index Naming Convention
Include all fields in index name:

```typescript
// Schema
.index("by_venue_and_user", ["venueId", "userId"])

// Usage
.withIndex("by_venue_and_user", (q) =>
  q.eq("venueId", venueId).eq("userId", userId)
)
```

## Anti-Patterns

1. **Using `.filter()` instead of indexes** - Always define and use indexes
2. **Missing return validator** - Even void functions need `returns: v.null()`
3. **Using `any` type** - Use `Id<"tableName">` for document IDs
4. **Swallowing errors silently** - Always throw meaningful errors
5. **Forgetting auth checks** - Mutations need `getCurrentUser` + role checks
6. **Not tracking activity** - Add activity entries for user actions

## Schema Reference (Current Tables)

- `users` - workosUserId, email, name, role (indexes: by_workos_id, by_email)
- `venues` - name, type, address, location, mainPhotoId, createdBy (indexes: by_type, by_created_by)
- `reviews` - venueId, userId, rating, content (indexes: by_venue, by_user, by_venue_and_user)
- `photos` - venueId, userId, storageId, storageKey (indexes: by_venue, by_review, by_user)
- `favorites` - userId, venueId (indexes: by_user, by_venue, by_user_and_venue)
- `activity` - userId, venueId, actionType, metadata (indexes: by_user, by_created_at)

## Integration Notes

- Use `bun run dev:backend` to start the Convex dev server
- Schema changes require migration: `npx convex dev`
- Check types with `bun run tsc`
