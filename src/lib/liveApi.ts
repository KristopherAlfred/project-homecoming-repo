import { supabase as rawSupabase } from "../integrations/supabase/client";

const supabase = rawSupabase as any;

/**
 * Live sessions + live chat, stored in our own backend so the dashboard
 * "Go Live" button and the fan app are always looking at the same state.
 */

export type LivePin = {
  id: string;
  label: string;
  url: string;
  note?: string;
};

export type LiveSession = {
  id: string;
  athleteId: string | null;
  title: string;
  status: "scheduled" | "live" | "ended";
  scheduledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  pins: LivePin[];
};

export type LiveChatMessage = {
  id: string;
  sessionId: string;
  username: string;
  text: string;
  kind: "chat" | "reaction";
  createdAt: string;
};

export type LivePublicState = {
  session: LiveSession | null;
  isLive: boolean;
  scheduledAt: string | null;
  title: string;
  messages?: LiveChatMessage[];
};

type SessionRow = {
  id: string;
  athlete_id: string | null;
  title: string;
  status: LiveSession["status"];
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  pinned_items: LivePin[] | null;
};

type MessageRow = {
  id: string;
  session_id: string;
  username: string;
  body: string;
  kind: LiveChatMessage["kind"];
  created_at: string;
};

const SESSION_COLUMNS = "id, athlete_id, title, status, scheduled_at, started_at, ended_at, pinned_items";

function toSession(row: SessionRow | null): LiveSession | null {
  if (!row) return null;
  return {
    id: row.id,
    athleteId: row.athlete_id,
    title: row.title,
    status: row.status,
    scheduledAt: row.scheduled_at,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    pins: Array.isArray(row.pinned_items) ? row.pinned_items : [],
  };
}

function toMessage(row: MessageRow): LiveChatMessage {
  return {
    id: row.id,
    sessionId: row.session_id,
    username: row.username,
    text: row.body,
    kind: row.kind,
    createdAt: row.created_at,
  };
}

/** Newest scheduled/live session, optionally scoped to one athlete. */
export async function fetchLiveSession(athleteId?: string | null): Promise<LiveSession | null> {
  let query = supabase
    .from("live_sessions")
    .select(SESSION_COLUMNS)
    .in("status", ["scheduled", "live"])
    .order("status", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(1);
  if (athleteId) query = query.eq("athlete_id", athleteId);
  const { data, error } = await query.maybeSingle();
  if (error) return null;
  return toSession(data as SessionRow | null);
}

export async function fetchLiveChat(sessionId: string, limit = 80): Promise<LiveChatMessage[]> {
  const { data, error } = await supabase
    .from("live_chat_messages")
    .select("id, session_id, username, body, kind, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return (data as MessageRow[]).map(toMessage).reverse();
}

export async function fetchLiveState(athleteId?: string | null, withChat = false): Promise<LivePublicState> {
  const session = await fetchLiveSession(athleteId);
  const messages = withChat && session ? await fetchLiveChat(session.id) : undefined;
  return {
    session,
    isLive: session?.status === "live",
    scheduledAt: session?.scheduledAt ?? null,
    title: session?.title ?? "",
    messages,
  };
}

export async function scheduleLive(input: { athleteId?: string | null; title: string; scheduledAt: string }) {
  const { data, error } = await supabase
    .from("live_sessions")
    .insert({
      athlete_id: input.athleteId ?? null,
      title: input.title,
      status: "scheduled",
      scheduled_at: input.scheduledAt,
    })
    .select(SESSION_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return { session: toSession(data as SessionRow)! };
}

export async function startLive(input: { athleteId?: string | null; title?: string; sessionId?: string }) {
  if (input.sessionId) {
    const { data, error } = await supabase
      .from("live_sessions")
      .update({ status: "live", started_at: new Date().toISOString(), ...(input.title ? { title: input.title } : {}) })
      .eq("id", input.sessionId)
      .select(SESSION_COLUMNS)
      .single();
    if (error) throw new Error(error.message);
    return { session: toSession(data as SessionRow)! };
  }
  const { data, error } = await supabase
    .from("live_sessions")
    .insert({
      athlete_id: input.athleteId ?? null,
      title: input.title || "Live",
      status: "live",
      started_at: new Date().toISOString(),
    })
    .select(SESSION_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return { session: toSession(data as SessionRow)! };
}

export async function endLive(sessionId?: string) {
  if (!sessionId) return { session: null };
  const { data, error } = await supabase
    .from("live_sessions")
    .update({ status: "ended", ended_at: new Date().toISOString() })
    .eq("id", sessionId)
    .select(SESSION_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return { session: toSession(data as SessionRow) };
}

/** Replace the pinned tabs/sites shown to everyone watching the live. */
export async function setLivePins(sessionId: string, pins: LivePin[]) {
  const { data, error } = await supabase
    .from("live_sessions")
    .update({ pinned_items: pins.slice(0, 8) })
    .eq("id", sessionId)
    .select(SESSION_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return toSession(data as SessionRow)!;
}

export async function sendLiveMessage(input: {
  sessionId: string;
  username: string;
  text: string;
  kind?: LiveChatMessage["kind"];
}) {
  const body = input.text.trim().slice(0, 300);
  if (!body) return null;
  const { data, error } = await supabase
    .from("live_chat_messages")
    .insert({
      session_id: input.sessionId,
      username: input.username.trim().slice(0, 40) || "Fan",
      body,
      kind: input.kind ?? "chat",
    })
    .select("id, session_id, username, body, kind, created_at")
    .single();
  if (error) throw new Error(error.message);
  return toMessage(data as MessageRow);
}

/** Realtime chat feed for one session. Returns an unsubscribe function. */
export function subscribeLiveChat(sessionId: string, onMessage: (message: LiveChatMessage) => void) {
  const channel = supabase
    .channel(`live-chat:${sessionId}:${Math.random().toString(16).slice(2)}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "live_chat_messages", filter: `session_id=eq.${sessionId}` },
      (payload: { new: MessageRow }) => onMessage(toMessage(payload.new)),
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}

/** Realtime session status (goes live / ends / gets scheduled). */
export function subscribeLiveSessions(onChange: () => void) {
  const channel = supabase
    .channel(`live-sessions:${Math.random().toString(16).slice(2)}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "live_sessions" }, () => onChange())
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}

/** Signaling client for the WebRTC camera relay — the same backend as everything else. */
export function getLiveSignalClient() {
  return supabase;
}
