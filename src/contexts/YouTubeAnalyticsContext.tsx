import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { fetchYouTubeAnalytics, type YouTubeAnalytics } from "../lib/youtubeAnalyticsApi";
import { useDashboardSource } from "./DashboardSourceContext";

type YouTubeAnalyticsContextValue = {
  analytics: YouTubeAnalytics | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const YouTubeAnalyticsContext = createContext<YouTubeAnalyticsContextValue | null>(null);

async function loadYouTubeAnalytics() {
  const data = await fetchYouTubeAnalytics();
  if (!data) {
    return {
      analytics: null,
      error: "YouTube analytics request failed. Try again in a moment.",
    };
  }
  return { analytics: data, error: null };
}

export function YouTubeAnalyticsProvider({ children }: { children: ReactNode }) {
  const { source } = useDashboardSource();
  const [analytics, setAnalytics] = useState<YouTubeAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    const result = await loadYouTubeAnalytics();
    setAnalytics(result.analytics);
    setError(result.error);
    setLoading(false);
  };

  useEffect(() => {
    if (source !== "youtube") {
      setAnalytics(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const result = await loadYouTubeAnalytics();
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
    <YouTubeAnalyticsContext.Provider value={value}>{children}</YouTubeAnalyticsContext.Provider>
  );
}

export function useYouTubeAnalytics() {
  const context = useContext(YouTubeAnalyticsContext);
  if (!context) {
    throw new Error("useYouTubeAnalytics must be used within YouTubeAnalyticsProvider");
  }
  return context;
}
