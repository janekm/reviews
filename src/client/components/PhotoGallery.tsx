import { useState, useEffect, useCallback } from "react";
import { PhotoGrid } from "./PhotoGrid";
import type { PhotoWithUser } from "../../shared/types";

interface PhotoGalleryProps {
  venueId: string;
  canDelete?: boolean;
  currentUserId?: string;
  userRole?: string;
  venueCreatorId?: string | null;
  mainPhotoId?: string | null;
  onMainPhotoChange?: () => void;
}

export function PhotoGallery({
  venueId,
  canDelete = false,
  currentUserId,
  userRole,
  venueCreatorId,
  mainPhotoId,
  onMainPhotoChange,
}: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<PhotoWithUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/photos/venues/${venueId}`)
      .then((res) => res.json() as Promise<PhotoWithUser[]>)
      .then((data) => {
        setPhotos(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [venueId]);

  const canDeletePhoto = useCallback(
    (photo: PhotoWithUser) => {
      if (!canDelete || !currentUserId) return false;
      // Photo owner can delete
      if (photo.userId === currentUserId) return true;
      // Venue creator can delete
      if (venueCreatorId && venueCreatorId === currentUserId) return true;
      // Editors and admins can delete
      if (userRole === "editor" || userRole === "admin") return true;
      return false;
    },
    [canDelete, currentUserId, venueCreatorId, userRole]
  );

  const handleDelete = useCallback(
    async (photoId: string) => {
      const res = await fetch(`/api/photos/${photoId}`, { method: "DELETE" });
      if (res.ok) {
        setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      }
    },
    []
  );

  const canSetMainPhoto = useCallback(
    (_photo: PhotoWithUser) => {
      if (!currentUserId) return false;
      // Venue creator can set main photo
      if (venueCreatorId && venueCreatorId === currentUserId) return true;
      // Editors and admins can set main photo
      if (userRole === "editor" || userRole === "admin") return true;
      return false;
    },
    [currentUserId, venueCreatorId, userRole]
  );

  const handleSetMain = useCallback(
    async (photoId: string) => {
      const res = await fetch(`/api/venues/${venueId}/main-photo`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId }),
      });
      if (res.ok) {
        onMainPhotoChange?.();
      }
    },
    [venueId, onMainPhotoChange]
  );

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="aspect-square skeleton rounded-xl"
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
    );
  }

  return (
    <PhotoGrid
      photos={photos}
      size="large"
      canDelete={canDeletePhoto}
      onDelete={handleDelete}
      canSetMain={canSetMainPhoto}
      onSetMain={handleSetMain}
      mainPhotoId={mainPhotoId}
      emptyMessage="No photos yet. Be the first to share a photo of this place!"
    />
  );
}
