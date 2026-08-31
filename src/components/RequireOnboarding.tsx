import { Navigate, Outlet } from "@/lib/router-compat";
import { useAthlete } from "../contexts/AthleteContext";
import { loadDashboardSession } from "../lib/dashboardAuth";

/**
 * Athlete-role sessions without a completed athlete profile are sent through
 * onboarding first. Admin/agent sessions pass straight through.
 */
export function RequireOnboarding() {
  const { athlete, loading } = useAthlete();
  const role = loadDashboardSession()?.role ?? "athlete";

  if (role !== "athlete") return <Outlet />;
  if (loading) return null;
  if (!athlete || !athlete.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }
  return <Outlet />;
}
