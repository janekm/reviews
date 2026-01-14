import { useState, useRef, useCallback } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

function UploadCloudIcon({ className }: { className?: string }) {
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
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <path d="M12 12v9" />
      <path d="m16 16-4-4-4 4" />
    </svg>
  );
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

function ImageIcon({ className }: { className?: string }) {
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
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}

interface PhotoUploadProps {
  venueId: string;
  reviewId?: string;
  onUploadComplete: () => void;
  onCancel: () => void;
  compact?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function PhotoUpload({ venueId, reviewId, onUploadComplete, onCancel, compact }: PhotoUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (f: File): string | null => {
    if (!ALLOWED_TYPES.includes(f.type)) {
      return "Please select a JPEG, PNG, WebP, or GIF image.";
    }
    if (f.size > MAX_FILE_SIZE) {
      return "File is too large. Maximum size is 10MB.";
    }
    return null;
  };

  const handleFileSelect = useCallback((f: File) => {
    const validationError = validateFile(f);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setFile(f);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFileSelect(droppedFile);
      }
    },
    [handleFileSelect]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (caption.trim()) {
        formData.append("caption", caption.trim());
      }

      // Simulate progress for UX (actual XHR would use onprogress)
      const progressInterval = setInterval(() => {
        setUploadProgress((p) => Math.min(p + 10, 90));
      }, 200);

      const uploadUrl = reviewId
        ? `/api/photos/reviews/${reviewId}`
        : `/api/photos/venues/${venueId}`;
      const res = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error || "Upload failed");
      }

      setUploadProgress(100);

      // Brief delay to show completion
      setTimeout(() => {
        onUploadComplete();
      }, 300);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
      setUploading(false);
    }
  };

  return (
    <div className={`rounded-2xl border border-primary/30 bg-card ${compact ? "p-4" : "p-6"} animate-scale-in`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`font-display ${compact ? "text-base" : "text-lg"} font-semibold flex items-center gap-2`}>
          <ImageIcon className={`${compact ? "w-4 h-4" : "w-5 h-5"} text-primary`} />
          {reviewId ? "Add Photo to Review" : "Add a Photo"}
        </h3>
        <button
          onClick={onCancel}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
        >
          <XIcon className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {!file ? (
        /* Drop zone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center
            transition-all duration-300 group
            ${
              isDragging
                ? "border-primary bg-primary/5 scale-[1.02]"
                : "border-border hover:border-primary/50 hover:bg-muted/30"
            }
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ALLOWED_TYPES.join(",")}
            onChange={handleInputChange}
            className="hidden"
          />

          <div
            className={`
              w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center
              transition-all duration-300
              ${isDragging ? "bg-primary/20 scale-110" : "bg-secondary group-hover:bg-primary/10"}
            `}
          >
            <UploadCloudIcon
              className={`w-8 h-8 transition-colors duration-300 ${
                isDragging ? "text-primary" : "text-muted-foreground group-hover:text-primary"
              }`}
            />
          </div>

          <p className="font-medium text-foreground mb-1">
            {isDragging ? "Drop your photo here" : "Drag & drop a photo"}
          </p>
          <p className="text-sm text-muted-foreground">
            or <span className="text-primary font-medium">click to browse</span>
          </p>
          <p className="text-xs text-muted-foreground/70 mt-3">
            JPEG, PNG, WebP, or GIF up to 10MB
          </p>
        </div>
      ) : (
        /* Preview */
        <div className="space-y-4">
          <div className="relative rounded-xl overflow-hidden bg-muted aspect-video">
            <img
              src={preview!}
              alt="Preview"
              className="w-full h-full object-contain"
            />
            {!uploading && (
              <button
                onClick={clearFile}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
              >
                <XIcon className="w-4 h-4" />
              </button>
            )}

            {/* Upload progress overlay */}
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                <div className="w-48 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-white text-sm mt-3 font-medium">
                  {uploadProgress < 100 ? "Uploading..." : "Complete!"}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <ImageIcon className="w-4 h-4 shrink-0" />
            <span className="truncate">{file.name}</span>
            <span className="shrink-0">
              ({(file.size / 1024 / 1024).toFixed(1)} MB)
            </span>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Caption (optional)</label>
            <Input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption to describe this photo..."
              disabled={uploading}
              maxLength={200}
              className="bg-background"
            />
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3 mt-6 pt-4 border-t border-border/50">
        <Button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="flex-1"
        >
          {uploading ? "Uploading..." : "Upload Photo"}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={uploading}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
