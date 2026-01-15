const IMAGEKIT_URL = "https://ik.imagekit.io/d3vzx2z6w";

/**
 * Generate an ImageKit URL for R2 storage with optional transforms.
 */
export function imageKitUrl(storageKey: string, transforms?: string): string {
  const tr = transforms ? `?tr=${transforms}` : "";
  return `${IMAGEKIT_URL}/${storageKey}${tr}`;
}

/**
 * Get the optimized image URL via ImageKit.
 * All photos should use R2 storage keys for ImageKit transforms.
 */
export function getImageUrl(storageKey: string, transforms?: string): string {
  return imageKitUrl(storageKey, transforms);
}

export const ImageKitTransforms = {
  /** Small square thumbnail (96x96) */
  thumbnailSmall: "w-96,h-96,fo-auto,q-80",
  /** Medium square thumbnail (200x200) */
  thumbnailMedium: "w-200,h-200,fo-auto,q-80",
  /** Venue list card thumbnail (tall, for full-height cards) */
  venueListCard: "w-224,h-280,fo-auto,q-85",
  /** Card thumbnail (400x400) */
  cardThumbnail: "w-400,h-400,fo-auto,q-80",
  /** Map popup image */
  mapPopup: "w-250,h-140,fo-auto,q-80",
  /** Gallery grid thumbnail */
  galleryThumb: "w-400,h-400,fo-auto,q-80",
  /** Full size with quality optimization */
  fullSize: "w-1200,q-90",
} as const;
