import { useEffect, useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { AppLayout } from "../layouts/AppLayout";
import { useAthlete } from "../contexts/AthleteContext";
import { isDashboardAuthed, loadDashboardSession } from "../lib/dashboardAuth";

/**
 * Client-side gate for the whole dashboard: sign in first, then finish athlete
 * onboarding. Rendering waits for hydration since the session lives in
 * sessionStorage.
 */
function AppGate() {
  const [ready, setReady] = useState(false);
  const { athlete, loading } = useAthlete();

  useEffect(() => setReady(true), []);
  if (!ready) return null;

  if (!isDashboardAuthed()) return <Navigate to="/welcome" replace />;

  const role = loadDashboardSession()?.role ?? "athlete";
  if (role === "athlete") {
    if (loading) return null;
    if (!athlete || !athlete.onboarding_completed) {
      return <Navigate to="/onboarding" replace />;
    }
  }

  return <AppLayout />;
}

export const Route = createFileRoute("/_app")({
  component: AppGate,
});
