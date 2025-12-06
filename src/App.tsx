import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";

const queryClient = new QueryClient();

// ProtectedRoute component
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
      setLoading(false);
    };

    checkUser();
  }, []);

  if (loading) return <p>Loading...</p>; // Optional: spinner

  return isLoggedIn ? children : <Navigate to="/login" replace />;
};

const App = () => {

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/store" element={<StorePage />} />
            <Route path="/item/:id" element={<ItemPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/add-item"
              element={
                <ProtectedRoute>
                  <AdminAddItem />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/AdminItemOverview"
              element={
                <ProtectedRoute>
                  <AdminItemOverview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/AdminUpdateItem/:id"
              element={
                <ProtectedRoute>
                  <AdminUpdateItem />
                </ProtectedRoute>
              }
            />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
