import { useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { PhotoGrid } from "./PhotoGrid";

interface Photo {
  _id: Id<"photos">;
  _creationTime: number;
  venueId: Id<"venues">;
  reviewId?: Id<"reviews">;
  userId: Id<"users">;
  storageId?: Id<"_storage">;
  storageKey: string;
  originalFilename?: string;
  caption?: string;
  createdAt: number;
  url: string | null;
  uploader: {
    _id: Id<"users">;
    name?: string;
    email: string;
  };
  canDelete: boolean;
}

interface PhotoGalleryProps {
  venueId: Id<"venues">;
  photos: Photo[];
  canDelete?: boolean;
  currentUserId?: Id<"users">;
  userRole?: string;
  venueCreatorId?: Id<"users"> | null;
  mainPhotoId?: Id<"photos"> | null;
  onMainPhotoChange?: () => void;
}

export function PhotoGallery({
  venueId,
  photos,
  canDelete = false,
  currentUserId,
  userRole,
  venueCreatorId,
  mainPhotoId,
  onMainPhotoChange,
}: PhotoGalleryProps) {
  const deletePhoto = useMutation(api.photos.remove);
  const setMainPhoto = useMutation(api.venues.setMainPhoto);

  const canDeletePhoto = useCallback(
    (photo: Photo) => {
      // Use the canDelete flag from the server if available
      if (photo.canDelete) return true;
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
    async (photoId: Id<"photos">) => {
      await deletePhoto({ id: photoId });
    },
    [deletePhoto]
  );

  const canSetMainPhoto = useCallback(
    (_photo: Photo) => {
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
    async (photoId: Id<"photos">) => {
      await setMainPhoto({ venueId, photoId });
      onMainPhotoChange?.();
    },
    [venueId, setMainPhoto, onMainPhotoChange]
  );

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
