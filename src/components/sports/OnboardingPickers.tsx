import { useMemo, useState } from "react";
import { Check, Plus, Search } from "lucide-react";
import {
  TIER_LABELS,
  leagueLogoUrl,
  type League,
  type Sport,
} from "../../lib/sportsCatalog";
import {
  LEAGUE_TEAM_COUNTS,
  LEVELS,
  findLevel,
  rolesForSport,
  teamLogoUrl,
  teamsForLeague,
  type Team,
} from "../../lib/sportsTeams";
import { BallIcon } from "./BallIcons";

/**
 * Onboarding steps that follow the sport pick: competition level, league, team
 * and playing role. Each one is its own page so the flow stays focused.
 */

const searchClass =
  "w-full rounded-xl border border-white/12 bg-black/50 py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-dt-red/60";

function Logo({ url, fallback }: { url: string | null; fallback: React.ReactNode }) {
  const [failed, setFailed] = useState(false);
  if (!url || failed) return <>{fallback}</>;
  return (
    <img
      src={url}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-8 w-8 shrink-0 object-contain"
    />
  );
}

/* ------------------------------- Level step ------------------------------- */

export function LevelPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (levelId: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {LEVELS.map((level) => {
        const active = value === level.id;
        return (
          <button
            key={level.id}
            type="button"
            onClick={() => onChange(level.id)}
            aria-pressed={active}
            className={`group relative flex h-full flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 ${
              active
                ? "border-dt-red bg-dt-red/10"
                : "border-white/10 bg-white/[0.03] hover:border-white/25"
            }`}
          >
            {active && (
              <span className="animate-bubble-pop absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-dt-red text-white">
                <Check size={12} strokeWidth={3} />
              </span>
            )}
            <span className="text-sm font-semibold text-white">{level.label}</span>
            <span className="text-[11px] leading-snug text-white/45">{level.hint}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------- League step ------------------------------ */

export function LeaguePicker({
  sport,
  levelId,
  value,
  onChange,
}: {
  sport: Sport | null;
  levelId: string;
  value: string;
  onChange: (league: League | null, customLabel?: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [custom, setCustom] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const level = findLevel(levelId);
  const leagues = useMemo(() => {
    const all = sport?.leagues ?? [];
    const scoped = level ? all.filter((item) => level.tiers.includes(item.tier)) : all;
    const pool = scoped.length ? scoped : all;
    const q = query.trim().toLowerCase();
    return q ? pool.filter((item) => item.label.toLowerCase().includes(q)) : pool;
  }, [sport, level, query]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
        <input
          className={searchClass}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search leagues..."
          aria-label="Search leagues"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {leagues.map((item) => {
          const active = value === item.label || value === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setShowCustom(false);
                onChange(item);
              }}
              aria-pressed={active}
              className={`animate-bubble-pop relative flex h-full flex-col items-start gap-2 rounded-2xl border p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                active
                  ? "border-dt-red bg-dt-red/10"
                  : "border-white/10 bg-white/[0.03] hover:border-white/25"
              }`}
            >
              {active && (
                <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-dt-red text-white">
                  <Check size={12} strokeWidth={3} />
                </span>
              )}
              <Logo
                url={leagueLogoUrl(item)}
                fallback={<BallIcon kind={sport?.ball ?? "generic"} size={28} />}
              />
              <span className="text-sm font-semibold leading-tight text-white">{item.label}</span>
              <span className="text-[11px] leading-snug text-white/45">
                {TIER_LABELS[item.tier]} {sport?.label ?? ""}
              </span>
              {LEAGUE_TEAM_COUNTS[item.id] ? (
                <span className="mt-auto pt-1 text-[10px] uppercase tracking-wide text-white/35">
                  {LEAGUE_TEAM_COUNTS[item.id]} teams
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-dt-red/30 bg-dt-red/[0.06] p-3 text-center">
        {showCustom ? (
          <div className="flex items-center gap-2">
            <input
              className="min-w-0 flex-1 rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm text-white outline-none placeholder:text-white/35"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="Your league or organization"
              autoFocus
            />
            <button
              type="button"
              onClick={() => custom.trim() && onChange(null, custom.trim())}
              className="rounded-lg bg-dt-red px-3 py-2 text-xs font-semibold text-white"
            >
              Add
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowCustom(true)}
            className="text-xs text-white/60 transition hover:text-white"
          >
            Can&apos;t find your league?{" "}
            <span className="inline-flex items-center gap-1 font-semibold text-dt-red">
              <Plus size={12} /> Add another
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

/* -------------------------------- Team step ------------------------------- */

export function TeamPicker({
  sport,
  leagueId,
  leagueLabel,
  value,
  onChange,
}: {
  sport: Sport | null;
  leagueId: string;
  leagueLabel: string;
  value: string;
  onChange: (label: string) => void;
}) {
  const [query, setQuery] = useState("");
  const teams = teamsForLeague(leagueId);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return teams.slice(0, 8);
    return teams
      .filter(
        (item) =>
          item.label.toLowerCase().includes(q) || item.location.toLowerCase().includes(q),
      )
      .slice(0, 12);
  }, [teams, query]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
        <input
          className={searchClass}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search team, school, or club..."
          aria-label="Search teams"
        />
      </div>

      {teams.length > 0 ? (
        <>
          <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">
            {query ? "Results" : "Popular"}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {filtered.map((item: Team) => {
              const active = value === item.label;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onChange(item.label)}
                  aria-pressed={active}
                  className={`animate-bubble-pop relative flex items-center gap-3 rounded-xl border p-3 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                    active
                      ? "border-dt-red bg-dt-red/10"
                      : "border-white/10 bg-white/[0.03] hover:border-white/25"
                  }`}
                >
                  <Logo
                    url={teamLogoUrl(leagueId, item)}
                    fallback={<BallIcon kind={sport?.ball ?? "generic"} size={26} />}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-white">
                      {item.label}
                    </span>
                    <span className="block truncate text-[11px] text-white/45">
                      {leagueLabel} · {item.location}
                    </span>
                  </span>
                  {active && (
                    <Check size={14} className="ml-auto shrink-0 text-dt-red" strokeWidth={3} />
                  )}
                </button>
              );
            })}
          </div>
        </>
      ) : null}

      <div>
        <label className="mb-1.5 block text-xs font-medium text-white/80" htmlFor="team-custom">
          {teams.length ? "Or type your team, school or club" : "Your team, school or club"}
        </label>
        <input
          id="team-custom"
          className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/40 focus:border-dt-red/60"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={leagueLabel ? `e.g. ${leagueLabel} club` : "e.g. Riverside High"}
        />
      </div>
    </div>
  );
}

/* -------------------------------- Role step ------------------------------- */

export function RolePicker({
  sportId,
  value,
  onChange,
}: {
  sportId: string;
  value: string;
  onChange: (role: string) => void;
}) {
  const roles = rolesForSport(sportId);
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
      {roles.map((role) => {
        const active = value === role;
        return (
          <button
            key={role}
            type="button"
            onClick={() => onChange(role)}
            aria-pressed={active}
            className={`relative rounded-xl border px-3 py-2.5 text-sm transition-all duration-200 hover:-translate-y-0.5 ${
              active
                ? "border-dt-red bg-dt-red/10 font-semibold text-white"
                : "border-white/10 bg-white/[0.03] text-white/70 hover:border-white/25"
            }`}
          >
            {role}
            {active && (
              <span className="animate-bubble-pop absolute right-2 top-1/2 -translate-y-1/2 text-dt-red">
                <Check size={13} strokeWidth={3} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
