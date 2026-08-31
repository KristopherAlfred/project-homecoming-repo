import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";
import { fetchDameBioSupabaseConfig } from "../lib/liveApi";

const CHANNEL = "dame-live-signal";
const ICE_SERVERS: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];

type SignalPayload =
  | { type: "viewer-join"; viewerId: string }
  | { type: "offer"; viewerId: string; sdp: RTCSessionDescriptionInit }
  | { type: "answer"; viewerId: string; sdp: RTCSessionDescriptionInit }
  | { type: "ice"; viewerId: string; role: "host" | "viewer"; candidate: RTCIceCandidateInit }
  | { type: "host-ready"; sessionId: string };

let sharedClient: SupabaseClient | null = null;

async function getDashboardSupabase() {
  if (sharedClient) return sharedClient;
  const config = await fetchDameBioSupabaseConfig();
  if (!config) return null;
  sharedClient = createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return sharedClient;
}

/** Broadcast the athlete's camera to fan app viewers via WebRTC. */
export function useLiveHost(
  enabled: boolean,
  localStream: MediaStream | null,
  sessionId: string | null | undefined,
) {
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const [viewerCount, setViewerCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !localStream || !sessionId) {
      peersRef.current.forEach((pc) => pc.close());
      peersRef.current.clear();
      setViewerCount(0);
      return;
    }

    const activeSessionId = sessionId;
    let cancelled = false;
    let channel: RealtimeChannel | null = null;

    async function setup() {
      const supabase = await getDashboardSupabase();
      if (!supabase || cancelled) {
        setError("Live video signaling unavailable — check the fan app /api/config");
        return;
      }

      channel = supabase.channel(CHANNEL, { config: { broadcast: { self: false } } });

      async function connectViewer(viewerId: string) {
        if (peersRef.current.has(viewerId) || !localStream || !channel) return;

        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        peersRef.current.set(viewerId, pc);
        setViewerCount(peersRef.current.size);

        localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

        pc.onicecandidate = (event) => {
          if (!event.candidate || !channel) return;
          void channel.send({
            type: "broadcast",
            event: "signal",
            payload: {
              type: "ice",
              viewerId,
              role: "host",
              candidate: event.candidate.toJSON(),
            } satisfies SignalPayload,
          });
        };

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === "failed" || pc.connectionState === "closed") {
            peersRef.current.delete(viewerId);
            setViewerCount(peersRef.current.size);
          }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await channel.send({
          type: "broadcast",
          event: "signal",
          payload: { type: "offer", viewerId, sdp: offer } satisfies SignalPayload,
        });
      }

      channel.on("broadcast", { event: "signal" }, ({ payload }) => {
        const data = payload as SignalPayload;
        if (!data || cancelled) return;

        void (async () => {
          try {
            if (data.type === "viewer-join") await connectViewer(data.viewerId);
            if (data.type === "answer") {
              const pc = peersRef.current.get(data.viewerId);
              if (pc && data.sdp) await pc.setRemoteDescription(data.sdp);
            }
            if (data.type === "ice" && data.role === "viewer") {
              const pc = peersRef.current.get(data.viewerId);
              if (pc && data.candidate) await pc.addIceCandidate(data.candidate);
            }
          } catch (err) {
            setError(err instanceof Error ? err.message : "Host signaling failed");
          }
        })();
      });

      await channel.subscribe(async (status) => {
        if (status !== "SUBSCRIBED" || cancelled || !channel) return;
        setError(null);
        await channel.send({
          type: "broadcast",
          event: "signal",
          payload: { type: "host-ready", sessionId: activeSessionId } satisfies SignalPayload,
        });
      });
    }

    void setup();

    return () => {
      cancelled = true;
      peersRef.current.forEach((pc) => pc.close());
      peersRef.current.clear();
      if (channel) {
        void getDashboardSupabase().then((sb) => {
          if (sb) void sb.removeChannel(channel!);
        });
      }
    };
  }, [enabled, localStream, sessionId]);

  return { viewerCount, error };
}
