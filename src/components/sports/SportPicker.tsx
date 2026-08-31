import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  DIVISIONS,
  SPORTS,
  TIER_LABELS,
  findLeague,
  findSport,
  leagueLogoUrl,
  type League,
  type LeagueTier,
  type Sport,
} from "../../lib/sportsCatalog";
import { SPORT_PHOTOS, SPORT_TAGLINES } from "../../lib/sportPhotos";
import { BallIcon } from "./BallIcons";


/**
 * Visual sport / league / division picker. Sports are bubbles; tapping one pops
 * the league sheet down underneath it. The selected league's brand colour is
 * handed back so the dashboard theme follows the athlete's league.
 */

const TIER_ORDER: LeagueTier[] = ["pro", "college", "school", "youth", "intl"];

export type SportSelection = {
  sportId: string;
  sportLabel: string;
  leagueId: string;
  leagueLabel: string;
  accent: string;
  accentText: string;
};

type Props = {
  sportLabel: string;
  leagueLabel: string;
  division: string;
  onChange: (selection: SportSelection) => void;
  onDivisionChange: (division: string) => void;
  /** Leagues now live on their own onboarding page; hide the bubble sheet there. */
  showLeagues?: boolean;
};

export function LeagueMark({
  league: leagueItem,
  sport,
  size = 28,
}: {
  league: League | null;
  sport: Sport | null;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const url = leagueItem ? leagueLogoUrl(leagueItem) : null;

  if (!url || failed) {
    return <BallIcon kind={sport?.ball ?? "generic"} size={size} />;
  }

  return (
    <img
      src={url}
      alt={`${leagueItem?.label ?? "League"} logo`}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      className="rounded-md object-contain"
      style={{ width: size, height: size }}
    />
  );
}

export function SportPicker({
  sportLabel,
  leagueLabel,
  division,
  onChange,
  onDivisionChange,
  showLeagues = true,
}: Props) {
  const selectedSport = findSport(sportLabel);
  const selectedLeague = findLeague(selectedSport, leagueLabel);
  const [openSportId, setOpenSportId] = useState<string | null>(selectedSport?.id ?? null);

  function selectSport(sport: Sport) {
    setOpenSportId((current) => (current === sport.id ? null : sport.id));
    if (sport.id !== selectedSport?.id) {
      onChange({
        sportId: sport.id,
        sportLabel: sport.label,
        leagueId: "",
        leagueLabel: "",
        accent: sport.accent,
        accentText: sport.accentText,
      });
    }
  }

  function selectLeague(sport: Sport, leagueItem: League) {
    onChange({
      sportId: sport.id,
      sportLabel: sport.label,
      leagueId: leagueItem.id,
      leagueLabel: leagueItem.label,
      accent: leagueItem.accent,
      accentText: leagueItem.accentText,
    });
  }

  return (
    <div className="space-y-4">
      <div>



        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {SPORTS.map((sport) => {
            const active = selectedSport?.id === sport.id;
            return (
              <button
                key={sport.id}
                type="button"
                onClick={() => selectSport(sport)}
                aria-pressed={active}
                className={`group relative flex aspect-[9/10] flex-col justify-end overflow-hidden rounded-2xl border bg-black text-left transition-all duration-300 hover:-translate-y-1.5 ${
                  active ? "border-transparent" : "border-white/10 hover:border-white/25"
                }`}
                style={
                  active
                    ? {
                        boxShadow: `0 0 0 2px ${sport.accent}, 0 24px 55px -20px ${sport.accent}`,
                      }
                    : undefined
                }
              >
                <img
                  src={SPORT_PHOTOS[sport.id] ?? SPORT_PHOTOS.other}
                  alt=""
                  loading="lazy"
                  className={`absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] ease-out will-change-transform ${
                    active ? "scale-[1.06]" : "group-hover:scale-[1.12]"
                  }`}
                />
                <span className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent transition-opacity duration-500 group-hover:opacity-80" />
                {active && (
                  <span
                    className="absolute inset-0 opacity-40"
                    style={{
                      background: `linear-gradient(to top, ${sport.accent}55, transparent 60%)`,
                    }}
                  />
                )}
                <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <span
                    className="absolute inset-0"
                    style={{
                      background: `radial-gradient(120% 90% at 50% 110%, ${sport.accent}44, transparent 60%)`,
                    }}
                  />
                </span>

                {active && (
                  <span
                    className="animate-bubble-pop absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full shadow-lg"
                    style={{ backgroundColor: sport.accent, color: sport.accentText }}
                  >
                    <Check size={15} strokeWidth={3} />
                  </span>
                )}

                <span className="relative z-10 flex flex-col items-center gap-1 px-3 pb-5 transition-transform duration-500 group-hover:-translate-y-1">
                  <span className="text-center text-lg font-bold leading-tight text-white">
                    {sport.label}
                  </span>
                  <span className="text-center text-[12px] text-white/60">
                    {SPORT_TAGLINES[sport.id] ?? ""}
                  </span>
                </span>

                {active && (
                  <ChevronDown
                    size={14}
                    className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-black/80 text-white/70"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>


      {/* Bubble sheet that pops down under the sports grid */}
      {showLeagues && openSportId && selectedSport?.id === openSportId && (
        <div
          key={openSportId}
          className="animate-bubble-pop origin-top rounded-2xl border border-white/12 bg-black/60 p-3 shadow-2xl shadow-black/60"
          style={{ borderColor: `${selectedSport.accent}55` }}
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium text-white/80">
              {selectedSport.label} — team or league
            </p>
            {selectedLeague && (
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{ backgroundColor: selectedLeague.accent, color: selectedLeague.accentText }}
              >
                {selectedLeague.label}
              </span>
            )}
          </div>

          <div className="space-y-3">
            {TIER_ORDER.filter((tier) =>
              selectedSport.leagues.some((item) => item.tier === tier),
            ).map((tier) => (
              <div key={tier}>
                <p className="mb-1.5 text-[10px] uppercase tracking-[0.16em] text-white/35">
                  {TIER_LABELS[tier]}
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedSport.leagues
                    .filter((item) => item.tier === tier)
                    .map((item, index) => {
                      const active = selectedLeague?.id === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => selectLeague(selectedSport, item)}
                          aria-pressed={active}
                          className={`animate-bubble-pop flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-xs transition-all duration-200 hover:-translate-y-0.5 ${
                            active
                              ? "border-transparent text-white"
                              : "border-white/12 bg-white/5 text-white/70 hover:border-white/30"
                          }`}
                          style={{
                            animationDelay: `${Math.min(index * 35, 240)}ms`,
                            ...(active
                              ? {
                                  backgroundColor: `${item.accent}2e`,
                                  boxShadow: `0 0 0 1.5px ${item.accent}`,
                                }
                              : {}),
                          }}
                        >
                          <LeagueMark league={item} sport={selectedSport} size={18} />
                          <span className="whitespace-nowrap">{item.label}</span>
                          {active && <Check size={12} style={{ color: item.accent }} />}
                        </button>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-xs font-medium text-white/80">Division</p>
        <div className="flex flex-wrap gap-2">
          {DIVISIONS.map((option) => {
            const active = division === option.id;
            return (
              <button
                key={option.label}
                type="button"
                onClick={() => onDivisionChange(option.id)}
                aria-pressed={active}
                title={option.hint}
                className={`rounded-full border px-3 py-1.5 text-xs transition-all duration-200 hover:-translate-y-0.5 ${
                  active
                    ? "border-transparent bg-white/12 font-semibold text-white"
                    : "border-white/12 bg-black/40 text-white/60 hover:border-white/30"
                }`}
                style={
                  active && selectedLeague
                    ? { boxShadow: `0 0 0 1.5px ${selectedLeague.accent}` }
                    : active
                      ? { boxShadow: "0 0 0 1.5px rgba(255,255,255,0.35)" }
                      : undefined
                }
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
