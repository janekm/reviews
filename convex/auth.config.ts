// WorkOS AuthKit configuration for Convex
const clientId = process.env.WORKOS_CLIENT_ID;

const authConfig = {
  providers: [
    {
      type: "customJwt" as const,
      issuer: "https://api.workos.com",
      algorithm: "RS256" as const,
      applicationID: clientId,
      jwks: `https://api.workos.com/sso/jwks/${clientId}`,
    },
  ],
};

export default authConfig;
