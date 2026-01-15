import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@workos-inc/authkit-react";
import { useConvexAuth, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function CallbackPage() {
  const { isLoading: authKitLoading, user: workosUser, getAccessToken } = useAuth();
  const { isAuthenticated: convexAuthenticated, isLoading: convexLoading } = useConvexAuth();
  const getOrCreateUser = useAction(api.users.getOrCreateCurrentUser);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [userCreated, setUserCreated] = useState(false);

  const addDebug = (msg: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toISOString().slice(11, 19)}: ${msg}`]);
  };

  useEffect(() => {
    // Log initial state
    const urlCode = searchParams.get("code");
    const urlError = searchParams.get("error");
    addDebug(`URL has code: ${!!urlCode}, error: ${urlError || "none"}`);
    addDebug(`AuthKit loading: ${authKitLoading}, user: ${workosUser ? workosUser.email : "null"}`);
    addDebug(`Convex loading: ${convexLoading}, authenticated: ${convexAuthenticated}`);

    if (urlError) {
      setError(`OAuth error: ${urlError}. ${searchParams.get("error_description") || ""}`);
      return;
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      addDebug(`Check: authKit=${!authKitLoading}, convex=${!convexLoading}, user=${!!workosUser}`);

      // Wait for AuthKit to finish loading
      if (authKitLoading) return;

      if (workosUser) {
        addDebug(`WorkOS user authenticated: ${workosUser.email}`);

        // Get the token to see what we're sending to Convex
        try {
          const token = await getAccessToken();
          if (token) {
            // Decode JWT payload to see issuer
            const payload = JSON.parse(atob(token.split('.')[1]));
            addDebug(`Token issuer: ${payload.iss}`);
            addDebug(`Token aud: ${payload.aud}`);
            addDebug(`Token sub: ${payload.sub}`);
          }
        } catch (e) {
          addDebug(`Token decode error: ${e}`);
        }

        // Wait for Convex to also authenticate
        if (!convexLoading && convexAuthenticated) {
          if (!userCreated) {
            addDebug("Convex authenticated, creating/fetching user...");
            try {
              // Action fetches user data from WorkOS API server-side
              const user = await getOrCreateUser();
              if (user) {
                addDebug(`User ready: ${user.email}`);
                setUserCreated(true);
                navigate("/", { replace: true });
              } else {
                addDebug("Failed to create user");
                setError("Failed to create user record.");
              }
            } catch (err) {
              addDebug(`User creation error: ${err}`);
              setError(`Failed to create user: ${err instanceof Error ? err.message : "Unknown error"}`);
            }
          }
        } else if (!convexLoading && !convexAuthenticated) {
          addDebug("Convex not authenticated - token may not match auth.config.ts issuers");
          setError("Convex authentication failed. The JWT issuer may not match the configured providers.");
        }
      } else {
        // No user after loading - try to get token for more info
        try {
          const token = await getAccessToken();
          addDebug(`Token: ${token ? "received" : "null"}`);
          if (token) {
            addDebug("Have token, waiting for user state...");
          } else {
            setError("No access token received. Please try signing in again.");
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          addDebug(`Token error: ${msg}`);
          setError(`Authentication failed: ${msg}`);
        }
      }
    };

    checkAuth();
  }, [authKitLoading, convexLoading, convexAuthenticated, workosUser, navigate, getAccessToken]);

  // Safety timeout - if stuck for more than 10 seconds, show helpful error
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (authKitLoading || convexLoading) {
        setError("Authentication is taking too long. Please check:\n1. WorkOS redirect URI includes http://localhost:5175/callback\n2. WORKOS_CLIENT_ID is set in Convex dashboard");
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [authKitLoading, convexLoading]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center max-w-md">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="font-display text-xl font-semibold mb-2">Sign in failed</h2>
          <p className="text-muted-foreground mb-4 whitespace-pre-line">{error}</p>
          <div className="text-xs text-muted-foreground/70 mb-4 text-left bg-muted/50 p-3 rounded-lg max-h-40 overflow-y-auto font-mono">
            {debugInfo.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
          <button
            onClick={() => navigate("/login", { replace: true })}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Completing sign in...</p>
        <div className="text-xs text-muted-foreground/50 mt-4 text-left bg-muted/30 p-3 rounded-lg max-h-32 overflow-y-auto font-mono">
          {debugInfo.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
