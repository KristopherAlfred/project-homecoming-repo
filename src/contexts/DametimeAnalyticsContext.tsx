import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { fetchDametimeAnalytics, type DametimeAnalytics } from "../lib/dametimeAnalyticsApi";
import { useDashboardSource } from "./DashboardSourceContext";

type DametimeAnalyticsContextValue = {
  analytics: DametimeAnalytics | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const DametimeAnalyticsContext = createContext<DametimeAnalyticsContextValue | null>(null);

async function loadDametimeAnalytics() {
  try {
    const data = await fetchDametimeAnalytics();
    return { analytics: data, error: null as string | null };
  } catch (err) {
    return {
      analytics: null,
      error: err instanceof Error ? err.message : "Failed to load fan app analytics.",
    };
  }
}

export function DametimeAnalyticsProvider({ children }: { children: ReactNode }) {
  const { source } = useDashboardSource();
  const [analytics, setAnalytics] = useState<DametimeAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasDataRef = useRef(false);

  const refresh = useCallback(async () => {
    if (hasDataRef.current) setRefreshing(true);
    else setLoading(true);
    setError(null);
    const result = await loadDametimeAnalytics();
    setAnalytics(result.analytics);
    hasDataRef.current = Boolean(result.analytics);
    setError(result.error);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    if (source !== "dametime") {
      setAnalytics(null);
      hasDataRef.current = false;
      setLoading(false);
      setRefreshing(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function load(quiet: boolean) {
      if (!quiet) {
        if (hasDataRef.current) setRefreshing(true);
        else setLoading(true);
      }
      setError(null);
      const result = await loadDametimeAnalytics();
      if (cancelled) return;
      setAnalytics(result.analytics);
      hasDataRef.current = Boolean(result.analytics);
      setError(result.error);
      setLoading(false);
      setRefreshing(false);
    }

    void load(false);
    // Poll often enough that daily login points show up without a full remount.
    const interval = window.setInterval(() => {
      void load(true);
    }, 20_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [source]);

  const value = useMemo(
    () => ({
      analytics,
      loading,
      refreshing,
      error,
      refresh,
    }),
    [analytics, loading, refreshing, error, refresh],
  );

  return (
    <DametimeAnalyticsContext.Provider value={value}>{children}</DametimeAnalyticsContext.Provider>
  );
}

export function useDametimeAnalytics() {
  const context = useContext(DametimeAnalyticsContext);
  if (!context) {
    throw new Error("useDametimeAnalytics must be used within DametimeAnalyticsProvider");
  }
  return context;
}
