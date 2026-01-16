import { useState } from "react";
import { Link } from "react-router-dom";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "../components/ui/button";
import { getImageUrl, ImageKitTransforms } from "../lib/imagekit";
import { useAuth } from "../hooks/useAuth";
import type { Id } from "../../../convex/_generated/dataModel";

type VenueType = "restaurant" | "cafe" | "shop" | "bar";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || "pk.eyJ1IjoiamFuZWttIiwiYSI6ImNta2ZuaGNlbTAweTkzZXF0a2hubWIxM2cifQ.ijlp5QVZz5idX4UBKgdVvA";

const SPITALFIELDS_CENTER = {
  latitude: 51.5197,
  longitude: -0.0754,
  zoom: 16,
};

const TYPE_CONFIG: Record<
  string,
  { label: string; emoji: string; badgeClass: string }
> = {
  restaurant: {
    label: "Restaurant",
    emoji: "🍽️",
    badgeClass: "badge-restaurant",
  },
  cafe: { label: "Cafe", emoji: "☕", badgeClass: "badge-cafe" },
  shop: { label: "Shop", emoji: "🛍️", badgeClass: "badge-shop" },
  bar: { label: "Bar", emoji: "🍸", badgeClass: "badge-bar" },
};

const VENUE_TYPES: VenueType[] = ["restaurant", "cafe", "bar", "shop"];

function VenueBadge({ type }: { type: string }) {
  const config = TYPE_CONFIG[type] || {
    label: type,
    emoji: "📍",
    badgeClass: "",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${config.badgeClass}`}
    >
      <span>{config.emoji}</span>
      <span>{config.label}</span>
    </span>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function StarIcon({ className, filled }: { className?: string; filled?: boolean }) {
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
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
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

function VenueRating({ rating, count }: { rating: number | null | undefined; count: number | undefined }) {
  if (!count || count === 0) return null;

  return (
    <div className="flex items-center gap-1 text-xs">
      <StarIcon className="w-3.5 h-3.5 text-amber-500" filled />
      <span className="font-medium text-foreground">{rating?.toFixed(1)}</span>
      <span className="text-muted-foreground">({count})</span>
    </div>
  );
}

function VenueCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-5 w-48 skeleton rounded" />
          <div className="h-4 w-32 skeleton rounded" />
        </div>
        <div className="h-6 w-24 skeleton rounded-full" />
      </div>
      <div className="h-4 w-full skeleton rounded" />
      <div className="h-4 w-3/4 skeleton rounded" />
    </div>
  );
}

function MapMarker({
  venue,
  getImageUrl,
  isSelected,
  onSelect
}: {
  venue: any;
  getImageUrl: any;
  isSelected: boolean;
  onSelect: (venueId: string | null) => void;
}) {
  return (
    <>
      <Marker
        latitude={venue.latitude!}
        longitude={venue.longitude!}
        anchor="bottom"
        onClick={(e) => {
          e.originalEvent.stopPropagation();
          onSelect(venue._id);
        }}
      >
        <div className="cursor-pointer transform hover:scale-110 transition-transform">
          <svg width="24" height="30" viewBox="0 0 24 30" fill="none">
            <path
              d="M12 0C5.373 0 0 5.373 0 12c0 9 12 18 12 18s12-9 12-18c0-6.627-5.373-12-12-12z"
              fill="#E85D4C"
              fillOpacity="0.85"
            />
            <circle cx="12" cy="12" r="5" fill="white" fillOpacity="0.9" />
          </svg>
        </div>
      </Marker>
      {isSelected && (
        <Popup
          latitude={venue.latitude!}
          longitude={venue.longitude!}
          anchor="bottom"
          onClose={() => onSelect(null)}
          closeOnClick={false}
          offset={[0, -30] as [number, number]}
        >
          <div className="min-w-52 -m-2.5">
            {venue.mainPhotoStorageKey && (
              <div className="w-full h-28 mb-3 rounded-t overflow-hidden">
                <img
                  src={getImageUrl(venue.mainPhotoStorageKey, ImageKitTransforms.mapPopup)}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="px-2.5 pb-2.5">
              <p className="font-display font-semibold text-base mb-1">
                {venue.name}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <VenueBadge type={venue.type} />
                <VenueRating rating={venue.avgRating} count={venue.reviewCount} />
              </div>
              {venue.address && (
                <p className="text-xs text-muted-foreground mt-2">
                  {venue.address}
                </p>
              )}
              <Link
                to={`/venue/${venue._id}`}
                className="inline-block mt-3 text-sm font-medium text-primary hover:underline"
              >
                View details →
              </Link>
            </div>
          </div>
        </Popup>
      )}
    </>
  );
}

export function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const [selectedType, setSelectedType] = useState<VenueType | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);

  // Fetch venues with Convex - real-time updates!
  const venues = useQuery(api.venues.list, {
    type: selectedType ?? undefined,
    favoritesOnly: showFavorites,
  });

  // Fetch recent activity
  const activity = useQuery(api.activity.listRecent, { limit: 8 });

  // Get favorite count for display
  const favoriteIds = useQuery(api.favorites.getMyFavoriteIds);
  const favoriteIdsSet = new Set(favoriteIds ?? []);
  const toggleFavorite = useMutation(api.favorites.toggle);

  const loading = venues === undefined;
  const loadingActivity = activity === undefined;

  const filteredVenues = venues ?? [];
  const venuesWithLocation = filteredVenues.filter(
    (v) => v.latitude !== null && v.latitude !== undefined && v.longitude !== null && v.longitude !== undefined
  );

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 pb-6 border-b border-border">
        <div className="space-y-3">
          <h1 className="font-display text-4xl sm:text-5xl text-foreground">
            Spitalfields
          </h1>
          <p className="text-muted-foreground max-w-lg text-base">
            The best restaurants, cafes, shops and bars around Old Spitalfields Market,
            curated by the local community.
          </p>
        </div>
        <Button asChild className="shrink-0">
          <Link to="/venue/new" className="flex items-center gap-2">
            <PlusIcon className="w-4 h-4" />
            <span>Add Venue</span>
          </Link>
        </Button>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => {
            setSelectedType(null);
            setShowFavorites(false);
          }}
          className={`px-3.5 py-1.5 text-sm rounded-full border transition-all duration-200 ${
            selectedType === null && !showFavorites
              ? "bg-primary text-primary-foreground border-primary shadow-glow"
              : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
          }`}
        >
          All
          <span className="ml-1.5 text-xs opacity-70">{venues?.length ?? 0}</span>
        </button>
        {VENUE_TYPES.map((type) => {
          const config = TYPE_CONFIG[type];
          return (
            <button
              key={type}
              onClick={() => {
                setSelectedType(selectedType === type ? null : type);
                setShowFavorites(false);
              }}
              className={`px-3.5 py-1.5 text-sm rounded-full border transition-all duration-200 ${
                selectedType === type && !showFavorites
                  ? "bg-primary text-primary-foreground border-primary shadow-glow"
                  : `${config.badgeClass} hover:opacity-80`
              }`}
            >
              {config.label}
            </button>
          );
        })}
        {isAuthenticated && (
          <button
            onClick={() => {
              setShowFavorites(!showFavorites);
              setSelectedType(null);
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm rounded-full border transition-all duration-200 ${
              showFavorites
                ? "bg-rose-500 text-white border-rose-500 shadow-sm"
                : "bg-card border-border text-rose-500 hover:bg-rose-50 hover:border-rose-200"
            }`}
          >
            <HeartIcon className="w-3.5 h-3.5" filled={showFavorites} />
            Saved
            <span className="text-xs opacity-70">{favoriteIds?.length ?? 0}</span>
          </button>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Venue List */}
        <div className="w-full lg:w-[400px] space-y-4 lg:max-h-[640px] lg:overflow-y-auto custom-scrollbar lg:pr-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filteredVenues.length} {filteredVenues.length === 1 ? "venue" : "venues"}
              {showFavorites && (
                <Link to="/favorites" className="ml-2 underline hover:text-foreground">
                  View all
                </Link>
              )}
            </p>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <VenueCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredVenues.length === 0 ? (
            <div className="border border-dashed border-border rounded-lg p-10 text-center">
              <p className="text-muted-foreground text-sm">
                {selectedType
                  ? "No venues in this category yet"
                  : showFavorites
                    ? "No saved venues"
                    : "No venues found"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredVenues.map((venue, index) => {
                const isFavorited = favoriteIdsSet.has(venue._id);
                return (
                  <Link
                    key={venue._id}
                    to={`/venue/${venue._id}`}
                    className="group relative block bg-card border border-border rounded-lg overflow-hidden card-hover animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.02}s` }}
                  >
                    {/* Favorite Button */}
                    {isAuthenticated && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleFavorite({ venueId: venue._id });
                        }}
                        className={`absolute bottom-2 right-2 z-10 p-1 rounded-full transition-all duration-200 ${
                          isFavorited
                            ? "text-rose-500 opacity-100"
                            : "text-muted-foreground opacity-0 group-hover:opacity-60 hover:text-rose-500 hover:opacity-100"
                        }`}
                        title={isFavorited ? "Remove from saved" : "Save venue"}
                      >
                        <HeartIcon className="w-3.5 h-3.5" filled={isFavorited} />
                      </button>
                    )}
                    <div className="flex">
                      {/* Thumbnail */}
                      {venue.mainPhotoStorageKey && (
                        <div className="w-24 shrink-0 bg-muted">
                          <img
                            src={getImageUrl(venue.mainPhotoStorageKey, ImageKitTransforms.venueListCard)}
                            alt=""
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <div className="flex-1 p-3.5 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h3 className="font-medium text-foreground group-hover:text-accent transition-colors truncate">
                            {venue.name}
                          </h3>
                          <span className="text-[11px] text-muted-foreground shrink-0 uppercase tracking-wide">
                            {TYPE_CONFIG[venue.type]?.label || venue.type}
                          </span>
                        </div>
                        {venue.address && (
                          <p className="text-xs text-muted-foreground truncate mb-2">
                            {venue.address}
                          </p>
                        )}
                        {venue.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                            {venue.description}
                          </p>
                        )}
                        <div className="mt-2 flex items-center gap-3">
                          <VenueRating rating={venue.avgRating} count={venue.reviewCount} />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Map */}
        <div className="flex-1 min-h-[400px] lg:min-h-0">
          <div className="h-full map-container animate-scale-in rounded-xl overflow-hidden">
            <Map
              initialViewState={SPITALFIELDS_CENTER}
              style={{ width: "100%", height: "100%" }}
              mapStyle="mapbox://styles/mapbox/streets-v12"
              mapboxAccessToken={MAPBOX_TOKEN}
              onClick={() => setSelectedVenueId(null)}
            >
              <NavigationControl position="top-right" />
              {venuesWithLocation.map((venue) => (
                <MapMarker
                  key={venue._id}
                  venue={venue}
                  getImageUrl={getImageUrl}
                  isSelected={selectedVenueId === venue._id}
                  onSelect={setSelectedVenueId}
                />
              ))}
            </Map>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-12 pt-8 border-t border-border">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-display text-2xl text-foreground">Recent Activity</h2>
          <span className="text-sm text-muted-foreground">{activity?.length ?? 0} latest</span>
        </div>

        {loadingActivity ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border border-border rounded-lg p-4 space-y-3">
                <div className="h-4 w-32 skeleton" />
                <div className="h-3 w-24 skeleton" />
                <div className="h-16 w-full skeleton" />
              </div>
            ))}
          </div>
        ) : !activity || activity.length === 0 ? (
          <div className="border border-dashed border-border rounded-lg p-10 text-center">
            <p className="text-muted-foreground text-sm">No activity yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {activity.map((item) => (
              <Link
                key={item._id}
                to={`/venue/${item.venueId}`}
                className="group block border border-border rounded-lg p-4 hover:border-foreground/20 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-muted rounded-full">
                    {item.actionType.replace("_", " ")}
                  </span>
                </div>
                <p className="font-medium text-foreground group-hover:text-accent transition-colors mb-1">
                  {item.venue.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  by {item.user?.name ?? item.user?.email ?? "Anonymous"}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
