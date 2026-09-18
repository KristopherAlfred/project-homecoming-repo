import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";
import { fetchDameBioSupabaseConfig } from "../lib/liveApi";

const ICE_SERVERS: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];

type SignalPayload =
  | { type: "viewer-join"; viewerId: string; sessionId: string }
  | { type: "offer"; viewerId: string; sessionId: string; sdp: RTCSessionDescriptionInit }
  | { type: "answer"; viewerId: string; sessionId: string; sdp: RTCSessionDescriptionInit }
  | { type: "ice"; viewerId: string; sessionId: string; role: "host" | "viewer"; candidate: RTCIceCandidateInit }
  | { type: "host-ready"; sessionId: string };

let sharedClient: SupabaseClient | null = null;

async function getLiveClient() {
  if (sharedClient) return sharedClient;
  const config = await fetchDameBioSupabaseConfig();
  if (!config) return null;
  sharedClient = createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return sharedClient;
}

/** Receives the dashboard camera stream for one isolated live session. */
export function useLiveViewer(enabled: boolean, sessionId: string | null | undefined) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<"idle" | "connecting" | "live" | "unavailable">("idle");
  const [error, setError] = useState<string | null>(null);
  const retryRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || !sessionId) {
      setStream(null);
      setStatus("idle");
      return;
    }

    const activeSessionId = sessionId;
    const viewerId = globalThis.crypto?.randomUUID?.() ?? `viewer-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    let cancelled = false;
    let channel: RealtimeChannel | null = null;
    let peer: RTCPeerConnection | null = null;

    async function announceViewer() {
      if (!channel || cancelled) return;
      await channel.send({
        type: "broadcast",
        event: "signal",
        payload: { type: "viewer-join", viewerId, sessionId: activeSessionId } satisfies SignalPayload,
      });
    }

    async function setup() {
      setStatus("connecting");
      const client = await getLiveClient();
      if (!client || cancelled) {
        setStatus("unavailable");
        setError("Live video is temporarily unavailable");
        return;
      }

      peer = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      peer.ontrack = (event) => {
        const next = event.streams[0] ?? new MediaStream([event.track]);
        setStream(next);
        setStatus("live");
        setError(null);
      };
      peer.onicecandidate = (event) => {
        if (!event.candidate || !channel) return;
        void channel.send({
          type: "broadcast",
          event: "signal",
          payload: {
            type: "ice",
            viewerId,
            sessionId: activeSessionId,
            role: "viewer",
            candidate: event.candidate.toJSON(),
          } satisfies SignalPayload,
        });
      };
      peer.onconnectionstatechange = () => {
        if (!peer || cancelled) return;
        if (peer.connectionState === "connected") setStatus("live");
        if (peer.connectionState === "failed" || peer.connectionState === "disconnected") {
          setStatus("connecting");
          retryRef.current = window.setTimeout(() => void announceViewer(), 1800);
        }
      };

      channel = client.channel(`dame-live-signal:${activeSessionId}`, {
        config: { broadcast: { self: false } },
      });
      channel.on("broadcast", { event: "signal" }, ({ payload }) => {
        const data = payload as SignalPayload;
        if (!data || data.sessionId !== activeSessionId || cancelled) return;
        void (async () => {
          try {
            if (data.type === "host-ready") await announceViewer();
            if (data.type === "offer" && data.viewerId === viewerId && peer && channel) {
              await peer.setRemoteDescription(data.sdp);
              const answer = await peer.createAnswer();
              await peer.setLocalDescription(answer);
              await channel.send({
                type: "broadcast",
                event: "signal",
                payload: { type: "answer", viewerId, sessionId: activeSessionId, sdp: answer } satisfies SignalPayload,
              });
            }
            if (data.type === "ice" && data.role === "host" && data.viewerId === viewerId && peer) {
              await peer.addIceCandidate(data.candidate);
            }
          } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Could not connect to the live stream");
            setStatus("unavailable");
          }
        })();
      });
      await channel.subscribe(async (next) => {
        if (next === "SUBSCRIBED") await announceViewer();
      });
    }

    void setup();
    return () => {
      cancelled = true;
      if (retryRef.current) window.clearTimeout(retryRef.current);
      peer?.close();
      setStream(null);
      if (channel) void getLiveClient().then((client) => client?.removeChannel(channel as RealtimeChannel));
    };
  }, [enabled, sessionId]);

  return { stream, status, error };
}