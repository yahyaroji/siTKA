import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RoleRoute({ children, role }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (user.role !== role) return <Navigate to="/unauthorized" replace />;

  return children;
}
