import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import {
  fetchOverviewMetrics,
  type OverviewMetrics,
} from "../lib/overviewAnalytics";
import { fetchPlatformConnections, type PlatformConnection } from "../lib/platformConnections";
import { supabase } from "../integrations/supabase/client";

type OverviewMetricsState = {
  /** Null until at least one connector is live — never placeholder data. */
  metrics: OverviewMetrics | null;
  connections: PlatformConnection[];
  hasConnected: boolean;
  loading: boolean;
  refresh: () => void;
};

const OverviewMetricsContext = createContext<OverviewMetricsState>({
  metrics: null,
  connections: [],
  hasConnected: false,
  loading: true,
  refresh: () => {},
});

export function OverviewMetricsProvider({ children }: { children: ReactNode }) {
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [connections, setConnections] = useState<PlatformConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const rows = await fetchPlatformConnections();
        if (cancelled) return;
        setConnections(rows);

        if (!rows.some((row) => row.connected)) {
          setMetrics(null);
          return;
        }

        const next = await fetchOverviewMetrics();
        if (!cancelled) setMetrics(next);
      } catch {
        if (!cancelled) {
          setConnections([]);
          setMetrics(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tick]);

  // Live-update when a platform is connected/disconnected in Settings.
  useEffect(() => {
    const channel = supabase
      .channel("platform-connections-overview")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "platform_connections" },
        () => refresh(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  const hasConnected = connections.some((row) => row.connected);

  return (
    <OverviewMetricsContext.Provider
      value={{ metrics, connections, hasConnected, loading, refresh }}
    >
      {children}
    </OverviewMetricsContext.Provider>
  );
}

export function useOverviewMetrics() {
  return useContext(OverviewMetricsContext);
}
