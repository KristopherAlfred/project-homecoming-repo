import { requireFanAppApiBase } from "./fanAppApiBase";
export type LiveSession = {
  id: string;
  title: string;
  status: "scheduled" | "live" | "ended";
  scheduledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
};

export type LiveChatMessage = {
  id: string;
  sessionId: string;
  username: string;
  text: string;
  createdAt: string;
};

export type LivePublicState = {
  ok?: boolean;
  session: LiveSession | null;
  isLive: boolean;
  scheduledAt: string | null;
  title: string;
  messages?: LiveChatMessage[];
};

function getApiBase() {
  return (requireFanAppApiBase()).replace(/\/$/, "");
}

function getAdminSecret() {
  return import.meta.env.VITE_ADMIN_EXPORT_SECRET?.trim() ?? "";
}

async function liveRequest(pathQuery: string, init?: RequestInit) {
  const response = await fetch(`${getApiBase()}/api/admin/analytics?${pathQuery}`, init);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((data as { error?: string }).error || `Live request failed (${response.status})`);
  }
  return data;
}

export async function fetchLiveState(withChat = false): Promise<LivePublicState> {
  return liveRequest(`view=live${withChat ? "&chat=1" : ""}`) as Promise<LivePublicState>;
}

export async function scheduleLive(input: { title: string; scheduledAt: string }) {
  const secret = getAdminSecret();
  if (!secret) throw new Error("Set VITE_ADMIN_EXPORT_SECRET to schedule lives");
  return liveRequest("view=live", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-secret": secret,
    },
    body: JSON.stringify({ action: "schedule", ...input }),
  }) as Promise<{ ok: true; session: LiveSession }>;
}

export async function startLive(input?: { title?: string; sessionId?: string }) {
  const secret = getAdminSecret();
  if (!secret) throw new Error("Set VITE_ADMIN_EXPORT_SECRET to go live");
  return liveRequest("view=live", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-secret": secret,
    },
    body: JSON.stringify({ action: "start", ...input }),
  }) as Promise<{ ok: true; session: LiveSession }>;
}

export async function endLive(sessionId?: string) {
  const secret = getAdminSecret();
  if (!secret) throw new Error("Set VITE_ADMIN_EXPORT_SECRET to end live");
  return liveRequest("view=live", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-secret": secret,
    },
    body: JSON.stringify({ action: "end", sessionId }),
  }) as Promise<{ ok: true; session: LiveSession | null }>;
}

export async function fetchDameBioSupabaseConfig(): Promise<{
  supabaseUrl: string;
  supabaseAnonKey: string;
} | null> {
  try {
    const response = await fetch(`${getApiBase()}/api/config`);
    if (!response.ok) return null;
    const data = (await response.json()) as { supabaseUrl?: string; supabaseAnonKey?: string };
    if (!data.supabaseUrl || !data.supabaseAnonKey) return null;
    return { supabaseUrl: data.supabaseUrl, supabaseAnonKey: data.supabaseAnonKey };
  } catch {
    return null;
  }
}
