import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { NavProvider } from "@/contexts/navContext";
import { LanguageProvider } from "@/contexts/languageContext";
import { supabase } from "./helper/supabaseClient";
import Index from "./pages/Index";
import StorePage from "./pages/StorePage";
import AboutPage from "./pages/AboutPage";
import NotFound from "./pages/NotFound";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAddItem from "./pages/admin/AdminAddItem";
import ItemPage from "./pages/ItemPage";
import AdminItemOverview from "./pages/admin/AdminItemOverview";
import AdminUpdateItem from "./pages/admin/AdminUpdateItem";
import AdminInventory from "./pages/admin/AdminInventory";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminStats from "./pages/admin/AdminStats";
import AdminMaterialCare from "./pages/admin/AdminMaterialCare";
import AdminCollections from "./pages/admin/AdminCollections";
import CartPage from "./pages/cartPage";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="p-8 text-center text-muted-foreground">Loading...</p>;
  return isLoggedIn ? children : <Navigate to="/login" replace />;
};

// Requires app_metadata.role = 'admin' set via Supabase admin panel or SQL:
//   UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'
//   WHERE email = 'your-admin@email.com';
const AdminRoute = ({ children }: { children: JSX.Element }) => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      const role = (user?.app_metadata as Record<string, unknown> | undefined)?.role;
      setIsAdmin(role === "admin");
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="p-8 text-center text-muted-foreground">Loading...</p>;
  return isAdmin ? children : <Navigate to="/login" replace />;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
        <NavProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Index />} />
            <Route path="/store" element={<StorePage category="jewelry" />} />
            <Route path="/jewelry" element={<StorePage category="jewelry" />} />
            <Route path="/knitting" element={<StorePage category="knitting" />} />
            <Route path="/item/:id" element={<ItemPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/cart" element={<CartPage />} />

            {/* Protected: user */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Protected: admin only (requires app_metadata.role = 'admin') */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/add-item"
              element={
                <AdminRoute>
                  <AdminAddItem />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/AdminItemOverview"
              element={
                <AdminRoute>
                  <AdminItemOverview />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/AdminUpdateItem/:id"
              element={
                <AdminRoute>
                  <AdminUpdateItem />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/inventory"
              element={
                <AdminRoute>
                  <AdminInventory />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <AdminRoute>
                  <AdminOrders />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/stats"
              element={
                <AdminRoute>
                  <AdminStats />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/material-care"
              element={
                <AdminRoute>
                  <AdminMaterialCare />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/collections"
              element={
                <AdminRoute>
                  <AdminCollections />
                </AdminRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </NavProvider>
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
