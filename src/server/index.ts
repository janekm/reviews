import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "hono/cloudflare-workers";
import { venuesRoute } from "./routes/venues";
import { reviewsRoute } from "./routes/reviews";
import { authRoute } from "./routes/auth";
import { usersRoute } from "./routes/users";
import { photosRoute } from "./routes/photos";
import { favoritesRoute } from "./routes/favorites";
import { activityRoute } from "./routes/activity";
// @ts-expect-error - generated at build time
import manifest from "__STATIC_CONTENT_MANIFEST";

export type Env = {
  DB: D1Database;
  CACHE: KVNamespace;
  PHOTOS: R2Bucket;
  WORKOS_API_KEY: string;
  WORKOS_CLIENT_ID: string;
  WORKOS_REDIRECT_URI: string;
  CLIENT_URL: string;
  COOKIE_SECRET: string;
  IMAGEKIT_URL_ENDPOINT: string;
  __STATIC_CONTENT: KVNamespace;
};

const app = new Hono<{ Bindings: Env }>();

app.use("/api/*", cors());

app.get("/api/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.route("/api/venues", venuesRoute);
app.route("/api/reviews", reviewsRoute);
app.route("/api/auth", authRoute);
app.route("/api/users", usersRoute);
app.route("/api/photos", photosRoute);
app.route("/api/favorites", favoritesRoute);
app.route("/api/activity", activityRoute);

// Serve static files from Vite build
app.get("/assets/*", serveStatic({ manifest }));
app.get("/favicon.svg", serveStatic({ manifest }));

// SPA fallback - serve index.html for all other routes
app.get("*", serveStatic({ path: "index.html", manifest }));

export default app;
