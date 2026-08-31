import { useAthlete } from "../../contexts/AthleteContext";
import type { ReactNode } from "react";
import { useAnalyticsView } from "../../hooks/useAnalyticsView";
import type { DametimeAnalytics } from "../../lib/dametimeAnalyticsApi";
import type { InstagramAnalytics } from "../../lib/instagramAnalyticsApi";
import type { YouTubeAnalytics } from "../../lib/youtubeAnalyticsApi";
import type { FacebookAnalytics } from "../../lib/facebookAnalyticsApi";
import type { TwitterAnalytics } from "../../lib/twitterAnalyticsApi";

export function SourceLoading({ message = "Loading analytics…" }: { message?: string }) {
  return (
    <div className="dt-surface flex min-h-[280px] items-center justify-center rounded-lg border border-dt-border bg-dt-card p-6">
      <p className="text-sm text-dt-muted">{message}</p>
    </div>
  );
}

export function SourceError({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="dt-surface rounded-lg border border-dt-red/40 bg-dt-card p-6">
      <p className="text-sm font-medium text-white">{title}</p>
      <p className="mt-2 text-sm text-dt-muted">{message}</p>
    </div>
  );
}

export function DametimeLoading({ message = "Loading fan app analytics…" }: { message?: string }) {
  return <SourceLoading message={message} />;
}

export function DametimeError({ message }: { message: string }) {
  return <SourceError title="Could not load fan app analytics" message={message} />;
}

export function SourceBanner() {
  const { fanAppName } = useAthlete();
  const { isDametime, isInstagram, isYoutube, isFacebook, isTwitter, analytics, loading, instagram, youtube, facebook, twitter } =
    useAnalyticsView();

  if (isDametime) {
    return (
      <div className="mb-3 rounded-lg border border-dt-red/30 bg-dt-red/10 px-3 py-2">
        <p className="text-xs font-medium text-white">
          {fanAppName} filter active — showing live analytics from your fan app.
        </p>
        {!loading && analytics && (
          <p className="mt-0.5 text-[11px] text-dt-muted">
            Last synced {new Date(analytics.syncedAt).toLocaleString()}
          </p>
        )}
      </div>
    );
  }

  if (isInstagram) {
    return (
      <div className="mb-3 rounded-lg border border-dt-red/30 bg-dt-red/10 px-3 py-2">
        <p className="text-xs font-medium text-white">
          Instagram filter active — showing{" "}
          {instagram.analytics?.source === "cache" ? "cached" : "live"} analytics for your connected account.
        </p>
        {!instagram.loading && instagram.analytics && (
          <p className="mt-0.5 text-[11px] text-dt-muted">
            Last synced {new Date(instagram.analytics.syncedAt).toLocaleString()}
          </p>
        )}
      </div>
    );
  }

  if (isYoutube) {
    return (
      <div className="mb-3 rounded-lg border border-dt-red/30 bg-dt-red/10 px-3 py-2">
        <p className="text-xs font-medium text-white">
          YouTube filter active — showing{" "}
          {youtube.analytics?.source === "cache" ? "cached" : "live"} analytics for your connected account.
        </p>
        {!youtube.loading && youtube.analytics && (
          <p className="mt-0.5 text-[11px] text-dt-muted">
            Last synced {new Date(youtube.analytics.syncedAt).toLocaleString()}
          </p>
        )}
      </div>
    );
  }

  if (isFacebook) {
    return (
      <div className="mb-3 rounded-lg border border-dt-red/30 bg-dt-red/10 px-3 py-2">
        <p className="text-xs font-medium text-white">
          Facebook filter active — showing{" "}
          {facebook.analytics?.source === "cache" ? "cached" : "live"} analytics for your connected account.
        </p>
        {!facebook.loading && facebook.analytics && (
          <p className="mt-0.5 text-[11px] text-dt-muted">
            Last synced {new Date(facebook.analytics.syncedAt).toLocaleString()}
          </p>
        )}
      </div>
    );
  }

  if (isTwitter) {
    return (
      <div className="mb-3 rounded-lg border border-dt-red/30 bg-dt-red/10 px-3 py-2">
        <p className="text-xs font-medium text-white">
          X filter active — showing{" "}
          {twitter.analytics?.source === "cache" ? "cached" : "live"} analytics for your connected account.
        </p>
        {!twitter.loading && twitter.analytics && (
          <p className="mt-0.5 text-[11px] text-dt-muted">
            Last synced {new Date(twitter.analytics.syncedAt).toLocaleString()}
          </p>
        )}
      </div>
    );
  }

  return null;
}

export function DametimePageGate({
  mock,
  children,
}: {
  mock: ReactNode;
  children: (analytics: DametimeAnalytics) => ReactNode;
}) {
  const { isDametime, analytics, loading, error } = useAnalyticsView();

  if (!isDametime) return mock;
  if (loading) return <DametimeLoading />;
  if (error) return <DametimeError message={error} />;
  if (!analytics) return <DametimeError message="No analytics data available." />;

  return <>{children(analytics)}</>;
}

export function InstagramPageGate({
  mock,
  children,
}: {
  mock: ReactNode;
  children: (analytics: InstagramAnalytics) => ReactNode;
}) {
  const { isInstagram, instagram } = useAnalyticsView();

  if (!isInstagram) return mock;
  if (instagram.loading) return <SourceLoading message="Loading Instagram analytics…" />;
  if (instagram.error) {
    return <SourceError title="Could not load Instagram analytics" message={instagram.error} />;
  }
  if (!instagram.analytics) {
    return <SourceError title="Could not load Instagram analytics" message="No data available." />;
  }

  return <>{children(instagram.analytics)}</>;
}

export function AnalyticsPageGate({
  mock,
  dametime,
  instagram,
  youtube,
  facebook,
  twitter,
}: {
  mock: ReactNode;
  dametime?: (analytics: DametimeAnalytics) => ReactNode;
  instagram?: (analytics: InstagramAnalytics) => ReactNode;
  youtube?: (analytics: YouTubeAnalytics) => ReactNode;
  facebook?: (analytics: FacebookAnalytics) => ReactNode;
  twitter?: (analytics: TwitterAnalytics) => ReactNode;
}) {
  const view = useAnalyticsView();

  if (view.isDametime && dametime) {
    if (view.loading) return <DametimeLoading />;
    if (view.error) return <DametimeError message={view.error} />;
    if (!view.analytics) return <DametimeError message="No analytics data available." />;
    return <>{dametime(view.analytics)}</>;
  }

  if (view.isInstagram && instagram) {
    if (view.instagram.loading) return <SourceLoading message="Loading Instagram analytics…" />;
    if (view.instagram.error) {
      return <SourceError title="Could not load Instagram analytics" message={view.instagram.error} />;
    }
    if (!view.instagram.analytics) {
      return <SourceError title="Could not load Instagram analytics" message="No data available." />;
    }
    return <>{instagram(view.instagram.analytics)}</>;
  }

  if (view.isYoutube && youtube) {
    if (view.youtube.loading) return <SourceLoading message="Loading YouTube analytics…" />;
    if (view.youtube.error) {
      return <SourceError title="Could not load YouTube analytics" message={view.youtube.error} />;
    }
    if (!view.youtube.analytics) {
      return <SourceError title="Could not load YouTube analytics" message="No data available." />;
    }
    return <>{youtube(view.youtube.analytics)}</>;
  }

  if (view.isFacebook && facebook) {
    if (view.facebook.loading) return <SourceLoading message="Loading Facebook analytics…" />;
    if (view.facebook.error) {
      return <SourceError title="Could not load Facebook analytics" message={view.facebook.error} />;
    }
    if (!view.facebook.analytics) {
      return <SourceError title="Could not load Facebook analytics" message="No data available." />;
    }
    return <>{facebook(view.facebook.analytics)}</>;
  }

  if (view.isTwitter && twitter) {
    if (view.twitter.loading) return <SourceLoading message="Loading X analytics…" />;
    if (view.twitter.error) {
      return <SourceError title="Could not load X analytics" message={view.twitter.error} />;
    }
    if (!view.twitter.analytics) {
      return <SourceError title="Could not load X analytics" message="No data available." />;
    }
    return <>{twitter(view.twitter.analytics)}</>;
  }

  return mock;
}
