import { forwardRef } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { RoleProvider } from "@/contexts/RoleContext";
import { Web3Provider } from "@/contexts/Web3Context";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Header } from "@/components/layout/Header";

// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Courts from "./pages/Courts";
import Sections from "./pages/Sections";
import CaseBlocks from "./pages/CaseBlocks";
import CaseDetails from "./pages/CaseDetails";
import CauseList from "./pages/CauseList";
import JudgmentWriter from "./pages/JudgmentWriter";
import EvidenceVault from "./pages/EvidenceVault";
import CourtCalendar from "./pages/CourtCalendar";
import Analytics from "./pages/Analytics";
import SystemHealth from "./pages/SystemHealth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Glassmorphism Layout Wrapper
const GlassLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 grid-background opacity-20" />
      
      {/* Gradient Orbs */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px] animate-pulse delay-1000" />
      
      {/* Content */}
      <div className="relative z-10">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

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

  return isAuthenticated ? <GlassLayout /> : <Navigate to="/" replace />;
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
  
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
});
PublicRoute.displayName = "PublicRoute";

const AppRoutes = () => (
  <Routes>
    {/* Public Routes */}
    <Route element={<PublicRoute />}>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
    </Route>
    
    {/* Protected Routes - Glassmorphism Layout */}
    <Route element={<ProtectedRoute />}>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/cause-list" element={<CauseList />} />
      <Route path="/judgment-writer" element={<JudgmentWriter />} />
      <Route path="/evidence-vault" element={<EvidenceVault />} />
      <Route path="/court-calendar" element={<CourtCalendar />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/system-health" element={<SystemHealth />} />
      <Route path="/courts" element={<Courts />} />
      <Route path="/courts/:courtId/sections" element={<Sections />} />
      <Route path="/sections/:sectionId/blocks" element={<CaseBlocks />} />
      <Route path="/cases/:id" element={<CaseDetails />} />
    </Route>
    
    {/* Legacy redirects */}
    <Route path="/login" element={<Navigate to="/" replace />} />
    
    {/* 404 */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Web3Provider>
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
    </Web3Provider>
  </QueryClientProvider>
);

export default App;
