import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

type AuthWrapperProps = {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
};

export const AuthWrapper = ({
  children,
  requireAuth = true,
  redirectTo = '/login',
}: AuthWrapperProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  console.log('AuthWrapper:', {
    requireAuth,
    isAuthenticated,
    isLoading,
    user,
    currentPath: location.pathname,
    redirectTo
  });

  useEffect(() => {
    console.log('AuthWrapper - Effect running', {
      isLoading,
      isAuthenticated,
      requireAuth,
      currentPath: location.pathname
    });

    if (!isLoading) {
      if (requireAuth && !isAuthenticated) {
        console.log('AuthWrapper - Redirecting to login');
        navigate(redirectTo, { 
          state: { from: location.pathname !== '/login' ? location.pathname : '/' } 
        });
      } else if (!requireAuth && isAuthenticated) {
        console.log('AuthWrapper - Redirecting to dashboard');
        navigate('/dashboard');
      } else {
        console.log('AuthWrapper - Access granted');
      }
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo, requireAuth, location.pathname]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return null; // Will be redirected by the useEffect
  }

  return <>{children}</>;
};

export default AuthWrapper;
