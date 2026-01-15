# Spitalfields Reviews

A local venue discovery and review platform for Old Spitalfields Market in London.

## Tech Stack

- **Frontend**: React 18, React Router v6, React Leaflet (maps)
- **Backend**: Convex (real-time database and serverless functions)
- **Database**: Convex (replaces D1/Drizzle)
- **File Storage**: Convex Storage + ImageKit CDN
- **Authentication**: WorkOS AuthKit via @convex-dev/workos
- **Styling**: Tailwind CSS v3.4
- **Build**: Vite
- **Package Manager**: Bun

## Commands

```bash
bun install          # Install dependencies
bun run dev          # Start frontend + Convex dev server
bun run dev:frontend # Start Vite dev server only
bun run dev:backend  # Start Convex dev server only
bun run build        # Build frontend for production
bun run deploy       # Build + deploy to Convex
```

## Environment Variables

Create a `.env.local` file:

```bash
# Convex
VITE_CONVEX_URL=https://your-project.convex.cloud

# WorkOS AuthKit
VITE_WORKOS_CLIENT_ID=client_...
VITE_WORKOS_REDIRECT_URI=http://localhost:5173/callback

# ImageKit (for image CDN)
VITE_IMAGEKIT_URL=https://ik.imagekit.io/your-imagekit-id
```

Set these in Convex Dashboard > Settings > Environment Variables:
- `WORKOS_API_KEY=sk_...`
- `WORKOS_CLIENT_ID=client_...`

## Project Structure

```
src/
├── client/                 # React frontend
│   ├── pages/              # Page components
│   │   ├── HomePage.tsx    # Main discovery page with map
│   │   ├── VenuePage.tsx   # Venue details and reviews
│   │   ├── AddVenuePage.tsx
│   │   ├── FavoritesPage.tsx
│   │   ├── AdminPage.tsx   # User management
│   │   └── LoginPage.tsx
│   ├── components/
│   │   ├── Layout.tsx      # App shell with header/footer
│   │   ├── PhotoGallery.tsx
│   │   ├── PhotoUpload.tsx
│   │   ├── PhotoGrid.tsx
│   │   └── ui/             # Reusable UI components
│   ├── hooks/
│   │   └── useAuth.tsx     # Auth context (Convex + WorkOS)
│   ├── lib/
│   │   └── imagekit.ts     # ImageKit URL helpers
│   └── index.css           # Tailwind + design tokens
├── main.tsx                # App entry with ConvexProvider
convex/
├── schema.ts               # Database schema
├── auth.config.ts          # WorkOS JWT config
├── users.ts                # User queries/mutations
├── venues.ts               # Venue CRUD with computed fields
├── reviews.ts              # Review CRUD
├── photos.ts               # Photo upload/management
├── favorites.ts            # Favorites toggle
└── activity.ts             # Activity feed
```

## Convex Schema

```typescript
// Key tables:
- users: workosUserId, email, name, avatarUrl, role (viewer|user|editor|admin)
- venues: name, type, address, description, location, mainPhotoId, createdBy
- reviews: venueId, userId, rating, content, visitedAt
- photos: venueId, userId, storageId, storageKey, caption
- favorites: userId, venueId
- activity: userId, venueId, actionType, metadata
```

## Real-time Features

Convex provides automatic real-time updates. When data changes:
- Venue list updates automatically
- Reviews appear instantly
- Activity feed is live
- No manual refresh needed

```typescript
// Example usage:
const venues = useQuery(api.venues.list, { type: "restaurant" });
const createReview = useMutation(api.reviews.create);
```

## User Roles

- **viewer**: Can browse venues and reviews (default for new users)
- **user**: Can create venues, reviews, and photos
- **editor**: Can edit all content, manage photos
- **admin**: Full access including user management

## Design System

**"Golden Hour Discovery"** - A warm, inviting aesthetic that captures the excitement of urban exploration.

### Typography
- **Display**: Fraunces (Victorian-inspired serif)
- **Body**: Outfit (modern, readable sans-serif)

### Color Palette
- **Primary** (Coral/Terracotta): `hsl(12 76% 61%)` - Warmth and excitement
- **Secondary** (Sage Green): `hsl(145 25% 88%)` - Fresh, organic feel
- **Accent** (Golden Amber): `hsl(38 95% 64%)` - Ratings and highlights
- **Background**: Warm cream `hsl(35 45% 97%)`

### Venue Type Colors
- Restaurant: Coral `badge-restaurant`
- Cafe: Amber `badge-cafe`
- Shop: Purple `badge-shop`
- Bar: Sky blue `badge-bar`

### Key CSS Classes
- `.font-display` - Fraunces serif for headings
- `.font-body` - Outfit sans-serif for body text
- `.gradient-hero` - Animated gradient background
- `.card-hover` - Lift effect on hover
- `.map-container` - Styled map wrapper
- `.star-rating` / `.star.filled` - Star rating styles
- `.glass` - Glassmorphism effect
- `.skeleton` - Loading shimmer animation
- `.animate-fade-in-up` - Entry animation
- `.shadow-glow` - Primary color glow shadow

### Design Principles
1. Warm, inviting color palette evoking street markets
2. Distinctive typography with Fraunces display font
3. Subtle animations and micro-interactions
4. Gradient mesh backgrounds for depth
5. Color-coded venue type badges
6. Interactive star ratings with hover effects

## Claude Code Skills

The following skills are available in `.claude/skills/`:

- **convex-development**: Convex function patterns, validators, queries with indexes, auth checks. Auto-activates when working with `convex/*.ts` files.
- **react-patterns**: React component patterns, loading/empty states, design system classes. Auto-activates when creating components.

See `.claude/README.md` for full documentation.
