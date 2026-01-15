import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { getImageUrl, ImageKitTransforms } from "../lib/imagekit";

interface Photo {
  _id: string;
  reviewId?: string;
  storageKey: string;
  url: string | null;
  caption?: string;
  createdAt: number;
  uploader: {
    _id: string;
    name?: string;
    email: string;
  };
  canDelete: boolean;
}

function XIcon({ className }: { className?: string }) {
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
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
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
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
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
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
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
      <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
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
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export type PhotoGridSize = "small" | "medium" | "large";

interface PhotoGridProps {
  photos: Photo[];
  size?: PhotoGridSize;
  canDelete?: (photo: Photo) => boolean;
  onDelete?: (photoId: string) => Promise<void>;
  canSetMain?: (photo: Photo) => boolean;
  onSetMain?: (photoId: string) => Promise<void>;
  mainPhotoId?: string | null;
  emptyMessage?: string;
  showUserInfo?: boolean;
}

const sizeConfig = {
  small: {
    grid: "flex flex-wrap gap-2",
    thumbnail: "w-[100px] h-[100px]",
    transform: "w-100,h-100,fo-auto,q-80",
  },
  medium: {
    grid: "grid grid-cols-2 sm:grid-cols-3 gap-3",
    thumbnail: "aspect-square",
    transform: ImageKitTransforms.galleryThumb,
  },
  large: {
    grid: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3",
    thumbnail: "aspect-square",
    transform: ImageKitTransforms.galleryThumb,
  },
};

// Helper to get photo URL via ImageKit (R2 storage)
function getPhotoUrl(photo: Photo, transform?: string): string {
  // Always use storageKey for ImageKit transforms
  return getImageUrl(photo.storageKey, transform);
}

export function PhotoGrid({
  photos,
  size = "large",
  canDelete,
  onDelete,
  canSetMain,
  onSetMain,
  mainPhotoId,
  emptyMessage,
  showUserInfo = true,
}: PhotoGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [settingMain, setSettingMain] = useState<string | null>(null);

  const config = sizeConfig[size];

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightboxIndex(null);
      } else if (e.key === "ArrowLeft" && lightboxIndex > 0) {
        setLightboxIndex(lightboxIndex - 1);
      } else if (e.key === "ArrowRight" && lightboxIndex < photos.length - 1) {
        setLightboxIndex(lightboxIndex + 1);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [lightboxIndex, photos.length]);

  const handleDelete = async (photoId: string) => {
    if (!onDelete) return;
    if (!confirm("Delete this photo? This cannot be undone.")) return;

    setDeleting(photoId);
    try {
      await onDelete(photoId);
      // Close lightbox if we deleted the current photo
      if (lightboxIndex !== null) {
        const deletedIndex = photos.findIndex((p) => p._id === photoId);
        if (deletedIndex === lightboxIndex) {
          setLightboxIndex(null);
        } else if (deletedIndex < lightboxIndex) {
          setLightboxIndex(lightboxIndex - 1);
        }
      }
    } finally {
      setDeleting(null);
    }
  };

  const handleSetMain = async (photoId: string) => {
    if (!onSetMain) return;
    setSettingMain(photoId);
    try {
      await onSetMain(photoId);
    } finally {
      setSettingMain(null);
    }
  };

  if (photos.length === 0 && emptyMessage) {
    return (
      <div className="rounded-xl border-2 border-dashed border-border bg-card/30 p-8 text-center">
        <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-secondary flex items-center justify-center">
          <span className="text-2xl">📷</span>
        </div>
        <p className="text-muted-foreground text-sm">{emptyMessage}</p>
      </div>
    );
  }

  if (photos.length === 0) {
    return null;
  }

  const currentPhoto = lightboxIndex !== null ? photos[lightboxIndex] : null;

  return (
    <>
      {/* Photo Grid */}
      <div className={config.grid}>
        {photos.map((photo, index) => (
          <button
            key={photo._id}
            onClick={() => setLightboxIndex(index)}
            className={`group relative ${config.thumbnail} rounded-xl overflow-hidden bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
          >
            <img
              src={getPhotoUrl(photo, config.transform)}
              alt={photo.caption || "Photo"}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            {/* Photo info on hover */}
            {showUserInfo && photo.uploader && size !== "small" && (
              <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6 border-2 border-white/30">
                    <AvatarFallback className="text-[10px] bg-primary/80 text-white">
                      {photo.uploader.name?.[0] ?? photo.uploader.email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-white font-medium truncate">
                    {photo.uploader.name ?? photo.uploader.email}
                  </span>
                </div>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox - rendered in portal to avoid clipping by parent containers */}
      {lightboxIndex !== null && currentPhoto && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm flex items-center justify-center animate-fade-in"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
          >
            <XIcon className="w-6 h-6" />
          </button>

          {/* Navigation arrows */}
          {lightboxIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(lightboxIndex - 1);
              }}
              className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </button>
          )}
          {lightboxIndex < photos.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(lightboxIndex + 1);
              }}
              className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <ChevronRightIcon className="w-6 h-6" />
            </button>
          )}

          {/* Main image */}
          <div
            className="max-w-5xl max-h-[85vh] w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={getPhotoUrl(currentPhoto, ImageKitTransforms.fullSize)}
              alt={currentPhoto.caption || "Photo"}
              className="w-full h-full object-contain rounded-lg"
            />

            {/* Photo metadata bar */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {currentPhoto.uploader && (
                  <>
                    <Avatar className="h-8 w-8 border-2 border-white/30">
                      <AvatarFallback className="text-xs bg-primary/80 text-white">
                        {currentPhoto.uploader.name?.[0] ?? currentPhoto.uploader.email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-white font-medium text-sm">
                        {currentPhoto.uploader.name ?? currentPhoto.uploader.email}
                      </p>
                      <p className="text-white/60 text-xs">
                        {new Date(currentPhoto.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-3">
                {currentPhoto.caption && (
                  <p className="text-white/80 text-sm italic max-w-xs truncate">
                    "{currentPhoto.caption}"
                  </p>
                )}
                <span className="text-white/40 text-sm">
                  {lightboxIndex + 1} / {photos.length}
                </span>
                {canSetMain?.(currentPhoto) && onSetMain && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSetMain(currentPhoto._id)}
                    disabled={settingMain === currentPhoto._id || mainPhotoId === currentPhoto._id}
                    className={mainPhotoId === currentPhoto._id
                      ? "text-amber-400 hover:bg-amber-500/20"
                      : "text-white/70 hover:text-amber-400 hover:bg-amber-500/20"}
                  >
                    <StarIcon className={`w-4 h-4 mr-1 ${mainPhotoId === currentPhoto._id ? "fill-amber-400" : ""}`} />
                    {settingMain === currentPhoto._id
                      ? "Setting..."
                      : mainPhotoId === currentPhoto._id
                        ? "Main Photo"
                        : "Set as Main"}
                  </Button>
                )}
                {canDelete?.(currentPhoto) && onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(currentPhoto._id)}
                    disabled={deleting === currentPhoto._id}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                  >
                    <TrashIcon className="w-4 h-4 mr-1" />
                    {deleting === currentPhoto._id ? "Deleting..." : "Delete"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
