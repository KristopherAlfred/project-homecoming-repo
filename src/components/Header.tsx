import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "@/lib/router-compat";
import { SlidersHorizontal, Bell, Menu, Check, HelpCircle } from "lucide-react";
import {
  ALL_DASHBOARD_SOURCES,
  CONTENT_ALLOWED_SOURCES,
  isContentRoute,
  useDashboardSource,
  type DashboardSource,
} from "../contexts/DashboardSourceContext";
import { useOnboarding } from "./onboarding/OnboardingTour";
import {
  getDashboardAvatar,
  getDashboardAvatarRing,
  isDefaultAvatar,
  onDashboardAvatarChange,
} from "../lib/adminProfile";
import { useAthlete } from "../contexts/AthleteContext";

const filterOptions: { id: DashboardSource; label: string }[] = [
  { id: "overview", label: "Overview" },
  // The fan-app source is labelled with the athlete's own brand name.
  { id: "dametime", label: "__FAN_APP__" },
  { id: "instagram", label: "Instagram" },
  { id: "youtube", label: "YouTube" },
  { id: "facebook", label: "Facebook" },
  { id: "twitter", label: "X (Twitter)" },
];

export function Header({
  title,
  subtitle,
  onMenuClick,
}: {
  title: string;
  subtitle: string;
  onMenuClick?: () => void;
}) {
  const { pathname } = useLocation();
  const { source, setSource, sourceLabel, filterPulse } = useDashboardSource();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [avatar, setAvatar] = useState<string>(() => getDashboardAvatar());
  const [ringColor, setRingColor] = useState<string>(() => getDashboardAvatarRing());
  const filtersRef = useRef<HTMLDivElement>(null);
  const { start: startTour } = useOnboarding();
  const { fanAppName, displayName, athlete } = useAthlete();

  useEffect(
    () =>
      onDashboardAvatarChange(() => {
        setAvatar(getDashboardAvatar());
        setRingColor(getDashboardAvatarRing());
      }),
    [],
  );
  const photo = isDefaultAvatar(avatar) ? athlete?.profile_photo_url || "" : avatar;
  const onContent = isContentRoute(pathname);
  const allowed = onContent ? CONTENT_ALLOWED_SOURCES : ALL_DASHBOARD_SOURCES;

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!filtersRef.current?.contains(event.target as Node)) {
        setFiltersOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  return (
    <header className="shrink-0 border-b border-dt-border bg-dt-panel px-3 py-3 sm:px-4 sm:py-4 lg:px-6">
      <div className="flex min-w-0 items-start justify-between gap-2 sm:items-center sm:gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-2.5 sm:items-center sm:gap-3">
          <button
            type="button"
            aria-label="Open navigation menu"
            onClick={onMenuClick}
            className="mt-0.5 shrink-0 rounded-md border border-dt-border bg-dt-card p-2 text-white lg:hidden"
          >
            <Menu size={20} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold text-white sm:text-lg lg:text-xl">
              {title}
            </h1>
            <p className="mt-0.5 hidden truncate text-sm text-white sm:block">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 lg:gap-3">
          <div className="relative" ref={filtersRef}>
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={filtersOpen}
              onClick={() => setFiltersOpen((open) => !open)}
              className={`flex items-center gap-2 rounded-md border bg-dt-card px-2.5 py-2 text-sm lg:px-3 ${
                filterPulse
                  ? "animate-filter-pulse border-dt-red text-white"
                  : "border-dt-border text-[#d4d4d4]"
              }`}
            >
              <SlidersHorizontal
                size={14}
                className={`shrink-0 ${filterPulse ? "text-dt-red" : "text-dt-muted"}`}
              />
              <span className="hidden sm:inline">
                {source === "dametime" ? fanAppName : sourceLabel}
              </span>
              <span className="sm:hidden">Filter</span>
            </button>

            {filtersOpen && (
              <div
                role="listbox"
                aria-label="Dashboard data source"
                className="absolute right-0 z-50 mt-2 min-w-[200px] overflow-hidden rounded-md border border-dt-border bg-[#111111] shadow-xl"
              >
                {onContent ? (
                  <p className="border-b border-dt-border px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-white/40">
                    Content pages: Overview or {fanAppName} only
                  </p>
                ) : null}
                {filterOptions.map((rawOption) => {
                  const option =
                    rawOption.label === "__FAN_APP__"
                      ? { ...rawOption, label: fanAppName }
                      : rawOption;
                  const active = source === option.id;
                  const enabled = allowed.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="option"
                      aria-selected={active}
                      disabled={!enabled}
                      onClick={() => {
                        if (!enabled) return;
                        setSource(option.id);
                        setFiltersOpen(false);
                      }}
                      className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition ${
                        !enabled
                          ? "cursor-not-allowed text-white/25"
                          : active
                            ? "bg-dt-red/10 text-white hover:bg-white/5"
                            : "text-[#d4d4d4] hover:bg-white/5"
                      }`}
                    >
                      <span>{option.label}</span>
                      {active && enabled ? (
                        <Check size={14} className="shrink-0 text-dt-red" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            type="button"
            data-tour="help-button"
            title="Take the tour"
            aria-label="Take the tour"
            onClick={startTour}
            className="relative rounded-md border border-dt-border bg-dt-card p-2 text-[#d4d4d4] transition hover:border-dt-red/50 hover:text-white"
          >
            <HelpCircle size={18} />
          </button>

          <button
            type="button"
            className="relative hidden rounded-md border border-dt-border bg-dt-card p-2 text-[#d4d4d4] sm:inline-flex"
          >
            <Bell size={18} />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-dt-red" />
          </button>

          <Link
            to="/profile"
            title="View and edit your profile photo"
            className="hidden shrink-0 rounded-full transition hover:ring-2 hover:ring-dt-red/60 sm:block"
          >
            {photo ? (
              <img
                src={photo}
                alt={`${displayName} — open profile`}
                className="h-9 w-9 rounded-full border-2 object-cover object-top"
                style={{ borderColor: ringColor }}
              />
            ) : (
              <span
                aria-label={`${displayName} — open profile`}
                className="flex h-9 w-9 items-center justify-center rounded-full border-2 bg-black/60 text-xs font-semibold text-white/70"
                style={{ borderColor: ringColor }}
              >
                {displayName.slice(0, 1).toUpperCase() || "?"}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
