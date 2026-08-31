import { Navigate, Outlet, useLocation } from "@/lib/router-compat";
import { isDashboardAuthed } from "../lib/dashboardAuth";

export function RequireAuth() {
  const location = useLocation();

  if (!isDashboardAuthed()) {
    return <Navigate to="/welcome" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export function PublicOnly({ children }: { children: React.ReactNode }) {
  if (isDashboardAuthed()) {
    return <Navigate to="/" replace />;
  }
  return children;
}
