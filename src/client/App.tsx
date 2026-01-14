import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";

// Lazy load pages - especially those with maps (Leaflet is heavy)
const HomePage = lazy(() => import("./pages/HomePage").then(m => ({ default: m.HomePage })));
const VenuePage = lazy(() => import("./pages/VenuePage").then(m => ({ default: m.VenuePage })));
const AddVenuePage = lazy(() => import("./pages/AddVenuePage").then(m => ({ default: m.AddVenuePage })));
const LoginPage = lazy(() => import("./pages/LoginPage").then(m => ({ default: m.LoginPage })));
const AdminPage = lazy(() => import("./pages/AdminPage").then(m => ({ default: m.AdminPage })));
const FavoritesPage = lazy(() => import("./pages/FavoritesPage").then(m => ({ default: m.FavoritesPage })));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="venue/new" element={<AddVenuePage />} />
          <Route path="venue/:id" element={<VenuePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="favorites" element={<FavoritesPage />} />
          <Route path="admin" element={<AdminPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
