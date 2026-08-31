import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { fetchInstagramAnalytics, type InstagramAnalytics } from "../lib/instagramAnalyticsApi";
import { useDashboardSource } from "./DashboardSourceContext";

type InstagramAnalyticsContextValue = {
  analytics: InstagramAnalytics | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const InstagramAnalyticsContext = createContext<InstagramAnalyticsContextValue | null>(null);

async function loadInstagramAnalytics() {
  const data = await fetchInstagramAnalytics();
  if (!data) {
    return {
      analytics: null,
      error: "Instagram analytics request failed. Try again in a moment.",
    };
  }
  return { analytics: data, error: null };
}

export function InstagramAnalyticsProvider({ children }: { children: ReactNode }) {
  const { source } = useDashboardSource();
  const [analytics, setAnalytics] = useState<InstagramAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    const result = await loadInstagramAnalytics();
    setAnalytics(result.analytics);
    setError(result.error);
    setLoading(false);
  };

  useEffect(() => {
    if (source !== "instagram") {
      setAnalytics(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const result = await loadInstagramAnalytics();
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
    <InstagramAnalyticsContext.Provider value={value}>
      {children}
    </InstagramAnalyticsContext.Provider>
  );
}

export function useInstagramAnalytics() {
  const context = useContext(InstagramAnalyticsContext);
  if (!context) {
    throw new Error("useInstagramAnalytics must be used within InstagramAnalyticsProvider");
  }
  return context;
}
