import { useAuth } from '../contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="mx-auto w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
            <span className="text-4xl">🚫</span>
          </div>
          <h1 className="text-3xl font-vintage-serif font-bold text-vintage-gold mb-4">
            Acesso Negado
          </h1>
          <p className="text-vintage-cream/80 font-vintage-body text-lg mb-6">
            Você não tem permissão para acessar esta área. Esta seção é restrita aos administradores.
          </p>
          <button
            onClick={() => window.history.back()}
            className="btn-vintage"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
