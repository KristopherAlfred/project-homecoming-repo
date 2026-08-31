import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type DashboardSource =
  | "overview"
  | "dametime"
  | "instagram"
  | "youtube"
  | "facebook"
  | "twitter";

export const CONTENT_ALLOWED_SOURCES: DashboardSource[] = ["overview", "dametime"];
export const ALL_DASHBOARD_SOURCES: DashboardSource[] = [
  "overview",
  "dametime",
  "instagram",
  "youtube",
  "facebook",
  "twitter",
];

type DashboardSourceContextValue = {
  source: DashboardSource;
  setSource: (source: DashboardSource) => void;
  sourceLabel: string;
  filterPulse: boolean;
  pulseFilterButton: () => void;
};

const DashboardSourceContext = createContext<DashboardSourceContextValue | null>(null);

const sourceLabels: Record<DashboardSource, string> = {
  overview: "Overview",
  // Overridden at render time with the athlete's own fan-app name.
  dametime: "Fan App",
  instagram: "Instagram",
  youtube: "YouTube",
  facebook: "Facebook",
  twitter: "X (Twitter)",
};

const PULSE_MS = 1800;

export function DashboardSourceProvider({ children }: { children: ReactNode }) {
  const [source, setSourceState] = useState<DashboardSource>("overview");
  const [filterPulse, setFilterPulse] = useState(false);
  const pulseTimerRef = useRef<number | null>(null);

  const setSource = useCallback((next: DashboardSource) => {
    setSourceState(next);
  }, []);

  const pulseFilterButton = useCallback(() => {
    setFilterPulse(true);
    if (pulseTimerRef.current != null) {
      window.clearTimeout(pulseTimerRef.current);
    }
    pulseTimerRef.current = window.setTimeout(() => {
      setFilterPulse(false);
      pulseTimerRef.current = null;
    }, PULSE_MS);
  }, []);

  const value = useMemo(
    () => ({
      source,
      setSource,
      sourceLabel: sourceLabels[source],
      filterPulse,
      pulseFilterButton,
    }),
    [source, setSource, filterPulse, pulseFilterButton],
  );

  return (
    <DashboardSourceContext.Provider value={value}>{children}</DashboardSourceContext.Provider>
  );
}

export function useDashboardSource() {
  const context = useContext(DashboardSourceContext);
  if (!context) {
    throw new Error("useDashboardSource must be used within DashboardSourceProvider");
  }
  return context;
}

export function isContentRoute(pathname: string) {
  return pathname === "/content" || pathname.startsWith("/content/");
}
