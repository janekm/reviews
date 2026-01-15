import { Link, Outlet, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useAuth } from "../hooks/useAuth";

export function Layout() {
  const { user, loading, signOut } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="container flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="group flex items-center gap-2.5 transition-opacity duration-200 hover:opacity-70"
          >
            <span className="font-display text-xl text-foreground">
              Spitalfields
            </span>
            <span className="text-[10px] font-medium text-muted-foreground tracking-widest uppercase mt-0.5">
              Reviews
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            <Link to="/">
              <Button
                variant={location.pathname === "/" ? "secondary" : "ghost"}
                size="sm"
                className="text-sm"
              >
                Explore
              </Button>
            </Link>

            {user && (user.role === "editor" || user.role === "admin") && (
              <Link to="/admin">
                <Button
                  variant={location.pathname === "/admin" ? "secondary" : "ghost"}
                  size="sm"
                  className="text-sm"
                >
                  Admin
                </Button>
              </Link>
            )}

            {loading ? (
              <div className="w-20 h-8 skeleton rounded ml-2" />
            ) : user ? (
              <div className="flex items-center gap-2 ml-3 pl-3 border-l border-border">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={user.avatarUrl ?? undefined} />
                  <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
                    {user.name?.[0] ?? user.email?.[0]?.toUpperCase() ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm hidden sm:block max-w-28 truncate text-muted-foreground">
                  {user.name ?? user.email ?? "User"}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut()}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Sign out
                </Button>
              </div>
            ) : (
              <Link to="/login" className="ml-2">
                <Button size="sm">Sign in</Button>
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container py-10">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-auto">
        <div className="container">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <span>Discover the best of East London</span>
            <span className="text-xs">Spitalfields Reviews</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
