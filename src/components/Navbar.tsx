import { motion } from "framer-motion";
import { Shield, Wallet, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const Navbar = () => {
  const { isAuthenticated, signOut, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    signOut();
    navigate('/', { state: { from: location.pathname } });
  };

  if (isLoading) {
    return null; // Or a loading spinner
  }

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/5"
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl group-hover:bg-primary/30 transition-all duration-300" />
              <Shield className="relative w-8 h-8 text-primary" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              NyaySutra <span className="text-primary">🛡️</span>
            </span>
          </Link>

          {/* Navigation Actions */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Button
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <Link to="/login" state={{ from: '/dashboard' }}>
                <Button
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Officer Login
                </Button>
              </Link>
            )}

            <Button
              className="relative glow-button bg-primary/10 border border-primary/50 hover:bg-primary/20 hover:border-primary text-primary transition-all duration-300 animate-glow"
            >
              <Wallet className="w-4 h-4 mr-2" />
              Connect Wallet
            </Button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};
