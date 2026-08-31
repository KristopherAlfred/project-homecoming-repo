import { useAthlete } from "../contexts/AthleteContext";
import { useEffect, useRef, useState } from "react";
import {
  CalendarClock,
  Camera,
  CameraOff,
  Circle,
  Maximize2,
  Minimize2,
  Mic,
  MicOff,
  Radio,
  Sparkles,
  Video,
} from "lucide-react";
import { useLiveHost } from "../hooks/useLiveHost";
import {
  endLive,
  fetchLiveState,
  scheduleLive,
  startLive,
  type LiveChatMessage,
  type LiveSession,
} from "../lib/liveApi";
import { TypographyControls } from "../components/TypographyControls";
import { titleTypographyStyle, type TitleFontFamily, type TitleFontSize } from "../lib/typography";

type UiStatus = "idle" | "preview" | "live" | "ended";

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function LivePage() {
  const { fanAppName, firstName } = useAthlete();
  const videoRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [status, setStatus] = useState<UiStatus>("idle");
  const [title, setTitle] = useState("");
  const [titleFontFamily, setTitleFontFamily] = useState<TitleFontFamily>("default");
  const [titleFontSize, setTitleFontSize] = useState<TitleFontSize>("md");
  const [scheduleAt, setScheduleAt] = useState(() => toLocalInputValue(new Date(Date.now() + 60 * 60 * 1000)));
  const [session, setSession] = useState<LiveSession | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [fullscreen, setFullscreen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmGoLive, setConfirmGoLive] = useState(false);

  const isLive = status === "live";
  const { viewerCount, error: hostError } = useLiveHost(isLive, localStream, session?.id ?? null);

  useEffect(() => {
    void fetchLiveState(true)
      .then((state) => {
        if (state.session) {
          setSession(state.session);
          setTitle(state.session.title);
          if (state.session.scheduledAt) {
            setScheduleAt(toLocalInputValue(new Date(state.session.scheduledAt)));
          }
          if (state.isLive) setStatus("live");
        }
        if (state.messages) setMessages(state.messages);
      })
      .catch(() => undefined);

    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!isLive || !session?.id) return;
    const id = window.setInterval(() => {
      void fetchLiveState(true)
        .then((state) => {
          if (state.messages) setMessages(state.messages);
        })
        .catch(() => undefined);
    }, 1500);
    return () => window.clearInterval(id);
  }, [isLive, session?.id]);

  useEffect(() => {
    if (!isLive) return;
    setElapsed(0);
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [isLive]);

  useEffect(() => {
    function onFs() {
      setFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  async function ensurePreview() {
    setCameraError(null);
    if (streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      await videoRef.current.play().catch(() => undefined);
      setLocalStream(streamRef.current);
      setStatus((s) => (s === "live" ? s : "preview"));
      return streamRef.current;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      setLocalStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      setCameraOn(true);
      setMicOn(true);
      setStatus((s) => (s === "live" ? s : "preview"));
      return stream;
    } catch {
      setCameraError("Camera or mic access was blocked.");
      setStatus((s) => (s === "live" ? s : "preview"));
      return null;
    }
  }

  function toggleCamera() {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) {
      setCameraOn((value) => !value);
      return;
    }
    track.enabled = !track.enabled;
    setCameraOn(track.enabled);
  }

  function toggleMic() {
    const track = streamRef.current?.getAudioTracks()[0];
    if (!track) {
      setMicOn((value) => !value);
      return;
    }
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
  }

  async function toggleFullscreen() {
    const el = stageRef.current;
    if (!el) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await el.requestFullscreen();
  }

  async function handleSchedule() {
    setBusy(true);
    setActionError(null);
    try {
      const result = await scheduleLive({
        title: title.trim() || `${fanAppName} Live`,
        scheduledAt: new Date(scheduleAt).toISOString(),
      });
      setSession(result.session);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not schedule live");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoLive() {
    setBusy(true);
    setActionError(null);
    try {
      await ensurePreview();
      const result = await startLive({
        title: title.trim() || `${fanAppName} Live`,
        sessionId: session?.status === "scheduled" ? session.id : undefined,
      });
      setSession(result.session);
      setStatus("live");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not go live");
    } finally {
      setBusy(false);
    }
  }

  async function handleEndLive() {
    setBusy(true);
    setActionError(null);
    try {
      await endLive(session?.id);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setLocalStream(null);
      if (videoRef.current) videoRef.current.srcObject = null;
      setStatus("ended");
      setCameraOn(false);
      setMicOn(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not end live");
    } finally {
      setBusy(false);
    }
  }

  function resetStudio() {
    setStatus("idle");
    setElapsed(0);
    setCameraError(null);
    setActionError(null);
  }

  const showVideo = Boolean(localStream) && cameraOn && (status === "preview" || status === "live");
  const scheduledLabel = session?.scheduledAt
    ? new Date(session.scheduledAt).toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="space-y-5">
      <style>{`
        @keyframes go-live-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(var(--theme-accent-rgb),0.55), 0 0 28px rgba(var(--theme-accent-rgb),0.35); }
          50% { transform: scale(1.03); box-shadow: 0 0 0 14px rgba(var(--theme-accent-rgb),0), 0 0 40px rgba(var(--theme-accent-rgb),0.55); }
        }
        .go-live-pulse { animation: go-live-pulse 1.6s ease-in-out infinite; }
      `}</style>

      <div className="overflow-hidden rounded-2xl border border-dt-border bg-dt-card">
        <div className="relative border-b border-dt-border bg-gradient-to-br from-black via-[#0c0c0c] to-[#051a12] px-5 py-5 sm:px-7 sm:py-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_0%,rgba(var(--theme-accent-rgb),0.22),transparent_50%)]" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-dt-red/30 bg-dt-red/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-dt-red">
                <Sparkles size={12} />
                {fanAppName} Live
              </div>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Go live for the {fanAppName} community
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/65">
                Schedule a time, then hit Go Live — fans see your camera on the {fanAppName} home and live screens with chat.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="min-w-[110px] rounded-xl border border-white/10 bg-black/40 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">Status</p>
                <p className={`mt-1 text-lg font-bold ${isLive ? "text-dt-red" : "text-white"}`}>
                  {isLive ? "LIVE" : status === "preview" ? "Ready" : status === "ended" ? "Ended" : "Offline"}
                </p>
              </div>
              <div className="min-w-[110px] rounded-xl border border-white/10 bg-black/40 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">Duration</p>
                <p className="mt-1 text-lg font-bold text-white">{formatDuration(elapsed)}</p>
              </div>
              <div className="min-w-[110px] rounded-xl border border-white/10 bg-black/40 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">Viewers</p>
                <p className="mt-1 text-lg font-bold text-white">{isLive ? viewerCount : "—"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-0 xl:grid-cols-12">
          <div className="border-b border-dt-border p-4 sm:p-5 xl:col-span-7 xl:border-b-0 xl:border-r">
            <div
              ref={stageRef}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_0_40px_rgba(var(--theme-accent-rgb),0.08)]"
            >
              <div className="aspect-video w-full">
                <video
                  ref={videoRef}
                  muted
                  playsInline
                  autoPlay
                  className={`h-full w-full object-cover ${showVideo ? "block" : "hidden"}`}
                />
                {!showVideo && (
                  <div className="flex h-full flex-col items-center justify-center gap-4 bg-[radial-gradient(ellipse_at_center,rgba(var(--theme-accent-rgb),0.2),transparent_55%),linear-gradient(180deg,#0a0a0a,#050505)] px-6 text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border border-dt-red/35 bg-dt-red/10">
                      <Radio size={32} className="text-dt-red" />
                    </div>
                    <div>
                      <p className="text-xl font-semibold text-white">{fanAppName} live studio</p>
                      <p className="mx-auto mt-2 max-w-md text-sm text-white/55">
                        {cameraError ?? "Open camera, schedule if needed, then hit the pulsing Go Live button."}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {isLive && (
                <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/75 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide text-white">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-dt-red" />
                  Live Now · {formatDuration(elapsed)}
                </div>
              )}

              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-black/75 p-2 backdrop-blur">
                <button type="button" onClick={toggleCamera} className={`rounded-full p-3 ${cameraOn ? "bg-white/10 text-white" : "bg-dt-red text-white"}`}>
                  {cameraOn ? <Camera size={17} /> : <CameraOff size={17} />}
                </button>
                <button type="button" onClick={toggleMic} className={`rounded-full p-3 ${micOn ? "bg-white/10 text-white" : "bg-dt-red text-white"}`}>
                  {micOn ? <Mic size={17} /> : <MicOff size={17} />}
                </button>
                <button type="button" onClick={() => void toggleFullscreen()} className="rounded-full bg-white/10 p-3 text-white">
                  {fullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-5 p-5 sm:p-6 xl:col-span-5">
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45">Destination</p>
              <div className="rounded-xl border border-dt-red/40 bg-gradient-to-br from-dt-red/15 to-transparent p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-dt-red text-white">
                    <Radio size={20} />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-white">Go Live on {fanAppName}</p>
                    <p className="mt-1 text-sm text-white/55">
                      Fans on your bio link see your stream in the live box and /access/live.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <label className="block">
              <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45">Stream title</span>
              <input
                value={title}
                placeholder={`${fanAppName} Live`}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isLive}
                className="w-full rounded-xl border border-dt-border bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-dt-red/60 disabled:opacity-60"
                style={titleTypographyStyle({ titleFontFamily, titleFontSize })}
              />
            </label>

            <TypographyControls
              fontFamily={titleFontFamily}
              fontSize={titleFontSize}
              onFontFamilyChange={setTitleFontFamily}
              onFontSizeChange={setTitleFontSize}
            />

            <div className="rounded-xl border border-dt-border bg-black/30 p-4">
              <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45">
                <CalendarClock size={14} />
                Schedule live
              </div>
              <input
                type="datetime-local"
                value={scheduleAt}
                onChange={(e) => setScheduleAt(e.target.value)}
                disabled={isLive}
                className="w-full rounded-xl border border-dt-border bg-dt-bg px-3 py-2.5 text-sm text-white outline-none focus:border-dt-red/50 disabled:opacity-60"
              />
              <button
                type="button"
                disabled={busy || isLive || !scheduleAt}
                onClick={() => void handleSchedule()}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/[0.05] disabled:opacity-40"
              >
                Save schedule
              </button>
              {scheduledLabel && (
                <p className="mt-2 text-xs text-dt-green">
                  Countdown on {fanAppName} targets {scheduledLabel}
                </p>
              )}
            </div>

            {status === "idle" && (
              <button
                type="button"
                onClick={() => void ensurePreview()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] px-4 py-3 text-sm font-medium text-white hover:bg-white/[0.06]"
              >
                <Video size={16} />
                Open camera preview
              </button>
            )}

            {(actionError || hostError) && (
              <p className="rounded-lg border border-dt-red/40 bg-dt-red/10 px-3 py-2 text-sm text-dt-red">
                {actionError || hostError}
              </p>
            )}

            {status !== "live" && status !== "ended" && (
              <button
                type="button"
                disabled={busy || !title.trim()}
                onClick={() => setConfirmGoLive(true)}
                className="go-live-pulse flex w-full items-center justify-center gap-3 rounded-2xl bg-dt-red px-5 py-5 text-lg font-bold tracking-wide text-white disabled:opacity-40 disabled:[animation:none]"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                  <Radio size={18} />
                </span>
                Go Live on {fanAppName}
              </button>
            )}

            {isLive && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleEndLive()}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dt-red/50 bg-dt-red/15 px-5 py-4 text-base font-semibold text-white hover:bg-dt-red/25"
              >
                <Circle size={14} fill="currentColor" className="text-dt-red" />
                End Live
              </button>
            )}

            {status === "ended" && (
              <button type="button" onClick={resetStudio} className="go-live-pulse flex w-full items-center justify-center rounded-2xl bg-dt-red px-5 py-4 text-base font-bold text-white">
                Start another live
              </button>
            )}
          </div>
        </div>

        <div className="border-t border-dt-border p-5 sm:p-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Live chat from {fanAppName}</h3>
            <span className="text-xs text-white/40">{isLive ? "Updating live" : `Appears when ${firstName} is live`}</span>
          </div>
          <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-dt-border bg-black/40 p-3">
            {messages.length === 0 ? (
              <p className="py-6 text-center text-sm text-white/40">No messages yet.</p>
            ) : (
              messages.map((msg) => (
                <p key={msg.id} className="text-sm text-white">
                  <span className="font-semibold text-dt-red">{msg.username}</span>
                  <span className="text-white/80">: {msg.text}</span>
                </p>
              ))
            )}
          </div>
        </div>
      </div>

      {confirmGoLive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="go-live-confirm-title"
            className="w-full max-w-md overflow-hidden rounded-2xl border border-dt-border bg-dt-card shadow-2xl shadow-black/50"
          >
            <div className="border-b border-dt-border bg-gradient-to-br from-dt-red/20 to-transparent px-5 py-4">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-dt-red/20 text-dt-red">
                <Radio size={20} />
              </div>
              <h3 id="go-live-confirm-title" className="text-lg font-semibold text-white">
                Are you sure you want to go live?
              </h3>
            </div>
            <div className="space-y-3 px-5 py-4 text-sm leading-relaxed text-white/70">
              <p>
                If you hit <span className="font-semibold text-white">Yes</span>, your camera will start broadcasting on {fanAppName} right away.
              </p>
              <p>
                Fans will see <span className="font-semibold text-dt-green">LIVE NOW</span> on the home screen and can join your live video and chat.
              </p>
            </div>
            <div className="flex gap-3 border-t border-dt-border px-5 py-4">
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirmGoLive(false)}
                className="flex-1 rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-white hover:bg-white/[0.05] disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setConfirmGoLive(false);
                  void handleGoLive();
                }}
                className="flex-1 rounded-xl bg-dt-red px-4 py-3 text-sm font-bold text-white hover:brightness-110 disabled:opacity-40"
              >
                Yes, go live
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
