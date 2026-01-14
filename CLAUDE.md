# Spitalfields Reviews

A local venue discovery and review platform for Old Spitalfields Market in London.

## Tech Stack

- **Frontend**: React 18, React Router v6, React Leaflet (maps)
- **Backend**: Hono (Cloudflare Workers framework)
- **Database**: SQLite with Drizzle ORM (via Cloudflare D1)
- **Authentication**: WorkOS SSO
- **Styling**: Tailwind CSS v3.4
- **Build**: Vite
- **Package Manager**: Bun

## Commands

```bash
bun install          # Install dependencies
bun run dev          # Start development server
bun run build        # Build for production
bun run preview      # Preview production build
```

## Project Structure

```
src/
├── client/                 # React frontend
│   ├── pages/              # Page components
│   │   ├── HomePage.tsx    # Main discovery page with map
│   │   ├── VenuePage.tsx   # Venue details and reviews
│   │   ├── AddVenuePage.tsx
│   │   └── LoginPage.tsx
│   ├── components/
│   │   ├── Layout.tsx      # App shell with header/footer
│   │   └── ui/             # Reusable UI components
│   ├── hooks/
│   │   └── useAuth.tsx     # Auth context
│   └── index.css           # Tailwind + design tokens
├── server/                 # Hono backend
│   ├── routes/             # API route handlers
│   └── db/                 # Drizzle schema
└── shared/
    └── types.ts            # Shared TypeScript types
```

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
