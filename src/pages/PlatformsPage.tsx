import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "@/lib/router-compat";
import { ArrowLeft, ArrowUpRight, Loader2 } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageShell, Panel, StatCard } from "../components/PageShell";
import { YouTubeContentLibrary } from "../components/youtube/YouTubeContentLibrary";
import { fetchYouTubeAnalytics, type YouTubeAnalytics } from "../lib/youtubeAnalyticsApi";

import { BRAND_COLORS, brandIconMap } from "../components/settings/BrandIcons";
import {
  fetchFollowerSnapshots,
  fetchPlatformConnections,
  formatSyncedAgo,
  type FollowerSnapshot,
  type PlatformConnection,
} from "../lib/platformConnections";

function YouTubeContentSection() {
  const [analytics, setAnalytics] = useState<YouTubeAnalytics | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "empty">("loading");

  useEffect(() => {
    let active = true;
    fetchYouTubeAnalytics()
      .then((data) => {
        if (!active) return;
        if (data) {
          setAnalytics(data);
          setState("ready");
        } else {
          setState("empty");
        }
      })
      .catch(() => active && setState("empty"));
    return () => {
      active = false;
    };
  }, []);

  if (state === "loading") {
    return (
      <Panel title="All content">
        <div className="flex items-center gap-2 py-6 text-sm text-dt-muted">
          <Loader2 size={16} className="animate-spin" /> Loading your YouTube library…
        </div>
      </Panel>
    );
  }

  if (state === "empty" || !analytics) {
    return (
      <Panel title="All content">
        <p className="text-sm text-dt-muted">
          Connect YouTube in Settings and run a sync to pull your full upload history here.
        </p>
      </Panel>
    );
  }

  return <YouTubeContentLibrary analytics={analytics} />;
}

function formatCount(n: number | null | undefined) {

  if (!n) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function PlatformIcon({ platform, size = 20 }: { platform: string; size?: number }) {
  const key = platform.toLowerCase();
  const Icon = brandIconMap[key];
  const color = BRAND_COLORS[key] ?? "#ffffff";
  if (!Icon) return null;
  return <Icon size={size} style={{ color }} />;
}

function useConnections() {
  const [rows, setRows] = useState<PlatformConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchPlatformConnections()
      .then((data) => active && setRows(data))
      .catch((err) => active && setError(err.message ?? "Failed to load platforms"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return { rows, loading, error };
}

export function PlatformsPage() {
  const { rows, loading, error } = useConnections();

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-dt-muted">
        <Loader2 size={16} className="animate-spin" /> Loading platforms…
      </div>
    );
  }

  if (error) {
    return <p className="p-6 text-sm text-dt-red">{error}</p>;
  }

  const connected = rows.filter((r) => r.connected);
  const totalFollowers = connected.reduce((sum, r) => sum + (r.follower_count ?? 0), 0);

  return (
    <PageShell>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Connected platforms" value={String(connected.length)} hint={`${rows.length} available`} />
        <StatCard label="Total followers" value={formatCount(totalFollowers)} hint="Across connected platforms" />
        <StatCard
          label="Largest audience"
          value={
            connected.length
              ? [...connected].sort((a, b) => (b.follower_count ?? 0) - (a.follower_count ?? 0))[0].display_name
              : "—"
          }
          hint="By follower count"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => (
          <Link
            key={row.id}
            to={`/platforms/${row.platform.toLowerCase()}`}
            className="dt-surface group rounded-lg border border-dt-border bg-dt-card p-4 transition-colors hover:border-dt-green/60"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white/[0.06]">
                <PlatformIcon platform={row.platform} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-display text-sm font-semibold text-white">{row.display_name}</p>
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      row.connected ? "bg-dt-green shadow-[0_0_8px_rgba(var(--theme-accent-rgb),0.9)]" : "bg-white/25"
                    }`}
                  />
                </div>
                <p className="truncate text-xs text-dt-muted">{row.handle ?? "Not linked"}</p>
              </div>
              <ArrowUpRight size={16} className="text-dt-muted transition-colors group-hover:text-dt-green" />
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="font-display text-xl font-semibold text-white">{formatCount(row.follower_count)}</p>
                <p className="text-[11px] uppercase tracking-wide text-dt-muted">Followers</p>
              </div>
              <p className="text-xs text-dt-muted">
                {row.connected ? formatSyncedAgo(row.last_synced_at) : "Not connected"}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}

export function PlatformDetailPage() {
  const { platform = "" } = useParams();
  const key = platform.toLowerCase();
  const { rows, loading, error } = useConnections();
  const [snapshots, setSnapshots] = useState<FollowerSnapshot[]>([]);

  useEffect(() => {
    let active = true;
    fetchFollowerSnapshots(30)
      .then((data) => active && setSnapshots(data))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const connection = rows.find((r) => r.platform.toLowerCase() === key);

  const series = useMemo(
    () =>
      snapshots
        .filter((s) => s.platform.toLowerCase() === key)
        .map((s) => ({
          date: new Date(`${s.captured_on}T00:00:00`).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          followers: s.follower_count,
        })),
    [snapshots, key],
  );

  // Recent content for a platform comes from that platform's live connector only —
  // never from bundled example content.
  const feed: Array<{ title: string; published: string; engagement: string; views: string }> = [];

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-dt-muted">
        <Loader2 size={16} className="animate-spin" /> Loading platform…
      </div>
    );
  }

  if (error || !connection) {
    return (
      <div className="p-6 text-sm text-dt-muted">
        <p>{error ?? "Platform not found."}</p>
        <Link to="/platforms" className="mt-3 inline-block text-dt-green">
          Back to Platforms
        </Link>
      </div>
    );
  }

  const growth =
    series.length >= 2
      ? ((series[series.length - 1].followers - series[0].followers) / Math.max(1, series[0].followers)) * 100
      : null;

  return (
    <PageShell>
      <div className="flex items-center gap-3">
        <Link
          to="/platforms"
          className="flex items-center gap-1.5 rounded-md border border-dt-border px-2.5 py-1.5 text-xs text-dt-muted hover:text-white"
        >
          <ArrowLeft size={14} /> Platforms
        </Link>
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-white/[0.06]">
          <PlatformIcon platform={connection.platform} />
        </span>
        <div>
          <h1 className="font-display text-lg font-semibold text-white">{connection.display_name}</h1>
          <p className="text-xs text-dt-muted">
            {connection.handle ?? "Not linked"} ·{" "}
            {connection.connected ? formatSyncedAgo(connection.last_synced_at) : "Not connected"}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Followers" value={formatCount(connection.follower_count)} />
        <StatCard
          label="30-day growth"
          value={growth === null ? "No history yet" : `${growth >= 0 ? "+" : ""}${growth.toFixed(1)}%`}
          hint={`${series.length} snapshot${series.length === 1 ? "" : "s"}`}
        />
        <StatCard
          label="Status"
          value={connection.connected ? "Connected" : "Disconnected"}
          hint={connection.connected ? "Syncing daily" : "Connect in Settings"}
        />
      </div>

      <Panel title="Follower growth">
        {series.length >= 1 ? (
          <div className="h-64">

            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="date" stroke="#8b8f98" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#8b8f98" fontSize={11} tickLine={false} axisLine={false} width={56} />
                <Tooltip
                  contentStyle={{
                    background: "#12141a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="followers"
                  stroke="var(--theme-accent)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "var(--theme-accent)", strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-dt-muted">
            No follower history yet — a daily snapshot is recorded every time this platform syncs.
          </p>

        )}
      </Panel>

      {key === "youtube" ? (
        <YouTubeContentSection />
      ) : (
        <Panel title="Recent content">
          {feed.length ? (
            <ul className="divide-y divide-dt-border">
              {feed.map((item) => (
                <li key={item.title} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-white">{item.title}</p>
                    <p className="text-xs text-dt-muted">
                      {item.published} · {item.engagement}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-dt-green">{item.views}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-dt-muted">No recent posts synced for this platform yet.</p>
          )}
        </Panel>
      )}

    </PageShell>
  );
}
