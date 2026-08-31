import { useAthlete } from "../contexts/AthleteContext";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@/lib/router-compat";
import {
  ExternalLink,
  Film,
  Loader2,
  Radio,
  RefreshCw,
  Share2,
  Users,
} from "lucide-react";
import { InstagramAnalyticsView } from "../components/instagram/InstagramAnalyticsDashboard";
import { FacebookAnalyticsView } from "../components/facebook/FacebookAnalyticsDashboard";
import { TwitterAnalyticsView } from "../components/twitter/TwitterAnalyticsDashboard";
import { TikTokAnalyticsView } from "../components/tiktok/TikTokAnalyticsDashboard";
import { SourceLoading } from "../components/dametime/DametimeAnalyticsStates";
import {
  MetricSkeleton,
  NoDataState,
  NotConnectedCard,
} from "../components/states/ConnectionStates";
import { useSocialSources, type SocialSourceMap } from "../lib/socialSources";
import {
  fetchInstagramAnalytics,
  formatMetric as formatIgMetric,
  instagramPostImage,
  instagramProfileImage,
  type InstagramAnalytics,
} from "../lib/instagramAnalyticsApi";
import {
  fetchFacebookAnalytics,
  formatMetric as formatFbMetric,
  type FacebookAnalytics,
} from "../lib/facebookAnalyticsApi";
import {
  fetchTwitterAnalytics,
  formatMetric as formatTwMetric,
  type TwitterAnalytics,
} from "../lib/twitterAnalyticsApi";
import {
  fetchTikTokAnalytics,
  formatMetric as formatTtMetric,
  tiktokProfileImage,
  tiktokVideoCover,
  type TikTokAnalytics,
} from "../lib/tiktokAnalyticsApi";

type SocialTab = "instagram" | "x" | "facebook" | "tiktok";

const TABS: { id: SocialTab; label: string }[] = [
  { id: "instagram", label: "INSTAGRAM" },
  { id: "x", label: "X" },
  { id: "facebook", label: "FACEBOOK" },
  { id: "tiktok", label: "TIKTOK" },
];

const PLATFORM_LABEL: Record<SocialTab, string> = {
  instagram: "Instagram",
  x: "X",
  facebook: "Facebook",
  tiktok: "TikTok",
};

const POLL_MS = 5 * 60_000;

type Bundle = {
  instagram: InstagramAnalytics | null;
  facebook: FacebookAnalytics | null;
  twitter: TwitterAnalytics | null;
  tiktok: TikTokAnalytics | null;
};

export function SocialContentPage() {
  const { fanAppName, athlete } = useAthlete();
  const { sources, loading: sourcesLoading, reload: reloadSources } = useSocialSources();
  const [tab, setTab] = useState<SocialTab>("instagram");
  const [bundle, setBundle] = useState<Bundle>({
    instagram: null,
    facebook: null,
    twitter: null,
    tiktok: null,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);

  const anyConnected = Boolean(
    sources &&
      (sources.instagram.connected ||
        sources.x.connected ||
        sources.facebook.connected ||
        sources.tiktok.connected),
  );

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const [instagram, facebook, twitter, tiktok] = await Promise.all([
          fetchInstagramAnalytics(),
          fetchFacebookAnalytics(),
          fetchTwitterAnalytics(),
          fetchTikTokAnalytics(),
        ]);
        setBundle({ instagram, facebook, twitter, tiktok });
        const synced = [
          instagram?.syncedAt,
          facebook?.syncedAt,
          twitter?.syncedAt,
          tiktok?.syncedAt,
          sources?.instagram.lastSyncedAt,
          sources?.x.lastSyncedAt,
          sources?.facebook.lastSyncedAt,
          sources?.tiktok.lastSyncedAt,
        ]
          .filter(Boolean)
          .map((iso) => Date.parse(iso as string))
          .filter((n) => Number.isFinite(n));
        setSyncedAt(synced.length ? new Date(Math.max(...synced)).toISOString() : null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load social analytics");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [sources],
  );

  useEffect(() => {
    if (sourcesLoading) return;
    if (!anyConnected) {
      setLoading(false);
      return;
    }
    void load();
    const interval = window.setInterval(() => void load(true), POLL_MS);
    return () => window.clearInterval(interval);
  }, [anyConnected, sourcesLoading, load]);

  const summary = useMemo(() => {
    const followers = [
      bundle.instagram?.kpis.followers,
      bundle.facebook?.kpis.followers,
      bundle.twitter?.kpis.followers,
      bundle.tiktok?.kpis.followers,
    ].filter((n): n is number => typeof n === "number" && Number.isFinite(n));
    const engRates = [
      bundle.instagram?.kpis.engagementRate,
      bundle.facebook?.kpis.engagementRate,
      bundle.twitter?.kpis.engagementRate,
      bundle.tiktok?.kpis.engagementRate,
    ].filter((n): n is number => typeof n === "number" && Number.isFinite(n));
    const posts =
      (bundle.instagram?.recentPosts.length ?? 0) +
      (bundle.facebook?.recentPosts.length ?? 0) +
      (bundle.twitter?.recentPosts.length ?? 0) +
      (bundle.tiktok?.recentVideos.length ?? 0);

    return {
      hasData: followers.length > 0 || engRates.length > 0,
      socialReach: followers.reduce((a, b) => a + b, 0),
      posts,
      avgEng: engRates.length
        ? Math.round((engRates.reduce((a, b) => a + b, 0) / engRates.length) * 10) / 10
        : null,
    };
  }, [bundle]);

  const activeIndex = TABS.findIndex((item) => item.id === tab);
  const pending = sourcesLoading || (loading && anyConnected);

  async function refreshAll() {
    await reloadSources(true);
    await load(true);
  }

  const syncedLabel = syncedAt ? new Date(syncedAt).toLocaleString() : null;

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-dt-border bg-dt-card">
        <div className="relative border-b border-dt-border bg-gradient-to-br from-black via-[#0c0c0c] to-[#051a12] px-5 py-5 sm:px-7 sm:py-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_12%_0%,rgba(var(--theme-accent-rgb),0.22),transparent_52%)]" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-dt-red/30 bg-dt-red/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-dt-red">
                <Share2 size={12} />
                Social
                {anyConnected ? (
                  <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-emerald-300">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                    LIVE
                  </span>
                ) : null}
              </div>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Same feeds fans see in {fanAppName}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/65">
                Live Instagram, X, Facebook, and TikTok analytics from the {fanAppName} app — YouTube lives under Videos.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <SummaryStat
                label="Social reach"
                value={summary.hasData ? formatIgMetric(summary.socialReach, true) : null}
                pending={pending}
              />
              <SummaryStat
                label="Posts"
                value={summary.hasData ? String(summary.posts) : null}
                pending={pending}
              />
              <SummaryStat
                label="Avg eng."
                value={summary.avgEng === null ? null : `${summary.avgEng}%`}
                pending={pending}
              />
              <button
                type="button"
                onClick={() => void refreshAll()}
                disabled={refreshing}
                className="inline-flex min-h-[52px] items-center gap-2 rounded-xl bg-dt-red px-5 text-sm font-semibold text-white shadow-[0_8px_28px_rgba(var(--theme-accent-rgb),0.35)] transition hover:brightness-110 disabled:opacity-60"
              >
                {refreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                Refresh
              </button>
            </div>
          </div>
        </div>

        {(error || anyConnected) && (
          <div className="space-y-2 border-b border-dt-border px-5 py-3">
            {error ? (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>
            ) : (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
                {syncedLabel
                  ? `Live ${fanAppName} social analytics · synced ${syncedLabel}`
                  : `Live ${fanAppName} social analytics · waiting on first sync`}
              </div>
            )}
          </div>
        )}

        <div className="border-b border-dt-border px-4 py-3 sm:px-5">
          <div
            role="tablist"
            aria-label="Social platforms"
            className="relative grid grid-cols-4 overflow-hidden rounded-xl border border-white/10 bg-black/40 p-1"
          >
            <div
              className="pointer-events-none absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/4)] rounded-lg bg-dt-red shadow-[0_8px_24px_rgba(var(--theme-accent-rgb),0.35)] transition-transform duration-300 ease-out"
              style={{ transform: `translateX(${activeIndex * 100}%)` }}
              aria-hidden
            />
            {TABS.map((item) => {
              const active = tab === item.id;
              const connected = sources ? sources[item.id === "x" ? "x" : item.id].connected : false;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(item.id)}
                  className={`relative z-10 flex items-center justify-center gap-1.5 truncate px-2 py-2.5 text-[11px] font-bold tracking-[0.12em] transition sm:text-xs ${
                    active ? "text-white" : "text-white/45 hover:text-white/75"
                  }`}
                >
                  {item.label}
                  {!sourcesLoading && !connected ? (
                    <span
                      className="h-1.5 w-1.5 rounded-full border border-white/40"
                      aria-label="Not connected"
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <PlatformStatCard
          label="Instagram"
          connected={sources?.instagram.connected ?? false}
          pending={pending}
          value={
            bundle.instagram ? formatIgMetric(bundle.instagram.kpis.followers, true) : null
          }
          hint={
            bundle.instagram ? `${bundle.instagram.kpis.engagementRate}% eng.` : null
          }
          Icon={Users}
        />
        <PlatformStatCard
          label="X"
          connected={sources?.x.connected ?? false}
          pending={pending}
          value={bundle.twitter ? formatTwMetric(bundle.twitter.kpis.followers, true) : null}
          hint={
            bundle.twitter ? `${formatTwMetric(bundle.twitter.kpis.sampledPosts)} sampled` : null
          }
          Icon={Share2}
        />
        <PlatformStatCard
          label="Facebook"
          connected={sources?.facebook.connected ?? false}
          pending={pending}
          value={bundle.facebook ? formatFbMetric(bundle.facebook.kpis.followers, true) : null}
          hint={bundle.facebook ? `${formatFbMetric(bundle.facebook.kpis.totalPosts)} posts` : null}
          Icon={Users}
        />
        <PlatformStatCard
          label="TikTok"
          connected={sources?.tiktok.connected ?? false}
          pending={pending}
          value={bundle.tiktok ? formatTtMetric(bundle.tiktok.kpis.followers, true) : null}
          hint={
            bundle.tiktok ? `${formatTtMetric(bundle.tiktok.kpis.sampledVideos)} videos` : null
          }
          Icon={Film}
        />
      </div>

      <PlatformPanel
        tab={tab}
        sources={sources}
        sourcesLoading={sourcesLoading}
        loading={loading}
        bundle={bundle}
        avatarFallback={athlete?.profile_photo_url ?? null}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          to="/content/videos"
          className="group rounded-2xl border border-dt-border bg-dt-card p-4 transition hover:border-dt-red/40"
        >
          <div className="mb-2 inline-flex rounded-lg border border-dt-red/25 bg-dt-red/10 p-2 text-dt-red">
            <Film size={16} />
          </div>
          <p className="text-sm font-semibold text-white group-hover:text-dt-red">Videos</p>
          <p className="mt-1 text-xs text-white/45">YouTube analytics and Exclusive uploads live here</p>
        </Link>
        <Link
          to="/live"
          className="group rounded-2xl border border-dt-border bg-dt-card p-4 transition hover:border-dt-red/40"
        >
          <div className="mb-2 inline-flex rounded-lg border border-dt-red/25 bg-dt-red/10 p-2 text-dt-red">
            <Radio size={16} />
          </div>
          <p className="text-sm font-semibold text-white group-hover:text-dt-red">Go Live</p>
          <p className="mt-1 text-xs text-white/45">Same LIVE destination fans open from the app Social tab</p>
        </Link>
      </div>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  pending,
}: {
  label: string;
  value: string | null;
  pending: boolean;
}) {
  return (
    <div className="min-w-[96px] rounded-xl border border-white/10 bg-black/40 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">{label}</p>
      {pending ? (
        <div className="mt-2 h-5 w-16 animate-pulse rounded bg-white/10" />
      ) : (
        <p className="mt-1 text-lg font-bold text-white">{value ?? "—"}</p>
      )}
    </div>
  );
}

function PlatformStatCard({
  label,
  connected,
  pending,
  value,
  hint,
  Icon,
}: {
  label: string;
  connected: boolean;
  pending: boolean;
  value: string | null;
  hint: string | null;
  Icon: typeof Users;
}) {
  if (!connected && !pending) {
    return <NotConnectedCard platform={label} compact />;
  }
  if (pending || value === null) {
    return <MetricSkeleton label={label} />;
  }
  return (
    <div className="relative overflow-hidden rounded-2xl border border-dt-border bg-dt-card p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_100%_0%,rgba(var(--theme-accent-rgb),0.16),transparent_55%)]" />
      <div className="relative flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">{label}</p>
          <p className="mt-2 text-2xl font-bold text-white">{value}</p>
          {hint ? <p className="mt-1 text-[11px] text-white/40">{hint}</p> : null}
        </div>
        <Icon size={18} className="mt-0.5 shrink-0 text-dt-red" />
      </div>
    </div>
  );
}

function PlatformPanel({
  tab,
  sources,
  sourcesLoading,
  loading,
  bundle,
  avatarFallback,
}: {
  tab: SocialTab;
  sources: SocialSourceMap | null;
  sourcesLoading: boolean;
  loading: boolean;
  bundle: Bundle;
  avatarFallback: string | null;
}) {
  const label = PLATFORM_LABEL[tab];
  const connected = sources?.[tab].connected ?? false;

  if (sourcesLoading) return <SourceLoading message={`Loading ${label} analytics…`} />;
  if (!connected) {
    return (
      <NotConnectedCard
        platform={label}
        message={`Connect your ${label} account to see live analytics`}
      />
    );
  }

  if (tab === "instagram") {
    return (
      <InstagramSocialPanel
        analytics={bundle.instagram}
        loading={loading}
        avatarFallback={avatarFallback}
      />
    );
  }
  if (tab === "tiktok") {
    return (
      <TikTokSocialPanel
        analytics={bundle.tiktok}
        loading={loading}
        avatarFallback={avatarFallback}
      />
    );
  }
  if (tab === "x") {
    if (bundle.twitter) return <TwitterAnalyticsView analytics={bundle.twitter} />;
    if (loading) return <SourceLoading message="Loading X analytics…" />;
    return (
      <NoDataState
        title="No X data yet"
        message="Your X account is connected — live analytics appear right after the first sync completes."
      />
    );
  }
  if (bundle.facebook) return <FacebookAnalyticsView analytics={bundle.facebook} />;
  if (loading) return <SourceLoading message="Loading Facebook analytics…" />;
  return (
    <NoDataState
      title="No Facebook data yet"
      message="Your Facebook page is connected — live analytics appear right after the first sync completes."
    />
  );
}

function ProfileAvatar({ src, alt }: { src: string; alt: string }) {
  if (!src) {
    return (
      <div className="h-14 w-14 rounded-full border-2 border-dt-red bg-black/50" aria-hidden />
    );
  }
  return (
    <img src={src} alt={alt} className="h-14 w-14 rounded-full border-2 border-dt-red object-cover" />
  );
}

function InstagramSocialPanel({
  analytics,
  loading,
  avatarFallback,
}: {
  analytics: InstagramAnalytics | null;
  loading: boolean;
  avatarFallback: string | null;
}) {
  const { fanAppName } = useAthlete();
  if (!analytics) {
    if (loading) return <SourceLoading message="Loading Instagram analytics…" />;
    return (
      <NoDataState
        title="No Instagram data yet"
        message="Your Instagram account is connected — live profile and post analytics appear after the first sync."
      />
    );
  }

  const posts = analytics.recentPosts.slice(0, 9);
  const avatar = instagramProfileImage(analytics.profile) || avatarFallback || "";

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-2xl border border-dt-border bg-dt-card">
        <div className="flex flex-col gap-4 border-b border-dt-border p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-center gap-3">
            <ProfileAvatar src={avatar} alt={analytics.profile.fullName} />
            <div>
              <p className="text-sm font-semibold text-white">
                @{analytics.profile.username}
                {analytics.profile.isVerified ? (
                  <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-dt-red">Verified</span>
                ) : null}
              </p>
              <p className="text-xs text-white/50">{analytics.profile.fullName}</p>
              <p className="mt-1 line-clamp-2 max-w-xl text-xs text-white/40">{analytics.profile.biography}</p>
              {analytics.profile.externalUrl ? (
                <a
                  href={analytics.profile.externalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-[11px] text-dt-red hover:underline"
                >
                  {analytics.profile.externalUrl.replace(/^https?:\/\//, "")}
                  <ExternalLink size={10} />
                </a>
              ) : null}
            </div>
          </div>
          <a
            href={analytics.profile.permalink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 self-start rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-white/80 transition hover:border-dt-red/40 hover:text-white"
          >
            Open profile <ExternalLink size={12} />
          </a>
        </div>

        <div className="p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="font-display text-sm font-semibold tracking-wide text-white">Recent grid</h3>
              <p className="text-[11px] text-white/40">Matches the Instagram feed layout in {fanAppName}</p>
            </div>
            <p className="text-[11px] text-white/40">{posts.length} posts</p>
          </div>
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {posts.map((post) => (
              <a
                key={post.id}
                href={post.permalink}
                target="_blank"
                rel="noreferrer"
                className="group relative aspect-square overflow-hidden rounded-lg border border-white/10 bg-black/40"
              >
                <img
                  src={instagramPostImage(post)}
                  alt=""
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                <div className="absolute inset-x-0 bottom-0 translate-y-1 p-2 text-[10px] text-white opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
                  {formatIgMetric(post.likes)} likes · {formatIgMetric(post.comments)} comments
                </div>
              </a>
            ))}
            {posts.length === 0 ? (
              <p className="col-span-3 py-10 text-center text-sm text-white/40">
                No recent posts yet — new Instagram posts show up here after the next sync.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <InstagramAnalyticsView analytics={analytics} />
    </div>
  );
}

function TikTokSocialPanel({
  analytics,
  loading,
  avatarFallback,
}: {
  analytics: TikTokAnalytics | null;
  loading: boolean;
  avatarFallback: string | null;
}) {
  if (!analytics) {
    if (loading) return <SourceLoading message="Loading TikTok analytics…" />;
    return (
      <NoDataState
        title="No TikTok data yet"
        message="Your TikTok account is connected — live profile and video analytics appear after the first sync."
      />
    );
  }

  const videos = analytics.recentVideos.slice(0, 9);
  const avatar = tiktokProfileImage(analytics.profile) || avatarFallback || "";

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-2xl border border-dt-border bg-dt-card">
        <div className="flex flex-col gap-4 border-b border-dt-border p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-center gap-3">
            <ProfileAvatar src={avatar} alt={analytics.profile.nickname} />
            <div>
              <p className="text-sm font-semibold text-white">
                {analytics.profile.handle}
                {analytics.profile.verified ? (
                  <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-dt-red">Verified</span>
                ) : null}
              </p>
              <p className="text-xs text-white/50">{analytics.profile.nickname}</p>
              <p className="mt-1 line-clamp-2 max-w-xl text-xs text-white/40">{analytics.profile.biography}</p>
            </div>
          </div>
          <a
            href={analytics.profile.permalink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 self-start rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-white/80 transition hover:border-dt-red/40 hover:text-white"
          >
            Open profile <ExternalLink size={12} />
          </a>
        </div>

        <div className="p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="font-display text-sm font-semibold tracking-wide text-white">Recent videos</h3>
              <p className="text-[11px] text-white/40">{analytics.profile.handle} on TikTok</p>
            </div>
            <p className="text-[11px] text-white/40">{videos.length} videos</p>
          </div>
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {videos.map((video) => (
              <a
                key={video.id}
                href={video.permalink}
                target="_blank"
                rel="noreferrer"
                className="group relative aspect-[9/16] overflow-hidden rounded-lg border border-white/10 bg-black/40"
              >
                <img
                  src={tiktokVideoCover(video)}
                  alt=""
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                <div className="absolute inset-x-0 bottom-0 translate-y-1 p-2 text-[10px] text-white opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
                  {formatTtMetric(video.views, true)} views
                </div>
              </a>
            ))}
            {videos.length === 0 ? (
              <p className="col-span-3 py-10 text-center text-sm text-white/40">
                No recent videos yet — new TikToks show up here after the next sync.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <TikTokAnalyticsView analytics={analytics} />
    </div>
  );
}
