import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { fetchFacebookAnalytics, type FacebookAnalytics } from "../lib/facebookAnalyticsApi";
import { useDashboardSource } from "./DashboardSourceContext";

type FacebookAnalyticsContextValue = {
  analytics: FacebookAnalytics | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const FacebookAnalyticsContext = createContext<FacebookAnalyticsContextValue | null>(null);

async function loadFacebookAnalytics() {
  const data = await fetchFacebookAnalytics();
  if (!data) {
    return {
      analytics: null,
      error: "Facebook analytics request failed. Try again in a moment.",
    };
  }
  return { analytics: data, error: null };
}

export function FacebookAnalyticsProvider({ children }: { children: ReactNode }) {
  const { source } = useDashboardSource();
  const [analytics, setAnalytics] = useState<FacebookAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    const result = await loadFacebookAnalytics();
    setAnalytics(result.analytics);
    setError(result.error);
    setLoading(false);
  };

  useEffect(() => {
    if (source !== "facebook") {
      setAnalytics(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const result = await loadFacebookAnalytics();
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
    <FacebookAnalyticsContext.Provider value={value}>{children}</FacebookAnalyticsContext.Provider>
  );
}

export function useFacebookAnalytics() {
  const context = useContext(FacebookAnalyticsContext);
  if (!context) {
    throw new Error("useFacebookAnalytics must be used within FacebookAnalyticsProvider");
  }
  return context;
}
