---
name: react-patterns
description: React component patterns, Convex hooks, auth checks, loading states, design system classes. Use when creating React components, pages, or UI features.
allowed-tools:
  - Read
  - Edit
  - Write
  - Glob
  - Grep
---

# React Component Patterns

Use this skill when building React components in this codebase. Patterns ensure consistency with our "Golden Hour Discovery" design system and proper Convex integration.

## When to Use
- Creating new page components
- Building reusable UI components
- Adding interactive features
- Working with forms and user input

## Core Patterns

### Component Structure
Pages follow this pattern:

```typescript
import { useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useAuth, hasMinRole } from "../hooks/useAuth";
import { Button } from "../components/ui/button";

export function MyPage() {
  const { user } = useAuth();

  // Convex queries
  const data = useQuery(api.module.list, { /* args */ });

  // Convex mutations
  const createItem = useMutation(api.module.create);

  // Local UI state
  const [isLoading, setIsLoading] = useState(false);

  // Loading check
  const loading = data === undefined;

  // Permission checks
  const canEdit = user && hasMinRole(user.role, "editor");

  // Handlers
  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await createItem({ /* args */ });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Render loading state
  if (loading) {
    return <LoadingSkeleton />;
  }

  // Render empty state
  if (!data || data.length === 0) {
    return <EmptyState />;
  }

  // Render content
  return <Content data={data} />;
}
```

### Conditional Convex Queries
Use "skip" for queries that depend on optional values:

```typescript
const venueId = id as Id<"venues"> | undefined;

// Skip query if ID not available
const venue = useQuery(api.venues.get, venueId ? { id: venueId } : "skip");
const reviews = useQuery(api.reviews.listByVenue, venueId ? { venueId } : "skip");
```

### Loading States (Required)
Always show skeleton UI during loading:

```typescript
if (loading) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="h-8 w-32 skeleton rounded-lg" />
      <div className="rounded-2xl border border-border/50 bg-card p-8 space-y-4">
        <div className="h-8 w-64 skeleton rounded-lg" />
        <div className="h-4 w-48 skeleton rounded-lg" />
        <div className="h-24 w-full skeleton rounded-xl" />
      </div>
    </div>
  );
}
```

### Empty States (Required)
Always handle empty data:

```typescript
{items.length === 0 ? (
  <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
    <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
      <span className="text-2xl">✨</span>
    </div>
    <p className="text-muted-foreground font-medium">No items yet</p>
    <p className="text-sm text-muted-foreground/70 mt-1">
      Add your first item to get started
    </p>
  </div>
) : (
  // Render items
)}
```

### Auth & Role Checks
```typescript
import { useAuth, hasMinRole } from "../hooks/useAuth";

const { user } = useAuth();

// Role hierarchy: viewer < user < editor < admin
const isAuthenticated = !!user;
const canCreateContent = user && hasMinRole(user.role, "user");
const canEdit = user && hasMinRole(user.role, "editor");
const isAdmin = user && hasMinRole(user.role, "admin");
```

### Error Handling
Always catch errors and show user feedback:

```typescript
const handleAction = async () => {
  setLoading(true);
  try {
    await mutation({ /* args */ });
  } catch (err) {
    alert(err instanceof Error ? err.message : "Operation failed");
  } finally {
    setLoading(false);
  }
};
```

### Button Loading States
Disable buttons during operations:

```typescript
<Button
  onClick={handleSubmit}
  disabled={submitting}
>
  {submitting ? "Saving..." : "Save"}
</Button>
```

## Design System Classes

### Layout
- `max-w-4xl mx-auto` - Page container
- `space-y-6` / `space-y-8` - Vertical spacing
- `rounded-2xl` - Large cards
- `rounded-xl` - Medium cards
- `rounded-lg` - Small elements

### Cards
```typescript
<div className="rounded-2xl border border-border/50 bg-card p-6 animate-fade-in-up">
  {/* content */}
</div>
```

### Interactive Cards
```typescript
<div className="rounded-xl border border-border/50 bg-card p-5 card-hover">
  {/* content */}
</div>
```

### Typography
- `font-display` - Fraunces serif for headings
- `font-body` - Outfit sans for body (default)
- `text-muted-foreground` - Secondary text
- `text-card-foreground` - Card headings

### Animations
```typescript
// Staggered list animation
{items.map((item, index) => (
  <div
    key={item._id}
    className="animate-fade-in-up"
    style={{ animationDelay: `${index * 0.05}s` }}
  >
    {/* content */}
  </div>
))}
```

### Badge Types
```typescript
const TYPE_CONFIG = {
  restaurant: { label: "Restaurant", emoji: "🍽️", badgeClass: "badge-restaurant" },
  cafe: { label: "Cafe", emoji: "☕", badgeClass: "badge-cafe" },
  shop: { label: "Shop", emoji: "🛍️", badgeClass: "badge-shop" },
  bar: { label: "Bar", emoji: "🍸", badgeClass: "badge-bar" },
};
```

### State Colors
- `skeleton` - Loading shimmer
- `bg-secondary` - Empty state icons
- `text-destructive` - Error/delete actions
- `border-primary/30` - Active/focus borders

## Anti-Patterns

1. **No loading state** - Always show skeletons
2. **No empty state** - Always handle zero items
3. **No error handling** - Always try/catch mutations
4. **Using inline styles** - Use Tailwind classes
5. **Hardcoding colors** - Use design tokens
6. **Forgetting animations** - Add `animate-fade-in-up`
7. **Missing disabled states** - Buttons need loading states

## Integration Notes

- Import `useAuth` from `../hooks/useAuth`
- Import Convex from `../../../convex/_generated/api`
- Use `type Id` for Convex document IDs
- UI components in `../components/ui/`
