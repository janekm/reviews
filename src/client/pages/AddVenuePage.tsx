import { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import Map, { Marker, NavigationControl, MapLayerMouseEvent } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useAuth } from "../hooks/useAuth";

const MAPBOX_TOKEN = "pk.eyJ1IjoiamFuZWttIiwiYSI6ImNta2ZuaGNlbTAweTkzZXF0a2hubWIxM2cifQ.ijlp5QVZz5idX4UBKgdVvA";

const SPITALFIELDS_CENTER = {
  latitude: 51.5197,
  longitude: -0.0754,
  zoom: 16,
};

const VENUE_TYPES = [
  { value: "restaurant", label: "Restaurant", emoji: "🍽️" },
  { value: "cafe", label: "Cafe", emoji: "☕" },
  { value: "shop", label: "Shop", emoji: "🛍️" },
  { value: "bar", label: "Bar", emoji: "🍸" },
] as const;

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

export function AddVenuePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState<"restaurant" | "cafe" | "shop" | "bar">(
    "restaurant"
  );
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );

  const createVenue = useMutation(api.venues.create);

  const handleMapClick = useCallback((e: MapLayerMouseEvent) => {
    setLocation({ lat: e.lngLat.lat, lng: e.lngLat.lng });
  }, []);

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-3xl">🔐</span>
        </div>
        <h1 className="font-display text-2xl font-semibold mb-2">
          Sign in required
        </h1>
        <p className="text-muted-foreground mb-6">
          You need to be signed in to add a new venue.
        </p>
        <Button asChild>
          <Link to="/login">Sign in to continue</Link>
        </Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const venueId = await createVenue({
        name,
        type,
        address: address || "",
        description: description || undefined,
        latitude: location?.lat,
        longitude: location?.lng,
      });

      navigate(`/venue/${venueId}`);
    } catch {
      setError("Failed to create venue. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectedTypeConfig = VENUE_TYPES.find((t) => t.value === type);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
      >
        <ArrowLeftIcon className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Back to Explore
      </Link>

      {/* Form Card */}
      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="gradient-hero p-6 sm:p-8 border-b border-border/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="text-2xl">✨</span>
            </div>
            <div>
              <h1 className="font-display text-2xl font-semibold">
                Add a New Venue
              </h1>
              <p className="text-muted-foreground text-sm">
                Share a hidden gem with the community
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Venue Name <span className="text-primary">*</span>
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. The Coffee Collective"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Type <span className="text-primary">*</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {VENUE_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all duration-200 ${
                        type === t.value
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/30 hover:bg-muted/50"
                      }`}
                    >
                      <span className="text-xl">{t.emoji}</span>
                      <span className="text-xs font-medium">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Address</label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Commercial Street, London E1"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What makes this place special? Tell others what to expect..."
                className="w-full min-h-[100px] px-4 py-3 rounded-xl border-2 border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:border-primary/50 transition-all duration-200 placeholder:text-muted-foreground/70"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center gap-2">
                <MapPinIcon className="w-4 h-4 text-primary" />
                Pin Location
                <span className="text-muted-foreground font-normal">
                  {location ? "(click map to change)" : "(click on map to set)"}
                </span>
              </label>
              <div className="h-72 map-container rounded-xl overflow-hidden">
                <Map
                  initialViewState={SPITALFIELDS_CENTER}
                  style={{ width: "100%", height: "100%" }}
                  mapStyle="mapbox://styles/mapbox/streets-v12"
                  mapboxAccessToken={MAPBOX_TOKEN}
                  onClick={handleMapClick}
                  cursor="crosshair"
                >
                  <NavigationControl position="top-right" />
                  {location && (
                    <Marker
                      latitude={location.lat}
                      longitude={location.lng}
                      anchor="bottom"
                    >
                      <div className="cursor-pointer">
                        <svg width="32" height="40" viewBox="0 0 32 40" fill="none">
                          <path
                            d="M16 0C7.164 0 0 7.164 0 16c0 12 16 24 16 24s16-12 16-24c0-8.836-7.164-16-16-16z"
                            fill="#E85D4C"
                          />
                          <circle cx="16" cy="16" r="8" fill="white" />
                        </svg>
                      </div>
                    </Marker>
                  )}
                </Map>
              </div>
              {location && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPinIcon className="w-3 h-3" />
                  {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </p>
              )}
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex gap-4 pt-4 border-t border-border/50">
              <Button
                type="submit"
                disabled={loading || !name}
                className="flex-1 shadow-glow"
              >
                {loading ? (
                  "Creating..."
                ) : (
                  <>
                    <span className="mr-2">{selectedTypeConfig?.emoji}</span>
                    Add {selectedTypeConfig?.label}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
