const IMAGEKIT_URL = "https://ik.imagekit.io/d3vzx2z6w/reviews";

/**
 * Generate an ImageKit URL with optional transforms.
 *
 * @param storageKey - The R2 storage key (e.g., "photos/v001/abc.jpg")
 * @param transforms - Optional ImageKit transform string (e.g., "w-400,h-300,fo-auto")
 * @returns The full ImageKit URL
 *
 * @example
 * imageKitUrl("photos/v001/abc.jpg", "w-200,h-200,fo-auto,q-80")
 * // => "https://ik.imagekit.io/d3vzx2z6w/reviews/photos/v001/abc.jpg?tr=w-200,h-200,fo-auto,q-80"
 */
export function imageKitUrl(storageKey: string, transforms?: string): string {
  const tr = transforms ? `?tr=${transforms}` : "";
  return `${IMAGEKIT_URL}/${storageKey}${tr}`;
}

/**
 * Common transform presets for venue photos.
 */
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
