import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "./AuthContext";
import LoadingScreen from "../components/common/LoadingScreen";

export default function ProtectedRoute({ allowedRoles, children }) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen message="Validando sesión..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/403" replace />;
  }

  return children ?? <Outlet />;
}
