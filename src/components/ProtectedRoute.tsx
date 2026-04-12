import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

export function ProtectedRoute({ children, adminOnly = false, collectorOnly = false }: { children: React.ReactNode; adminOnly?: boolean; collectorOnly?: boolean }) {
  const { user, isAdmin, isCollector, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;
  if (collectorOnly && !(isCollector || isAdmin)) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}
