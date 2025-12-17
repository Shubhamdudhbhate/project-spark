import { forwardRef } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { RoleProvider } from "@/contexts/RoleContext";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Courts from "./pages/Courts";
import Sections from "./pages/Sections";
import CaseBlocks from "./pages/CaseBlocks";
import CaseDetails from "./pages/CaseDetails";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = forwardRef<HTMLDivElement>((_, ref) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div ref={ref} className="flex items-center justify-center min-h-screen bg-background">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
});
ProtectedRoute.displayName = "ProtectedRoute";

// Public Route Wrapper (redirects authenticated users)
const PublicRoute = forwardRef<HTMLDivElement>((_, ref) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div ref={ref} className="flex items-center justify-center min-h-screen bg-background">
        <LoadingSpinner size={48} />
      </div>
    );
  }
  
  return isAuthenticated ? <Navigate to="/courts" replace /> : <Outlet />;
});
PublicRoute.displayName = "PublicRoute";

const AppRoutes = () => (
  <Routes>
    {/* Public Routes */}
    <Route element={<PublicRoute />}>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
    </Route>
    
    {/* Protected Routes - Navigation Hierarchy */}
    <Route element={<ProtectedRoute />}>
      {/* Level 1: Courts */}
      <Route path="/courts" element={<Courts />} />
      {/* Level 2: Sections */}
      <Route path="/courts/:courtId/sections" element={<Sections />} />
      {/* Level 3: Case Blocks */}
      <Route path="/sections/:sectionId/blocks" element={<CaseBlocks />} />
      {/* Level 4: Case Workspace */}
      <Route path="/cases/:id" element={<CaseDetails />} />
    </Route>
    
    {/* Legacy redirect */}
    <Route path="/login" element={<Navigate to="/" replace />} />
    <Route path="/dashboard/*" element={<Navigate to="/courts" replace />} />
    
    {/* 404 */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <RoleProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Router>
            <AppRoutes />
          </Router>
        </TooltipProvider>
      </RoleProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;