import { useAuth as useWorkOSAuth } from "@workos-inc/authkit-react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

// Re-export user type for compatibility
export type { Doc } from "../../../convex/_generated/dataModel";

export function useAuth() {
  const { isAuthenticated, isLoading: convexLoading } = useConvexAuth();
  const { user: workosUser, signIn, signOut, isLoading: authKitLoading } = useWorkOSAuth();

  // Get our user record from Convex
  const convexUser = useQuery(api.users.getCurrentUser);

  // Loading is true while either auth system is loading, or while we're fetching the user
  const loading = convexLoading || authKitLoading || (isAuthenticated && convexUser === undefined);

  return {
    user: convexUser ?? null,
    workosUser,
    loading,
    isAuthenticated,
    signIn,
    signOut,
  };
}

// For backwards compatibility - components can check if user has minimum role
export function hasMinRole(userRole: string | undefined, minRole: string): boolean {
  const roleHierarchy: Record<string, number> = {
    viewer: 0,
    user: 1,
    editor: 2,
    admin: 3,
  };

  if (!userRole) return false;
  return (roleHierarchy[userRole] ?? 0) >= (roleHierarchy[minRole] ?? 0);
}
