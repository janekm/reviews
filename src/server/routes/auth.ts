import { Hono } from "hono";
import { setSignedCookie, getSignedCookie } from "hono/cookie";
import { WorkOS } from "@workos-inc/node";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { users } from "../db/schema";
import type { Env } from "../index";

export const authRoute = new Hono<{ Bindings: Env }>();

authRoute.get("/login", async (c) => {
  const workos = new WorkOS(c.env.WORKOS_API_KEY);

  const authorizationUrl = workos.userManagement.getAuthorizationUrl({
    provider: "authkit",
    redirectUri: c.env.WORKOS_REDIRECT_URI,
    clientId: c.env.WORKOS_CLIENT_ID,
  });

  return c.redirect(authorizationUrl);
});

authRoute.get("/callback", async (c) => {
  const code = c.req.query("code");

  if (!code) {
    return c.json({ error: "Missing authorization code" }, 400);
  }

  const workos = new WorkOS(c.env.WORKOS_API_KEY);
  const db = drizzle(c.env.DB);

  const { user: workosUser } =
    await workos.userManagement.authenticateWithCode({
      code,
      clientId: c.env.WORKOS_CLIENT_ID,
    });

  let user = await db
    .select()
    .from(users)
    .where(eq(users.workosId, workosUser.id))
    .get();

  if (!user) {
    const id = crypto.randomUUID();
    await db.insert(users).values({
      id,
      workosId: workosUser.id,
      email: workosUser.email,
      name: workosUser.firstName
        ? `${workosUser.firstName} ${workosUser.lastName ?? ""}`.trim()
        : null,
      avatarUrl: workosUser.profilePictureUrl ?? null,
    });
    user = { id, workosId: workosUser.id, email: workosUser.email, name: null, avatarUrl: null, createdAt: new Date() };
  }

  const isSecure = c.env.CLIENT_URL.startsWith("https://");

  await setSignedCookie(c, "user_id", user.id, c.env.COOKIE_SECRET, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "Lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return c.redirect("/");
});

authRoute.get("/me", async (c) => {
  const userId = await getSignedCookie(c, c.env.COOKIE_SECRET, "user_id");

  if (!userId) {
    return c.json({ user: null });
  }

  const db = drizzle(c.env.DB);

  try {
    const user = await db
      .select({
        id: users.id,
        workosId: users.workosId,
        email: users.email,
        name: users.name,
        avatarUrl: users.avatarUrl,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .get();

    return c.json({ user: user ?? null });
  } catch {
    return c.json({ user: null });
  }
});

authRoute.post("/logout", async (c) => {
  const isSecure = c.env.CLIENT_URL.startsWith("https://");

  await setSignedCookie(c, "user_id", "", c.env.COOKIE_SECRET, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "Lax",
    path: "/",
    maxAge: 0,
  });

  return c.json({ success: true });
});
