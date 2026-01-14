export type VenueType = "restaurant" | "cafe" | "shop" | "bar";

export type UserRole = "viewer" | "user" | "editor" | "admin";

export interface Venue {
  id: string;
  name: string;
  type: VenueType;
  address: string | null;
  description: string | null;
  website: string | null;
  latitude: number | null;
  longitude: number | null;
  creatorId: string | null;
  mainPhotoId: string | null;
  createdAt: number;
  updatedAt: number | null;
  updatedById: string | null;
  photoStorageKey: string | null;
  reviewCount?: number;
  avgRating?: number | null;
}

export interface UserSummary {
  id: string;
  name: string | null;
  avatarUrl: string | null;
}

export interface VenueWithUsers extends Venue {
  creator: UserSummary | null;
  updatedBy: UserSummary | null;
}

export interface ReviewWithUser extends Review {
  user: UserSummary | null;
  photos?: PhotoWithUser[];
}

export interface Review {
  id: string;
  venueId: string;
  userId: string;
  rating: number;
  title: string | null;
  content: string | null;
  createdAt: number;
  updatedAt: number | null;
}

export interface User {
  id: string;
  workosId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: UserRole;
  createdAt: number;
}

export interface Photo {
  id: string;
  venueId: string;
  reviewId: string | null;
  userId: string;
  storageKey: string;
  originalFilename: string | null;
  caption: string | null;
  width: number | null;
  height: number | null;
  sizeBytes: number | null;
  createdAt: number;
}

export interface PhotoWithUser extends Photo {
  user: UserSummary | null;
}

export interface Favorite {
  id: string;
  userId: string;
  venueId: string;
  createdAt: number;
}
