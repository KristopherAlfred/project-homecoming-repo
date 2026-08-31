import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { fetchTwitterAnalytics, type TwitterAnalytics } from "../lib/twitterAnalyticsApi";
import { useDashboardSource } from "./DashboardSourceContext";

type TwitterAnalyticsContextValue = {
  analytics: TwitterAnalytics | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const TwitterAnalyticsContext = createContext<TwitterAnalyticsContextValue | null>(null);

async function loadTwitterAnalytics() {
  const data = await fetchTwitterAnalytics();
  if (!data) {
    return {
      analytics: null,
      error: "X analytics request failed. Try again in a moment.",
    };
  }
  return { analytics: data, error: null };
}

export function TwitterAnalyticsProvider({ children }: { children: ReactNode }) {
  const { source } = useDashboardSource();
  const [analytics, setAnalytics] = useState<TwitterAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    const result = await loadTwitterAnalytics();
    setAnalytics(result.analytics);
    setError(result.error);
    setLoading(false);
  };

  useEffect(() => {
    if (source !== "twitter") {
      setAnalytics(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const result = await loadTwitterAnalytics();
      if (cancelled) return;
      setAnalytics(result.analytics);
      setError(result.error);
      setLoading(false);
    }

    void load();
    const interval = window.setInterval(() => {
      void load();
    }, 120_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [source]);

  const value = useMemo(
    () => ({
      analytics,
      loading,
      error,
      refresh,
    }),
    [analytics, loading, error],
  );

  return (
    <TwitterAnalyticsContext.Provider value={value}>{children}</TwitterAnalyticsContext.Provider>
  );
}

export function useTwitterAnalytics() {
  const context = useContext(TwitterAnalyticsContext);
  if (!context) {
    throw new Error("useTwitterAnalytics must be used within TwitterAnalyticsProvider");
  }
  return context;
}
