import { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { VenuePage } from "./pages/VenuePage";
import { AddVenuePage } from "./pages/AddVenuePage";
import { LoginPage } from "./pages/LoginPage";
import { AdminPage } from "./pages/AdminPage";
import { FavoritesPage } from "./pages/FavoritesPage";
import { CallbackPage } from "./pages/CallbackPage";

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
          <Route path="callback" element={<CallbackPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
