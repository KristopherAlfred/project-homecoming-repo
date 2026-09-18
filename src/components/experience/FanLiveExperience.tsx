import { useEffect, useMemo, useRef, useState } from "react";
import { BellRing, Radio, Volume2, VolumeX } from "lucide-react";
import { fetchLiveState, subscribeLiveSessions, type LivePublicState } from "@/lib/liveApi";
import { useLiveViewer } from "@/hooks/useLiveViewer";
import { LiveChat } from "./LiveChat";

function countdownLabel(target: string | null, now: number) {
  if (!target) return "Schedule coming soon";
  const remaining = Math.max(0, new Date(target).getTime() - now);
  const total = Math.floor(remaining / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return days > 0
    ? `${days}d ${hours}h ${minutes}m`
    : `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function useFanLiveState(athleteId?: string | null) {
  const [state, setState] = useState<LivePublicState | null>(null);
  useEffect(() => {
    let active = true;
    const refresh = () =>
      void fetchLiveState(athleteId ?? null)
        .then((next) => active && setState(next))
        .catch(() => undefined);
    refresh();
    const unsubscribe = subscribeLiveSessions(refresh);
    const timer = window.setInterval(refresh, 15000);
    return () => {
      active = false;
      unsubscribe();
      window.clearInterval(timer);
    };
  }, [athleteId]);
  return state;
}

export function FanLiveAlert({ state, onOpen }: { state: LivePublicState | null; onOpen: () => void }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!state?.scheduledAt || state.isLive) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [state?.isLive, state?.scheduledAt]);
  if (!state?.session || (!state.isLive && state.session.status !== "scheduled")) return null;
  return (
    <button type="button" className={`fan-live-alert ${state.isLive ? "is-live" : ""}`} onClick={onOpen}>
      <span className="fan-live-alert-icon">{state.isLive ? <Radio size={14} /> : <BellRing size={14} />}</span>
      <span className="min-w-0 flex-1 text-left">
        <strong>{state.isLive ? "Live now" : state.title || "Live session"}</strong>
        <small>{state.isLive ? "Tap to watch" : `Starts in ${countdownLabel(state.scheduledAt, now)}`}</small>
      </span>
      <span aria-hidden="true">›</span>
    </button>
  );
}

export function FanLiveExperience({ state, title }: { state: LivePublicState | null; title: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const activeId = state?.isLive ? state.session?.id : null;
  const { stream, status } = useLiveViewer(Boolean(activeId), activeId);
  useEffect(() => {
    if (!videoRef.current || !stream) return;
    videoRef.current.srcObject = stream;
    void videoRef.current.play().catch(() => undefined);
  }, [stream]);
  useEffect(() => {
    if (!state?.scheduledAt || state.isLive) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [state?.isLive, state?.scheduledAt]);
  const schedule = useMemo(
    () => state?.scheduledAt ? new Date(state.scheduledAt).toLocaleString(undefined, { weekday: "long", hour: "numeric", minute: "2-digit" }) : "To be announced",
    [state?.scheduledAt],
  );

  return (
    <div className="fan-live-experience">
      <div className="fan-live-player">
        {stream ? <video ref={videoRef} autoPlay playsInline muted={muted} className="h-full w-full object-cover" /> : null}
        {!stream ? (
          <div className="fan-live-placeholder">
            <span className={`fan-live-orbit ${state?.isLive ? "is-live" : ""}`}><Radio size={24} /></span>
            <p>{state?.isLive ? (status === "unavailable" ? "Stream reconnecting" : "Connecting to the stream") : "Next live session"}</p>
            {!state?.isLive ? <strong>{countdownLabel(state?.scheduledAt ?? null, now)}</strong> : null}
          </div>
        ) : null}
        {state?.isLive ? <span className="fan-live-badge">Live</span> : null}
        {stream ? (
          <button type="button" className="fan-live-sound" aria-label={muted ? "Turn sound on" : "Mute live stream"} onClick={() => setMuted((value) => !value)}>
            {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
        ) : null}
      </div>
      <div className="fan-live-copy">
        <p>{state?.isLive ? "Happening now" : "Upcoming"}</p>
        <h2>{state?.title || title || "Live"}</h2>
        <span>{state?.isLive ? "You’re in the room. Turn on sound when you’re ready." : schedule}</span>
      </div>
      {pins.length > 0 ? (
        <div className="fan-live-pins">
          <p className="fan-live-pins-head">
            <Pin size={12} /> Pinned by the host
          </p>
          {pins.map((pin) => (
            <a key={pin.id} href={pin.url} target="_blank" rel="noreferrer" className="fan-live-pin">
              <span className="fan-live-pin-favicon">
                <img src={faviconFor(pin.url)} alt="" loading="lazy" />
              </span>
              <span className="min-w-0 flex-1">
                <strong>{pin.label || domainFor(pin.url)}</strong>
                <small>{pin.note || domainFor(pin.url)}</small>
              </span>
              <ExternalLink size={13} />
            </a>
          ))}
        </div>
      ) : null}
      <LiveChat sessionId={state?.session?.id ?? null} isLive={Boolean(state?.isLive)} compact />
    </div>
  );
}
