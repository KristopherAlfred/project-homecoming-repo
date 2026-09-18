import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "@/lib/router-compat";
import { Loader2, Lock } from "lucide-react";

import { FanAppPageView } from "../components/experience/ExperienceAppPreview";
import { JoinAuthSheet } from "../components/experience/JoinFlow";
import { FanLiveAlert, useFanLiveState } from "../components/experience/FanLiveExperience";
import type { ExperienceConfig, ExperiencePageKeyName } from "../lib/experienceConfig";
import { themeBackgroundCss } from "../lib/experienceConfig";
import { fetchPublicFanApp, registerFanAppView } from "../lib/fanAppPublish";

/**
 * Public fan-app viewer: /app/:slug renders the exact experience the athlete
 * published from the studio — real navigation, real join flow, no dashboard.
 */
export function FanAppPublicPage() {
  const { slug = "" } = useParams();
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");
  const [experience, setExperience] = useState<ExperienceConfig | null>(null);
  const [appName, setAppName] = useState("");
  const [athleteId, setAthleteId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const record = await fetchPublicFanApp(slug);
      if (!active) return;
      if (!record || !record.is_published) {
        setState("missing");
        return;
      }
      setExperience(record.config);
      setAthleteId(record.athlete_id);
      setAppName(record.app_name || record.config.brand.wordmark || "Fan app");
      setState("ready");
      void registerFanAppView(slug);
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    if (appName) document.title = `${appName} · Fan app`;
  }, [appName]);

  if (state === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white/60">
        <Loader2 className="mr-2 animate-spin" size={18} /> Loading experience…
      </div>
    );
  }

  if (state === "missing" || !experience) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-black px-6 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 text-white/50">
          <Lock size={18} />
        </span>
        <h1 className="font-display text-xl text-white">This fan app isn&apos;t live yet</h1>
        <p className="max-w-sm text-sm text-white/50">
          The link may have changed, or the athlete hasn&apos;t published their experience yet.
        </p>
      </div>
    );
  }

  return <FanAppRuntime experience={experience} athleteId={athleteId} />;
}

function FanAppRuntime({ experience, athleteId }: { experience: ExperienceConfig; athleteId: string | null }) {
  const [pageKey, setPageKey] = useState<ExperiencePageKeyName>("landing");
  const [unlock, setUnlock] = useState(false);
  const page = experience.pages[pageKey];
  const backdrop = useMemo(() => themeBackgroundCss(experience.theme), [experience.theme]);
  const liveState = useFanLiveState(athleteId);
  const swipeStart = useRef<number | null>(null);
  const visibleTabs = useMemo(() => (experience.nav?.tabs ?? []).filter((tab) => !tab.hidden), [experience.nav?.tabs]);

  const navigateBySwipe = (direction: number) => {
    const index = visibleTabs.findIndex((tab) => tab.pageKey === pageKey);
    if (index < 0) return;
    const next = visibleTabs[index + direction];
    if (next) setPageKey(next.pageKey);
  };

  const onCta = () => {
    if (pageKey === "landing") {
      setUnlock(true);
      return;
    }
    if (pageKey === "youreIn") {
      setPageKey("home");
      return;
    }
    const next = (experience.nav?.tabs ?? []).find((t) => !t.hidden && t.pageKey !== pageKey);
    if (next) setPageKey(next.pageKey);
  };

  const screen = (
    <div
      className="relative h-full w-full overflow-hidden"
      onPointerDown={(event) => { swipeStart.current = event.clientX; }}
      onPointerUp={(event) => {
        if (swipeStart.current === null) return;
        const distance = event.clientX - swipeStart.current;
        swipeStart.current = null;
        if (Math.abs(distance) > 64 && pageKey !== "landing" && pageKey !== "youreIn") navigateBySwipe(distance < 0 ? 1 : -1);
      }}
    >
      <FanAppPageView experience={experience} pageKey={pageKey} onNavigate={setPageKey} onCta={onCta} athleteId={athleteId} />
      {pageKey !== "live" && pageKey !== "youreIn" ? <FanLiveAlert state={liveState} onOpen={() => setPageKey("live")} /> : null}
      {unlock && pageKey === "landing" ? (
        <JoinAuthSheet
          page={page}
          onSelect={() => {
            setUnlock(false);
            setPageKey("youreIn");
          }}
          onClose={() => setUnlock(false)}
        />
      ) : null}
    </div>
  );

  return (
    <div className="min-h-screen w-full" style={{ background: backdrop || "#050505" }}>
      {/* Phone-first: the app fills the screen on mobile */}
      <div className="md:hidden h-[100dvh] w-full">{screen}</div>

      {/* Desktop: framed device on the athlete's brand backdrop */}
      <div className="hidden min-h-screen flex-col items-center justify-center gap-5 py-10 md:flex">
        <div className="rounded-[2.9rem] border border-white/12 bg-gradient-to-b from-white/[0.14] to-white/[0.02] p-[10px] shadow-[0_40px_120px_rgba(0,0,0,0.65)]">
          <div className="relative h-[760px] w-[372px] overflow-hidden rounded-[2.4rem] bg-black">
            <span className="pointer-events-none absolute left-1/2 top-2.5 z-[200] h-6 w-24 -translate-x-1/2 rounded-full bg-black" />
            {screen}
            <span className="pointer-events-none absolute bottom-1.5 left-1/2 z-[200] h-1 w-28 -translate-x-1/2 rounded-full bg-white/35" />
          </div>
        </div>
        <p className="text-[11px] uppercase tracking-[0.22em] text-white/30">
          {experience.brand.wordmark || "Fan app"} · powered by PlayersOS
        </p>
      </div>
    </div>
  );
}

export default FanAppPublicPage;
