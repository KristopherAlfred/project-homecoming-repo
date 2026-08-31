import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "@/lib/router-compat";
import { ArrowLeft, ArrowRight, Sparkles, Volume2, VolumeX, X } from "lucide-react";
import {
  fetchOnboardingComplete,
  setOnboardingComplete,
} from "../../lib/onboardingState";
import { fetchPlatformConnections } from "../../lib/platformConnections";
import introVideo from "../../assets/intro_vid.mp4.asset.json";
import introCaptions from "../../assets/intro_vid.vtt.asset.json";

export type TourStep = {
  id: string;
  title: string;
  body: string;
  /** CSS selector of the element to spotlight. Omit for a centered step. */
  target?: string;
  /** Route the tour should be on for this step. */
  route?: string;
  ctaLabel?: string;
  /** Which side of the spotlight the video card should sit on. */
  side?: "left" | "right";
  /** Timestamp (seconds) in the presenter video where this step begins. */
  startAt: number;
};


/** Full 7-step walkthrough. */
export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    startAt: 0,
    title: "Welcome to your Players OS",
    body: "This is your home base for performance, content and audience data across every platform — all in one place.",
    route: "/",
  },
  {
    id: "settings",
    startAt: 18.3,
    title: "Start in Settings",
    body: "Connecting your accounts here is what powers real data everywhere else. Start with your most active platform.",
    target: '[data-tour="nav-settings"]',
    route: "/settings",
  },
  {
    id: "connectors",
    startAt: 38.4,
    title: "Your connector cards",
    body: "Connect adds an account, Configure tweaks a live one and Disconnect removes it. The status dot and “Synced” text show how fresh the data is.",
    target: '[data-tour="connector-cards"]',
    route: "/settings",
    side: "left",
  },
  {
    id: "overview",
    startAt: 62.4,
    title: "Dashboard Overview",
    body: "Stat cards and the Followers Over Time chart fill in automatically as soon as a platform is connected.",
    target: '[data-tour="kpi-cards"]',
    route: "/",
    side: "left",
  },
  {
    id: "platforms",
    startAt: 82.8,
    title: "Platforms",
    body: "Drill into any single platform for Social Blade–style analytics: growth charts, recent posts and engagement.",
    target: '[data-tour="nav-platforms"]',
    route: "/platforms",
    side: "left",
  },

  {
    id: "sections",
    startAt: 101.8,
    title: "The rest of your sidebar",
    body: "Experience is your fan-facing hub, Fans & Data holds audience and subscriber lists, Performance tracks results, Monetization covers revenue and Engagement handles messages and notifications.",
    target: '[data-tour="nav-fans & data"]',
    route: "/",
  },
  {
    id: "done",
    startAt: 118.4,
    title: "You're all set",
    body: "Revisit this tour anytime from the help icon up top. Next up: connect your first platform.",
    route: "/",
    ctaLabel: "Connect a platform",
  },
];


type OnboardingContextValue = {
  start: () => void;
  active: boolean;
};

const OnboardingContext = createContext<OnboardingContextValue>({
  start: () => {},
  active: false,
});

export function useOnboarding() {
  return useContext(OnboardingContext);
}

type Rect = { top: number; left: number; width: number; height: number };

function useTargetRect(selector: string | undefined, stepIndex: number) {
  const [rect, setRect] = useState<Rect | null>(null);

  useLayoutEffect(() => {
    if (!selector) {
      setRect(null);
      return;
    }
    let frame = 0;
    const measure = () => {
      const el = document.querySelector(selector);
      if (!el) {
        setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    measure();
    frame = window.setInterval(measure, 200);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.clearInterval(frame);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [selector, stepIndex]);

  return rect;
}

function TourOverlay({
  steps,
  index,
  onNext,
  onBack,
  onSkip,
  onSeekStep,
}: {
  steps: TourStep[];
  index: number;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  onSeekStep: (i: number) => void;
}) {
  const step = steps[index];
  const rect = useTargetRect(step.target, index);
  const isLast = index === steps.length - 1;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [dragPos, setDragPos] = useState<{ top: number; left: number } | null>(null);
  const [muted, setMuted] = useState(false);
  const [needsSound, setNeedsSound] = useState(false);

  // Autoplay the presenter video (fall back to muted if the browser blocks it).
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.play().catch(() => {
      v.muted = true;
      setMuted(true);
      setNeedsSound(true);
      void v.play().catch(() => {});
    });
  }, []);

  // Keep the video in sync when the user jumps steps manually.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const target = steps[index].startAt;
    if (Math.abs(v.currentTime - target) > 1.5) {
      const next = steps[index + 1]?.startAt ?? Infinity;
      if (v.currentTime < target || v.currentTime >= next) v.currentTime = target;
    }
  }, [index, steps]);

  // Advance the spotlight as the video reaches each scene.
  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    let next = 0;
    steps.forEach((s, i) => {
      if (v.currentTime + 0.15 >= s.startAt) next = i;
    });
    if (next !== index) onSeekStep(next);
  }, [steps, index, onSeekStep]);

  const enableSound = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = false;
    setMuted(false);
    setNeedsSound(false);
    void v.play().catch(() => {});
  }, []);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    setNeedsSound(false);
  }, []);

  // Each new scene re-positions the video automatically.
  useEffect(() => {
    setDragPos(null);
  }, [index]);

  // Bring the spotlighted element into view (page stays freely scrollable).
  useEffect(() => {
    if (!step.target) return;
    const el = document.querySelector(step.target);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [step.target, index]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") onNext();
      else if (e.key === "ArrowLeft") onBack();
      else if (e.key === "Escape") onSkip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onNext, onBack, onSkip]);



  const pad = 8;
  const spotlight = rect
    ? {
        top: rect.top - pad,
        left: rect.left - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }
    : null;

  const CARD_W = Math.min(420, window.innerWidth - 32);

  const autoStyle: React.CSSProperties = spotlight
    ? {
        top: Math.min(
          Math.max(spotlight.top, 16),
          Math.max(window.innerHeight - 560, 16),
        ),
        left:
          step.side === "left"
            ? Math.max(spotlight.left - CARD_W - 18, 16)
            : Math.min(
                spotlight.left + spotlight.width + 18,
                Math.max(window.innerWidth - CARD_W - 16, 16),
              ),
      }
    : {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };

  const dragged = dragPos !== null;
  const cardStyle: React.CSSProperties = dragged
    ? { top: dragPos.top, left: dragPos.left }
    : autoStyle;

  const startDrag = (e: React.PointerEvent) => {
    const el = cardRef.current;
    if (!el) return;
    if ((e.target as HTMLElement).closest("button, a, video, input, textarea")) return;
    const r = el.getBoundingClientRect();
    const offX = e.clientX - r.left;
    const offY = e.clientY - r.top;
    const move = (ev: PointerEvent) => {
      setDragPos({
        left: Math.min(
          Math.max(ev.clientX - offX, 8),
          window.innerWidth - r.width - 8,
        ),
        top: Math.min(
          Math.max(ev.clientY - offY, 8),
          window.innerHeight - Math.min(r.height, window.innerHeight - 16) - 8,
        ),
      });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[200]">
      <style>{`
        @keyframes amx-tour-ring { 0%,100% { opacity:.55; transform:scale(1); } 50% { opacity:1; transform:scale(1.012); } }
        @keyframes amx-tour-sheen { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
        @keyframes amx-tour-card { 0% { opacity:0; transform: translate3d(0,10px,0) scale(.97); } 100% { opacity:1; transform: translate3d(var(--tour-final-x,0), var(--tour-final-y,0), 0) scale(1); } }
      `}</style>

      {/* Dimmer + spotlight */}
      {spotlight ? (
        <div
          className="pointer-events-none absolute rounded-xl transition-all duration-500"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
            transitionTimingFunction: "cubic-bezier(.22,1,.36,1)",
            boxShadow:
              "0 0 0 9999px rgba(0,0,0,0.72), 0 0 0 1.5px var(--theme-accent), 0 0 34px 6px color-mix(in srgb, var(--theme-accent) 45%, transparent), inset 0 0 24px color-mix(in srgb, var(--theme-accent) 14%, transparent)",
            animation: "amx-tour-ring 2.4s ease-in-out infinite",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-[3px] transition-opacity duration-500" />
      )}

      <div
        ref={cardRef}
        onPointerDown={startDrag}
        className="pointer-events-auto absolute w-[min(420px,calc(100vw-32px))] cursor-grab overflow-hidden rounded-2xl bg-dt-card/95 p-[1.5px] shadow-[0_28px_70px_rgba(0,0,0,0.7)] backdrop-blur-xl transition-[top,left] duration-500 active:cursor-grabbing"
        style={{
          ...cardStyle,
          "--tour-final-x": !dragged && !spotlight ? "-50%" : "0",
          "--tour-final-y": !dragged && !spotlight ? "-50%" : "0",
          transitionTimingFunction: "cubic-bezier(.22,1,.36,1)",
          animation: "amx-tour-card .45s cubic-bezier(.22,1,.36,1) both",
          background:
            "linear-gradient(110deg, color-mix(in srgb, var(--theme-accent) 60%, transparent), rgba(255,255,255,0.06) 35%, rgba(255,255,255,0.04) 65%, color-mix(in srgb, var(--theme-accent) 45%, transparent)) 0% 50% / 200% 100%",
          animationName: "amx-tour-card",
        } as React.CSSProperties}
      >


        <div
          className="relative overflow-y-auto rounded-[15px] bg-dt-card p-5"
          style={{ maxHeight: "min(560px, 90vh)" }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.5]"
            style={{
              background:
                "radial-gradient(120% 90% at 0% 0%, color-mix(in srgb, var(--theme-accent) 12%, transparent), transparent 60%)",
            }}
          />

          <div className="relative">
            <button
              type="button"
              onClick={onSkip}
              className="absolute right-0 top-0 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-white/45 transition hover:bg-white/5 hover:text-white"
            >
              <X size={12} /> Skip tutorial
            </button>

            {/* Presenter video */}
            <div className="relative mt-7 overflow-hidden rounded-xl border border-dt-border bg-black">
              <video
                ref={videoRef}
                src={introVideo.url}
                playsInline
                autoPlay
                onTimeUpdate={handleTimeUpdate}
                onEnded={onSkip}
                crossOrigin="anonymous"
                className="block aspect-video w-full object-cover"
              >
                <track
                  kind="captions"
                  src={introCaptions.url}
                  srcLang="en"
                  label="English"
                  default
                />
              </video>
              <button
                type="button"
                onClick={needsSound ? enableSound : toggleMute}
                className="absolute bottom-2 right-2 inline-flex items-center gap-1.5 rounded-lg bg-black/65 px-2 py-1 text-[10px] font-semibold text-white/85 backdrop-blur transition hover:bg-black/80"
              >
                {muted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                {needsSound ? "Tap for sound" : muted ? "Unmute" : "Mute"}
              </button>
            </div>

            <div className="mt-3" />



            <div
              className="mb-3 inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{
                color: "var(--theme-accent)",
                borderWidth: 1,
                borderColor: "color-mix(in srgb, var(--theme-accent) 32%, transparent)",
                background: "color-mix(in srgb, var(--theme-accent) 10%, transparent)",
              }}
            >
              <Sparkles size={11} />
              Step {index + 1} of {steps.length}
            </div>

            <h3 className="font-display text-lg font-semibold leading-tight tracking-tight text-white">
              {step.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-white/60">{step.body}</p>

            {/* Progress bar */}
            <div className="mt-4 h-[3px] w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{
                  width: `${((index + 1) / steps.length) * 100}%`,
                  background:
                    "linear-gradient(90deg, color-mix(in srgb, var(--theme-accent) 55%, transparent), var(--theme-accent))",
                  boxShadow: "0 0 12px color-mix(in srgb, var(--theme-accent) 60%, transparent)",
                  transitionTimingFunction: "cubic-bezier(.22,1,.36,1)",
                }}
              />
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30">
                ← → to navigate
              </span>
              <div className="flex items-center gap-2">
                {index > 0 ? (
                  <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-dt-border px-3 py-2 text-xs font-semibold text-white/70 transition hover:border-white/25 hover:text-white"
                  >
                    <ArrowLeft size={13} /> Back
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={onNext}
                  className="group inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-black transition hover:brightness-110"
                  style={{
                    background:
                      "linear-gradient(120deg, var(--theme-accent), color-mix(in srgb, var(--theme-accent) 70%, #ffffff))",
                    boxShadow: "0 10px 26px color-mix(in srgb, var(--theme-accent) 32%, transparent)",
                  }}
                >
                  {step.ctaLabel ?? (isLast ? "Finish" : "Next")}
                  {!isLast ? (
                    <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                  ) : null}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}


export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const steps = TOUR_STEPS;

  const start = useCallback(() => {
    setIndex(0);
    setActive(true);
  }, []);

  const finish = useCallback(
    (goConnect = false) => {
      setActive(false);
      void setOnboardingComplete(true);
      if (goConnect) navigate("/settings");
    },
    [navigate],
  );

  // Auto-trigger on first login, only while nothing is connected yet.
  useEffect(() => {
    let cancelled = false;
    void Promise.all([fetchOnboardingComplete(), fetchPlatformConnections()]).then(
      ([done, connections]) => {
        const anyConnected = connections.some((c) => c.connected);
        if (!cancelled && !done && !anyConnected) setActive(true);
      },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  // Keep the app on the route a step points at.
  useEffect(() => {
    if (!active) return;
    const route = steps[index]?.route;
    if (route && location.pathname !== route) navigate(route);
  }, [active, index, steps, location.pathname, navigate]);

  const value = useMemo(() => ({ start, active }), [start, active]);

  return (
    <OnboardingContext.Provider value={value}>
      {children}
      {active ? (
        <TourOverlay
          steps={steps}
          index={index}
          onSeekStep={setIndex}
          onSkip={() => finish()}

          onBack={() => setIndex((i) => Math.max(0, i - 1))}
          onNext={() => {
            if (index >= steps.length - 1) finish(true);
            else setIndex(index + 1);
          }}
        />
      ) : null}
    </OnboardingContext.Provider>
  );
}

