import { Button } from "../components/ui/button";

function MapPinIcon({ className }: { className?: string }) {
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
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
    </svg>
  );
}

export function LoginPage() {
  const handleLogin = () => {
    window.location.href = "/api/auth/login";
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-md animate-fade-in-up">
        {/* Card */}
        <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-warm">
          {/* Header with gradient */}
          <div className="gradient-hero p-8 text-center border-b border-border/30">
            {/* Logo */}
            <div className="relative inline-block mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-glow mx-auto">
                <MapPinIcon className="w-8 h-8 text-primary-foreground" />
              </div>
              <SparkleIcon className="absolute -top-1 -right-1 w-4 h-4 text-accent animate-pulse-soft" />
            </div>

            <h1 className="font-display text-2xl font-semibold mb-2">
              Welcome to Spitalfields
            </h1>
            <p className="text-muted-foreground">
              Sign in to discover and share local gems
            </p>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
            {/* Feature highlights */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { emoji: "🍽️", label: "Find restaurants" },
                { emoji: "☕", label: "Discover cafes" },
                { emoji: "🛍️", label: "Explore shops" },
                { emoji: "🍸", label: "Locate bars" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50 text-sm"
                >
                  <span>{item.emoji}</span>
                  <span className="text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>

            {/* Sign in button */}
            <Button
              className="w-full shadow-glow group h-12 text-base"
              onClick={handleLogin}
            >
              <span className="mr-2 transition-transform group-hover:scale-110">
                ✨
              </span>
              Sign in to get started
            </Button>

            {/* Footer note */}
            <p className="text-center text-xs text-muted-foreground/70">
              Secure authentication powered by WorkOS
            </p>
          </div>
        </div>

        {/* Bottom tagline */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Join the community discovering the best of East London
        </p>
      </div>
    </div>
  );
}
