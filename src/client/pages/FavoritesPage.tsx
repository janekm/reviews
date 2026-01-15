import { Link, Navigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "../components/ui/button";
import { useAuth } from "../hooks/useAuth";

const TYPE_CONFIG: Record<string, { label: string; emoji: string; badgeClass: string }> = {
  restaurant: { label: "Restaurant", emoji: "🍽️", badgeClass: "badge-restaurant" },
  cafe: { label: "Cafe", emoji: "☕", badgeClass: "badge-cafe" },
  shop: { label: "Shop", emoji: "🛍️", badgeClass: "badge-shop" },
  bar: { label: "Bar", emoji: "🍸", badgeClass: "badge-bar" },
};

function VenueBadge({ type }: { type: string }) {
  const config = TYPE_CONFIG[type] || { label: type, emoji: "📍", badgeClass: "" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${config.badgeClass}`}>
      <span>{config.emoji}</span>
      <span>{config.label}</span>
    </span>
  );
}

function HeartIcon({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function FavoriteCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-5 w-48 skeleton rounded" />
          <div className="h-4 w-32 skeleton rounded" />
        </div>
        <div className="h-6 w-24 skeleton rounded-full" />
      </div>
    </div>
  );
}

export function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const favorites = useQuery(api.favorites.listMine);
  const removeFavorite = useMutation(api.favorites.remove);

  const handleRemove = async (venueId: Id<"venues">) => {
    try {
      await removeFavorite({ venueId });
    } catch (err) {
      console.error("Failed to remove favorite:", err);
    }
  };

  // Redirect to login if not authenticated
  if (!authLoading && !user) {
    return <Navigate to="/login" replace />;
  }

  const loading = favorites === undefined;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeftIcon className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
              <HeartIcon className="w-5 h-5 text-rose-500" filled />
            </div>
            <div>
              <h1 className="font-display text-2xl font-semibold">Saved Venues</h1>
              <p className="text-sm text-muted-foreground">
                {favorites?.length ?? 0} {favorites?.length === 1 ? "venue" : "venues"} saved
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Favorites List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <FavoriteCardSkeleton key={i} />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-100 flex items-center justify-center">
            <HeartIcon className="w-8 h-8 text-rose-300" />
          </div>
          <h2 className="font-display text-xl font-semibold mb-2">No saved venues yet</h2>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            When you find a venue you love, click the Save button to add it here for quick access.
          </p>
          <Button asChild>
            <Link to="/">Explore Venues</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {favorites.map((fav) => (
            <div
              key={fav._id}
              className="rounded-xl border border-border/50 bg-card p-4 hover:border-primary/30 transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-4">
                <Link to={`/venue/${fav.venue._id}`} className="flex-1 min-w-0">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">
                      {TYPE_CONFIG[fav.venue.type]?.emoji || "📍"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground hover:text-primary transition-colors">
                        {fav.venue.name}
                      </h3>
                      {fav.venue.address && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPinIcon className="w-3.5 h-3.5" />
                          <span className="truncate">{fav.venue.address}</span>
                        </p>
                      )}
                      <div className="mt-2">
                        <VenueBadge type={fav.venue.type} />
                      </div>
                    </div>
                  </div>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(fav.venueId)}
                  className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 shrink-0"
                >
                  <HeartIcon className="w-4 h-4 mr-1" filled />
                  Remove
                </Button>
              </div>
              <p className="text-xs text-muted-foreground/70 mt-3 pl-9">
                Saved {new Date(fav.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
