import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ConvexReactClient } from "convex/react";
import { AuthKitProvider, useAuth } from "@workos-inc/authkit-react";
import { ConvexProviderWithAuthKit } from "@convex-dev/workos";
import App from "./App";
import "leaflet/dist/leaflet.css";
import "./index.css";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthKitProvider
      clientId={import.meta.env.VITE_WORKOS_CLIENT_ID as string}
      redirectUri={import.meta.env.VITE_WORKOS_REDIRECT_URI as string}
      devMode={import.meta.env.DEV}
    >
      <ConvexProviderWithAuthKit client={convex} useAuth={useAuth}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ConvexProviderWithAuthKit>
    </AuthKitProvider>
  </React.StrictMode>
);
