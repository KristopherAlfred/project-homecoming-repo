import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  fetchAthleteTheme,
  fetchBioLink,
  resolveCurrentAthlete,
  type Athlete,
  type AthleteBioLink,
  type AthleteTheme,
} from "../lib/athletes";
import { loadDashboardSession } from "../lib/dashboardAuth";
import { AthleteThemeSync } from "../theme/AthleteThemeSync";

/**
 * The logged-in athlete, their theme and their bio link. Every dashboard
 * surface reads names, sport and branding from here instead of hardcoding
 * a single athlete.
 */

type AthleteContextValue = {
  athlete: Athlete | null;
  theme: AthleteTheme | null;
  bioLink: AthleteBioLink | null;
  loading: boolean;
  /** Display name → first name → session name → neutral fallback. */
  displayName: string;
  firstName: string;
  sport: string;
  /** The athlete's fan-app brand name, e.g. "Sloane Glo". */
  fanAppName: string;
  refresh: () => Promise<void>;
};

const FALLBACK_NAME = "Athlete";

const AthleteContext = createContext<AthleteContextValue>({
  athlete: null,
  theme: null,
  bioLink: null,
  loading: true,
  displayName: FALLBACK_NAME,
  firstName: FALLBACK_NAME,
  sport: "",
  fanAppName: "Fan App",
  refresh: async () => {},
});

export function useAthlete() {
  return useContext(AthleteContext);
}

export function AthleteProvider({ children }: { children: ReactNode }) {
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [theme, setTheme] = useState<AthleteTheme | null>(null);
  const [bioLink, setBioLink] = useState<AthleteBioLink | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const current = await resolveCurrentAthlete();
      setAthlete(current);
      if (current) {
        const [nextTheme, nextLink] = await Promise.all([
          fetchAthleteTheme(current.id),
          fetchBioLink(current.id),
        ]);
        setTheme(nextTheme);
        setBioLink(nextLink);
      } else {
        setTheme(null);
        setBioLink(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const value = useMemo<AthleteContextValue>(() => {
    const sessionName = loadDashboardSession()?.name?.trim();
    const displayName =
      athlete?.display_name?.trim() || athlete?.full_name?.trim() || sessionName || FALLBACK_NAME;

    return {
      athlete,
      theme,
      bioLink,
      loading,
      displayName,
      firstName: displayName.split(/\s+/)[0] || FALLBACK_NAME,
      sport: athlete?.sport ?? "",
      fanAppName: theme?.fan_app_name?.trim() || `${displayName.split(/\s+/)[0]} Fan App`,
      refresh: load,
    };
  }, [athlete, theme, bioLink, loading, load]);

  return (
    <AthleteContext.Provider value={value}>
      <AthleteThemeSync />
      {children}
    </AthleteContext.Provider>
  );
}
