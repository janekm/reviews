import { httpRouter } from "convex/server";
import { authKit } from "./auth";

const http = httpRouter();

// Register WorkOS AuthKit routes (including webhook handler)
authKit.registerRoutes(http);

export default http;
