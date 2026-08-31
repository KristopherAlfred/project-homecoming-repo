export type DashboardRole = "athlete" | "admin";

export type DashboardSession = {
  name: string;
  email: string;
  role: DashboardRole;
};

const SESSION_KEY = "amx_dashboard_session";

export function loadDashboardSession(): DashboardSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as DashboardSession) : null;
  } catch {
    return null;
  }
}

export function saveDashboardSession(session: DashboardSession | null) {
  if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else sessionStorage.removeItem(SESSION_KEY);
}

export function isDashboardAuthed() {
  return loadDashboardSession() !== null;
}
