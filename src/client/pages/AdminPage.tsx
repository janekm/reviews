import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";

type UserRole = "viewer" | "user" | "editor" | "admin";

function ShieldIcon({ className }: { className?: string }) {
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
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
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
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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

const ROLE_LABELS: Record<UserRole, string> = {
  viewer: "Viewer",
  user: "User",
  editor: "Editor",
  admin: "Admin",
};

const ROLE_COLORS: Record<UserRole, string> = {
  viewer: "bg-muted text-muted-foreground",
  user: "bg-secondary text-secondary-foreground",
  editor: "bg-accent/20 text-accent-foreground border border-accent/30",
  admin: "bg-primary/20 text-primary border border-primary/30",
};

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  viewer: "Can browse venues and reviews",
  user: "Can create venues and reviews",
  editor: "Can edit all content and manage users",
  admin: "Full access to all features",
};

export function AdminPage() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const users = useQuery(api.users.list);
  const updateRoleMutation = useMutation(api.users.updateRole);

  const canAccess =
    currentUser && (currentUser.role === "editor" || currentUser.role === "admin");

  // Redirect if not authorized
  if (!authLoading && !canAccess) {
    navigate("/");
    return null;
  }

  async function updateRole(userId: Id<"users">, newRole: UserRole) {
    try {
      await updateRoleMutation({ userId, role: newRole });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    }
  }

  const isAdmin = currentUser?.role === "admin";
  const loading = users === undefined;

  const availableRoles: UserRole[] =
    currentUser?.role === "admin"
      ? ["viewer", "user", "editor", "admin"]
      : ["viewer", "user", "editor"];

  if (authLoading || loading) {
    return (
      <div className="animate-fade-in">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="h-12 w-64 skeleton rounded-lg" />
          <div className="card p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-12 h-12 skeleton rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 skeleton rounded" />
                  <div className="h-3 w-32 skeleton rounded" />
                </div>
                <div className="h-10 w-28 skeleton rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!canAccess) {
    return null;
  }

  return (
    <div className="animate-fade-in">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
            <ShieldIcon className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              User Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage user roles and permissions for Spitalfields Reviews
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(["viewer", "user", "editor", "admin"] as UserRole[]).map((role) => {
            const count = (users ?? []).filter((u) => u.role === role).length;
            return (
              <div
                key={role}
                className="card p-4 text-center hover:scale-[1.02] transition-transform"
              >
                <div className="text-2xl font-bold text-foreground">{count}</div>
                <div className="text-sm text-muted-foreground capitalize">
                  {role}s
                </div>
              </div>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive">
            {error}
            <Button
              variant="ghost"
              size="sm"
              className="ml-2"
              onClick={() => setError(null)}
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* User List */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-border/50 bg-muted/30">
            <div className="flex items-center gap-2">
              <UsersIcon className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-foreground">
                All Users ({users?.length ?? 0})
              </h2>
            </div>
          </div>

          <div className="divide-y divide-border/50">
            {(users ?? []).map((user) => {
              const isCurrentUser = user._id === currentUser?._id;

              return (
                <div
                  key={user._id}
                  className={`p-4 flex items-center gap-4 transition-colors ${
                    isCurrentUser ? "bg-primary/5" : "hover:bg-muted/30"
                  }`}
                >
                  {/* Avatar */}
                  <Avatar className="h-12 w-12 ring-2 ring-border">
                    <AvatarImage src={user.avatarUrl ?? undefined} />
                    <AvatarFallback className="bg-secondary text-secondary-foreground font-medium text-lg">
                      {user.name?.[0] ?? user.email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground truncate">
                        {user.name ?? user.email}
                      </span>
                      {isCurrentUser && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      {user.email}
                    </div>
                    <div className="text-xs text-muted-foreground/70 mt-0.5">
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Role Badge & Selector */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium ${ROLE_COLORS[user.role]}`}
                      title={ROLE_DESCRIPTIONS[user.role]}
                    >
                      {ROLE_LABELS[user.role]}
                    </div>

                    {!isCurrentUser && isAdmin && (
                      <select
                        value={user.role}
                        onChange={(e) =>
                          updateRole(user._id, e.target.value as UserRole)
                        }
                        className="px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 cursor-pointer"
                        title="Change role"
                      >
                        {availableRoles.map((role) => (
                          <option key={role} value={role}>
                            {ROLE_LABELS[role]}
                          </option>
                        ))}
                      </select>
                    )}

                    {isCurrentUser && (
                      <span className="text-xs text-muted-foreground italic">
                        Cannot change own role
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Role Legend */}
        <div className="card p-6">
          <h3 className="font-semibold text-foreground mb-4">Role Permissions</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {(["viewer", "user", "editor", "admin"] as UserRole[]).map((role) => (
              <div key={role} className="flex items-start gap-3">
                <div
                  className={`px-2.5 py-1 rounded-md text-xs font-medium shrink-0 ${ROLE_COLORS[role]}`}
                >
                  {ROLE_LABELS[role]}
                </div>
                <span className="text-sm text-muted-foreground">
                  {ROLE_DESCRIPTIONS[role]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
