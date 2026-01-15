# BEFORE: React Component Patterns Skill Test

## Test Prompt
"Create a new component to display a user's activity history with their recent reviews, photos, and favorites"

## Current State
- No React-specific skill file exists
- `CLAUDE.md` has design system info but minimal React patterns
- Component examples must be found by reading existing files
- No documented patterns for Convex hooks, auth, loading states

## Expected Behavior Without Skill

### Information Discovery
1. Would need to read existing page components to understand patterns
2. Would need to check design system classes in CLAUDE.md
3. Would need to understand Convex hooks usage pattern
4. Would need to figure out auth patterns from useAuth hook

### Potential Issues
1. **May miss loading state pattern**: skeleton UI with specific classes
2. **May miss auth pattern**: useAuth() hook with hasMinRole()
3. **May miss Convex hook pattern**: useQuery with "skip" for conditional fetching
4. **May use wrong styling**: not following Golden Hour design tokens
5. **May not handle empty states**: required pattern in this codebase

## Patterns That Should Be Followed

### Loading States (from VenuePage)
```typescript
if (loading) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="h-8 w-32 skeleton rounded-lg" />
      <div className="rounded-2xl border border-border/50 bg-card p-8 space-y-4">
        <div className="h-8 w-64 skeleton rounded-lg" />
      </div>
    </div>
  );
}
```

### Empty States
```typescript
{items.length === 0 ? (
  <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
    <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
      <span className="text-2xl">✨</span>
    </div>
    <p className="text-muted-foreground font-medium">No items yet</p>
  </div>
) : (
  // content
)}
```

### Convex Queries with Skip
```typescript
const data = useQuery(api.module.function, id ? { id } : "skip");
```

### Auth Checks
```typescript
const { user } = useAuth();
const canEdit = user && hasMinRole(user.role, "editor");
```

### Animation Classes
- `animate-fade-in-up` with `animationDelay`
- `card-hover` for interactive cards
- `skeleton` for loading placeholders

## Baseline Metrics

| Metric | Assessment |
|--------|------------|
| Files read before writing | 2-3 (existing components) |
| Design system adherence | Medium - may miss classes |
| Loading/empty states | Variable - may be incomplete |
| Auth integration | May need multiple reads |
| Animation consistency | Low - often forgotten |

## Notes
This documents the state BEFORE implementing the React patterns skill.
