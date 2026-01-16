import { useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Map, { Marker, NavigationControl, MapLayerMouseEvent } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { PhotoGallery } from "../components/PhotoGallery";
import { PhotoUpload } from "../components/PhotoUpload";
import { getImageUrl } from "../lib/imagekit";
import { useAuth, hasMinRole } from "../hooks/useAuth";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || "pk.eyJ1IjoiamFuZWttIiwiYSI6ImNta2ZuaGNlbTAweTkzZXF0a2hubWIxM2cifQ.ijlp5QVZz5idX4UBKgdVvA";

const SPITALFIELDS_CENTER = {
  latitude: 51.5197,
  longitude: -0.0754,
  zoom: 16,
};

type VenueType = "restaurant" | "cafe" | "shop" | "bar";

const TYPE_CONFIG: Record<string, { label: string; emoji: string; badgeClass: string }> = {
  restaurant: { label: "Restaurant", emoji: "🍽️", badgeClass: "badge-restaurant" },
  cafe: { label: "Cafe", emoji: "☕", badgeClass: "badge-cafe" },
  shop: { label: "Shop", emoji: "🛍️", badgeClass: "badge-shop" },
  bar: { label: "Bar", emoji: "🍸", badgeClass: "badge-bar" },
};

const VENUE_TYPES: { value: VenueType; label: string; emoji: string }[] = [
  { value: "restaurant", label: "Restaurant", emoji: "🍽️" },
  { value: "cafe", label: "Cafe", emoji: "☕" },
  { value: "shop", label: "Shop", emoji: "🛍️" },
  { value: "bar", label: "Bar", emoji: "🍸" },
];

function VenueBadge({ type }: { type: string }) {
  const config = TYPE_CONFIG[type] || { label: type, emoji: "📍", badgeClass: "" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full border ${config.badgeClass}`}>
      <span>{config.emoji}</span>
      <span>{config.label}</span>
    </span>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={`star text-xl ${star <= rating ? "filled" : ""}`}>★</span>
      ))}
    </div>
  );
}

function InteractiveStarRating({ rating, onChange }: { rating: number; onChange: (rating: number) => void }) {
  const [hoverRating, setHoverRating] = useState(0);
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          className={`star text-3xl transition-transform duration-150 hover:scale-125 ${star <= (hoverRating || rating) ? "filled" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function VenueMarker({ latitude, longitude }: { latitude: number; longitude: number }) {
  return (
    <Marker latitude={latitude} longitude={longitude} anchor="bottom">
      <svg width="24" height="30" viewBox="0 0 24 30" fill="none">
        <path
          d="M12 0C5.373 0 0 5.373 0 12c0 9 12 18 12 18s12-9 12-18c0-6.627-5.373-12-12-12z"
          fill="#E85D4C"
          fillOpacity="0.85"
        />
        <circle cx="12" cy="12" r="5" fill="white" fillOpacity="0.9" />
      </svg>
    </Marker>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function PenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  );
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}

function HeartIcon({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

export function VenuePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Convert string ID to Convex ID type
  const venueId = id as Id<"venues"> | undefined;

  // Convex queries - real-time updates!
  const venueData = useQuery(api.venues.get, venueId ? { id: venueId } : "skip");
  const reviews = useQuery(api.reviews.listByVenue, venueId ? { venueId } : "skip");
  const photos = useQuery(api.photos.listByVenue, venueId ? { venueId } : "skip");
  const isFavorite = useQuery(api.favorites.isFavorite, venueId ? { venueId } : "skip");

  // Convex mutations
  const updateVenue = useMutation(api.venues.update);
  const deleteVenue = useMutation(api.venues.remove);
  const setMainPhoto = useMutation(api.venues.setMainPhoto);
  const createReview = useMutation(api.reviews.create);
  const updateReview = useMutation(api.reviews.update);
  const deleteReview = useMutation(api.reviews.remove);
  const toggleFavorite = useMutation(api.favorites.toggle);

  // Local UI state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    type: "restaurant" as VenueType,
    address: "",
    description: "",
    website: "",
    latitude: null as number | null,
    longitude: null as number | null,
  });
  const [saving, setSaving] = useState(false);
  const [deletingVenue, setDeletingVenue] = useState(false);

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewContent, setReviewContent] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  // Photo upload state
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [reviewPhotoUploadId, setReviewPhotoUploadId] = useState<Id<"reviews"> | null>(null);

  // Edit review state
  const [editingReviewId, setEditingReviewId] = useState<Id<"reviews"> | null>(null);
  const [editReviewForm, setEditReviewForm] = useState({ rating: 5, content: "" });
  const [savingReview, setSavingReview] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState<Id<"reviews"> | null>(null);

  // Favorite state
  const [togglingFavorite, setTogglingFavorite] = useState(false);

  const loading = venueData === undefined;
  const venue = venueData?.venue;
  const canEdit = venueData?.canEdit ?? false;
  const canCreateContent = user && hasMinRole(user.role, "user");
  const isAdmin = user && hasMinRole(user.role, "admin");

  // Initialize edit form when venue loads
  const initEditForm = useCallback(() => {
    if (venue) {
      setEditForm({
        name: venue.name,
        type: venue.type as VenueType,
        address: venue.address ?? "",
        description: venue.description ?? "",
        website: venue.website ?? "",
        latitude: venue.latitude ?? null,
        longitude: venue.longitude ?? null,
      });
    }
  }, [venue]);

  const handleDeleteVenue = async () => {
    if (!venueId || !venue) return;
    if (!confirm(`Delete "${venue.name}"? This will also delete all photos and reviews. This cannot be undone.`)) {
      return;
    }

    setDeletingVenue(true);
    try {
      await deleteVenue({ id: venueId });
      navigate("/");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete venue");
      setDeletingVenue(false);
    }
  };

  const handleDeleteReview = async (reviewId: Id<"reviews">) => {
    if (!confirm("Delete this review? This cannot be undone.")) return;

    setDeletingReviewId(reviewId);
    try {
      await deleteReview({ id: reviewId });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete review");
    } finally {
      setDeletingReviewId(null);
    }
  };

  const handleStartEditReview = (review: NonNullable<typeof reviews>[number]) => {
    setEditingReviewId(review._id);
    setEditReviewForm({
      rating: review.rating,
      content: review.content ?? "",
    });
  };

  const handleCancelEditReview = () => {
    setEditingReviewId(null);
    setEditReviewForm({ rating: 5, content: "" });
  };

  const handleSaveReview = async (reviewId: Id<"reviews">) => {
    setSavingReview(true);
    try {
      await updateReview({
        id: reviewId,
        rating: editReviewForm.rating,
        content: editReviewForm.content || undefined,
      });
      setEditingReviewId(null);
      setEditReviewForm({ rating: 5, content: "" });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update review");
    } finally {
      setSavingReview(false);
    }
  };

  const handlePhotoUploadComplete = useCallback(() => {
    setShowPhotoUpload(false);
  }, []);

  const handleMainPhotoChange = useCallback(async (photoId: Id<"photos">) => {
    if (!venueId) return;
    try {
      await setMainPhoto({ venueId, photoId });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to set main photo");
    }
  }, [venueId, setMainPhoto]);

  const handleToggleFavorite = async () => {
    if (!venueId || !user) return;

    setTogglingFavorite(true);
    try {
      await toggleFavorite({ venueId });
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    } finally {
      setTogglingFavorite(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!venueId) return;
    setSaving(true);

    try {
      await updateVenue({
        id: venueId,
        name: editForm.name,
        type: editForm.type,
        address: editForm.address || undefined,
        description: editForm.description || undefined,
        website: editForm.website || undefined,
        latitude: editForm.latitude ?? undefined,
        longitude: editForm.longitude ?? undefined,
      });
      setIsEditing(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update venue");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !venueId) return;

    setSubmitting(true);
    try {
      await createReview({
        venueId,
        rating: reviewRating,
        content: reviewContent || "",
      });
      setShowReviewForm(false);
      setReviewContent("");
      setReviewRating(5);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const averageRating = venueData?.avgRating ?? 0;
  const reviewCount = venueData?.reviewCount ?? 0;

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

  if (!venue) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
          <span className="text-3xl">😕</span>
        </div>
        <h1 className="font-display text-2xl font-semibold mb-2">Venue not found</h1>
        <p className="text-muted-foreground mb-6">This venue doesn't exist or has been removed.</p>
        <Button asChild>
          <Link to="/" className="inline-flex items-center gap-2">
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Explore
          </Link>
        </Button>
      </div>
    );
  }

  const config = TYPE_CONFIG[venue.type] || { label: venue.type, emoji: "📍", badgeClass: "" };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Back button */}
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group">
        <ArrowLeftIcon className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Back to Explore
      </Link>

      {/* Edit Form */}
      {isEditing ? (
        <div className="rounded-2xl border border-primary/30 bg-card p-6 animate-scale-in">
          <h2 className="font-display text-xl font-semibold mb-6">Edit Venue</h2>
          <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {VENUE_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setEditForm({ ...editForm, type: t.value })}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all duration-200 ${
                        editForm.type === t.value
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
              <Input value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="w-full min-h-[100px] px-4 py-3 rounded-xl border-2 border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:border-primary/50 transition-all duration-200"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <ExternalLinkIcon className="w-4 h-4 text-primary" />
                Website
              </label>
              <Input
                type="url"
                value={editForm.website}
                onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                placeholder="https://example.com"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center gap-2">
                <MapPinIcon className="w-4 h-4 text-primary" />
                Location
                <span className="text-muted-foreground font-normal">
                  {editForm.latitude && editForm.longitude ? "(click map to change)" : "(click on map to set)"}
                </span>
              </label>
              <div className="h-64 map-container rounded-xl overflow-hidden">
                <Map
                  initialViewState={
                    editForm.latitude && editForm.longitude
                      ? { latitude: editForm.latitude, longitude: editForm.longitude, zoom: 16 }
                      : SPITALFIELDS_CENTER
                  }
                  style={{ width: "100%", height: "100%" }}
                  mapStyle="mapbox://styles/mapbox/streets-v12"
                  mapboxAccessToken={MAPBOX_TOKEN}
                  onClick={(e: MapLayerMouseEvent) => setEditForm({ ...editForm, latitude: e.lngLat.lat, longitude: e.lngLat.lng })}
                  cursor="crosshair"
                >
                  <NavigationControl position="top-right" />
                  {editForm.latitude && editForm.longitude && (
                    <VenueMarker latitude={editForm.latitude} longitude={editForm.longitude} />
                  )}
                </Map>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-border/50">
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button type="button" variant="outline" onClick={() => { setIsEditing(false); initEditForm(); }}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      ) : (
        /* Venue Header Card */
        <div className="rounded-2xl border border-border/50 bg-card overflow-hidden animate-fade-in-up">
          <div className={`h-3 ${
            venue.type === "restaurant" ? "bg-gradient-to-r from-primary to-primary/70"
              : venue.type === "cafe" ? "bg-gradient-to-r from-amber-500 to-amber-400"
              : venue.type === "shop" ? "bg-gradient-to-r from-purple-500 to-purple-400"
              : "bg-gradient-to-r from-sky-500 to-sky-400"
          }`} />

          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{config.emoji}</span>
                  <h1 className="font-display text-2xl sm:text-3xl font-semibold text-card-foreground">{venue.name}</h1>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <VenueBadge type={venue.type} />
                  {venue.address && (
                    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPinIcon className="w-4 h-4" />
                      {venue.address}
                    </span>
                  )}
                </div>

                {reviewCount > 0 && (
                  <div className="flex items-center gap-2">
                    <StarRating rating={Math.round(averageRating)} />
                    <span className="text-sm text-muted-foreground">
                      {averageRating.toFixed(1)} ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 shrink-0">
                {user && (
                  <Button
                    variant="outline"
                    onClick={handleToggleFavorite}
                    disabled={togglingFavorite}
                    className={`group ${isFavorite ? "text-rose-500 hover:text-rose-600 border-rose-200 hover:border-rose-300 hover:bg-rose-50" : ""}`}
                  >
                    <HeartIcon className={`w-4 h-4 mr-2 transition-transform group-hover:scale-110 ${isFavorite ? "text-rose-500" : ""}`} filled={isFavorite ?? false} />
                    {isFavorite ? "Saved" : "Save"}
                  </Button>
                )}
                {canEdit && (
                  <Button variant="outline" onClick={() => { initEditForm(); setIsEditing(true); }} className="group">
                    <PenIcon className="w-4 h-4 mr-2 transition-transform group-hover:rotate-12" />
                    Edit
                  </Button>
                )}
                {isAdmin && (
                  <Button
                    variant="outline"
                    onClick={handleDeleteVenue}
                    disabled={deletingVenue}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/50"
                  >
                    <TrashIcon className="w-4 h-4 mr-2" />
                    {deletingVenue ? "Deleting..." : "Delete"}
                  </Button>
                )}
              </div>
            </div>

            {venue.description && (
              <p className="mt-6 text-muted-foreground leading-relaxed border-t border-border/50 pt-6">{venue.description}</p>
            )}

            {/* Photos */}
            <div className="mt-6 pt-6 border-t border-border/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <span>📸</span> Photos
                </h3>
                {canCreateContent && !showPhotoUpload && (
                  <Button onClick={() => setShowPhotoUpload(true)} variant="outline" size="sm" className="group">
                    <CameraIcon className="w-4 h-4 mr-2 transition-transform group-hover:scale-110" />
                    Add Photo
                  </Button>
                )}
              </div>

              {showPhotoUpload && venueId && (
                <PhotoUpload venueId={venueId} onUploadComplete={handlePhotoUploadComplete} onCancel={() => setShowPhotoUpload(false)} />
              )}

              {venueId && (
                <PhotoGallery
                  venueId={venueId}
                  photos={photos ?? []}
                  canDelete={!!user}
                  currentUserId={user?._id}
                  userRole={user?.role}
                  venueCreatorId={venue?.createdBy}
                  mainPhotoId={venue?.mainPhotoId}
                  onMainPhotoChange={handleMainPhotoChange}
                />
              )}
            </div>

            {venue.website && (
              <a href={venue.website} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors group">
                <ExternalLinkIcon className="w-4 h-4" />
                <span className="group-hover:underline">Visit website</span>
              </a>
            )}

            {venue.latitude && venue.longitude && (
              <div className="mt-6 h-56 map-container rounded-xl overflow-hidden">
                <Map
                  initialViewState={{
                    latitude: venue.latitude,
                    longitude: venue.longitude,
                    zoom: 17,
                  }}
                  style={{ width: "100%", height: "100%" }}
                  mapStyle="mapbox://styles/mapbox/streets-v12"
                  mapboxAccessToken={MAPBOX_TOKEN}
                  scrollZoom={false}
                >
                  <NavigationControl position="top-right" />
                  <VenueMarker latitude={venue.latitude} longitude={venue.longitude} />
                </Map>
              </div>
            )}

            {/* Attribution info */}
            {venueData?.creator && (
              <div className="mt-6 pt-4 border-t border-border/50 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[10px]">{venueData.creator.name?.[0] ?? "?"}</AvatarFallback>
                  </Avatar>
                  <span>
                    Added by <span className="text-foreground font-medium">{venueData.creator.name ?? venueData.creator.email}</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reviews Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 market-divider flex-1">
            <span className="text-xl">💬</span>
            <h2 className="font-display text-xl font-semibold whitespace-nowrap">Reviews</h2>
          </div>
          {canCreateContent && !showReviewForm && !isEditing && (
            <Button onClick={() => setShowReviewForm(true)} className="shadow-glow ml-4 group">
              <PenIcon className="w-4 h-4 mr-2 transition-transform group-hover:rotate-12" />
              Write a Review
            </Button>
          )}
        </div>

        {/* Review Form */}
        {showReviewForm && (
          <div className="rounded-2xl border border-primary/30 bg-card p-6 animate-scale-in">
            <h3 className="font-display text-lg font-semibold mb-4">Share Your Experience</h3>
            <form onSubmit={handleSubmitReview} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Rating</label>
                <InteractiveStarRating rating={reviewRating} onChange={setReviewRating} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Your Review</label>
                <textarea
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                  placeholder="Tell others what made this place special..."
                  className="w-full min-h-[120px] px-4 py-3 rounded-xl border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-shadow"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? "Submitting..." : "Post Review"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowReviewForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Reviews List */}
        {!reviews || reviews.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
              <span className="text-2xl">✨</span>
            </div>
            <p className="text-muted-foreground font-medium">No reviews yet for this venue</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              {canCreateContent ? "Be the first to share your experience!" : user ? "Your account needs to be upgraded to write reviews." : "Sign in to write a review."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review, index) => (
              <div
                key={review._id}
                className="rounded-xl border border-border/50 bg-card p-5 card-hover animate-fade-in-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {editingReviewId === review._id ? (
                  /* Edit Review Form */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-card-foreground">Edit Review</h3>
                      <Button variant="ghost" size="sm" onClick={handleCancelEditReview} className="h-8 w-8 p-0">
                        <span className="sr-only">Cancel</span>
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Rating</label>
                      <InteractiveStarRating rating={editReviewForm.rating} onChange={(r) => setEditReviewForm({ ...editReviewForm, rating: r })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Review</label>
                      <textarea
                        value={editReviewForm.content}
                        onChange={(e) => setEditReviewForm({ ...editReviewForm, content: e.target.value })}
                        placeholder="Tell others about your experience..."
                        className="w-full min-h-[100px] px-4 py-3 rounded-xl border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-shadow"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button onClick={() => handleSaveReview(review._id)} disabled={savingReview} className="flex-1">
                        {savingReview ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button variant="outline" onClick={handleCancelEditReview}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  /* Review Display */
                  <>
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={review.author.avatarUrl ?? undefined} />
                          <AvatarFallback className="text-xs">{review.author.name?.[0] ?? review.author.email[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-card-foreground">Review</h3>
                          <div className="text-xs text-muted-foreground">
                            {review.author.name ?? review.author.email} &middot;{" "}
                            {new Date(review.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StarRating rating={review.rating} />
                        {user && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setReviewPhotoUploadId(review._id)}
                            className="h-8 w-8 p-0"
                            title="Add photo to review"
                          >
                            <CameraIcon className="w-4 h-4" />
                          </Button>
                        )}
                        {review.canEdit && (
                          <Button variant="ghost" size="sm" onClick={() => handleStartEditReview(review)} className="h-8 w-8 p-0" title="Edit review">
                            <PenIcon className="w-4 h-4" />
                          </Button>
                        )}
                        {review.canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteReview(review._id)}
                            disabled={deletingReviewId === review._id}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                            title="Delete review"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {review.content && <p className="text-muted-foreground leading-relaxed">{review.content}</p>}

                    {/* Review Photos */}
                    {(() => {
                      const reviewPhotos = (photos ?? []).filter(p => p.reviewId === review._id);
                      if (reviewPhotos.length === 0) return null;
                      return (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {reviewPhotos.map((photo) => {
                            // Always use storageKey for ImageKit transforms
                            const photoUrl = getImageUrl(
                              photo.storageKey,
                              "w-160,h-160,fo-auto,q-80"
                            );
                            return (
                              <div key={photo._id} className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted">
                                <img
                                  src={photoUrl}
                                  alt={photo.caption || "Review photo"}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}

                    {/* Photo Upload for this Review */}
                    {reviewPhotoUploadId === review._id && venueId && (
                      <div className="mt-4">
                        <PhotoUpload
                          venueId={venueId}
                          reviewId={review._id}
                          onUploadComplete={() => setReviewPhotoUploadId(null)}
                          onCancel={() => setReviewPhotoUploadId(null)}
                          compact
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
