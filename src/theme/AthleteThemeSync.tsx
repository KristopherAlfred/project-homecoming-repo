import { useEffect, useRef } from "react";
import { useAthlete } from "../contexts/AthleteContext";
import { findLeague, findSport } from "../lib/sportsCatalog";
import { setAccentOverride, setAccentOverrideEnabled } from "./themes";

/**
 * Pushes the athlete's own accent — their league brand colour when they picked
 * one in onboarding, otherwise their saved theme accent — into the global CSS
 * tokens so the whole dashboard follows what the athlete selected.
 */
export function AthleteThemeSync() {
  const { athlete, theme } = useAthlete();

  const sportId = athlete?.sport_icon || athlete?.sport || null;
  const leagueLabel = athlete?.team_or_league ?? null;

  const prevAccent = useRef<string | null>(null);

  useEffect(() => {
    const sport = findSport(sportId);
    const league = findLeague(sport, leagueLabel);
    const accent = theme?.accent_color || league?.accent || sport?.accent || null;
    const accentHover = theme?.accent_hover || null;
    // A fresh onboarding / league colour takes the wheel back from a manually
    // picked Settings template.
    if (accent && prevAccent.current && accent !== prevAccent.current) {
      setAccentOverrideEnabled(true);
      localStorage.removeItem("playersos-theme-template.manual");
    }
    prevAccent.current = accent;
    setAccentOverride(accent, accentHover);
    return () => setAccentOverride(null);
  }, [sportId, leagueLabel, theme?.accent_color, theme?.accent_hover]);

  return null;
}
