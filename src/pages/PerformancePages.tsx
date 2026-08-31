import { Panel } from "../components/PageShell";
import { AnalyticsPageGate } from "../components/dametime/DametimeAnalyticsStates";
import { formatMetric } from "../lib/dametimeAnalyticsApi";
import { useSocialSources } from "../lib/socialSources";
import { NotConnectedCard, NoDataState, SkeletonPanel } from "../components/states/ConnectionStates";
import {
  captionPreview,
  formatMetric as formatIgMetric,
} from "../lib/instagramAnalyticsApi";
import {
  formatMetric as formatYtMetric,
  titlePreview,
} from "../lib/youtubeAnalyticsApi";
import {
  formatMetric as formatFbMetric,
  textPreview,
} from "../lib/facebookAnalyticsApi";
import {
  formatMetric as formatTwMetric,
  textPreview as twTextPreview,
} from "../lib/twitterAnalyticsApi";

function useAnySocialConnected() {
  const { sources, loading } = useSocialSources();
  const connected = sources ? Object.values(sources).some((s) => s.connected) : false;
  return { loading, connected };
}

function AnalyticsOverviewGate({ title }: { title: string }) {
  const { loading, connected } = useAnySocialConnected();
  if (loading) return <SkeletonPanel />;
  if (!connected) {
    return (
      <Panel title={title}>
        <NotConnectedCard
          platform="A social account"
          message="Connect Instagram, YouTube, Facebook, X or your fan app to see live analytics here."
        />
      </Panel>
    );
  }
  return (
    <Panel title={title}>
      <NoDataState
        title="No analytics selected"
        message="Pick a specific platform filter above to see its live analytics."
      />
    </Panel>
  );
}

function postEngagement(post: { likes: number; comments: number; shares: number }) {
  return post.likes + post.comments + post.shares;
}

function twPostEngagement(post: { likes: number; replies: number; reposts: number }) {
  return post.likes + post.replies + post.reposts;
}

export function ConversionFunnelPage() {
  return (
    <AnalyticsPageGate
      mock={<AnalyticsOverviewGate title="Conversion Funnel" />}
      dametime={(analytics) => (
        <Panel title="Conversion Funnel">
          <div className="space-y-3">
            {[
              { stage: "Sign-ups", count: analytics.kpis.signups, pct: 100 },
              { stage: "Email captures", count: analytics.kpis.emailCaptures, pct: analytics.kpis.signups ? Math.round((analytics.kpis.emailCaptures / analytics.kpis.signups) * 100) : 0 },
              { stage: "Page views", count: analytics.kpis.pageViews, pct: analytics.kpis.signups ? Math.min(100, Math.round((analytics.kpis.pageViews / analytics.kpis.signups) / 10)) : 0 },
              { stage: "Total clicks", count: analytics.kpis.totalClicks, pct: analytics.kpis.signups ? Math.min(100, Math.round((analytics.kpis.totalClicks / analytics.kpis.signups) / 5)) : 0 },
              { stage: "SMS opt-ins", count: analytics.kpis.smsOptIns, pct: analytics.kpis.emailCaptures ? Math.round((analytics.kpis.smsOptIns / analytics.kpis.emailCaptures) * 100) : 0 },
            ].map((f) => (
              <div key={f.stage}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium">{f.stage}</span>
                  <span>
                    {formatMetric(f.count)} ({f.pct}%)
                  </span>
                </div>
                <div className="h-8 overflow-hidden rounded-md bg-dt-border">
                  <div
                    className="flex h-full items-center rounded-md bg-dt-red px-3 text-xs font-medium"
                    style={{ width: `${Math.max(f.pct, 8)}%` }}
                  >
                    {f.pct}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
      instagram={(analytics) => (
        <Panel title="Post Performance Funnel">
          <div className="space-y-3">
            {analytics.topPosts.slice(0, 5).map((post, _index, arr) => {
              const pct = arr[0]?.likes ? Math.round((post.likes / arr[0].likes) * 100) : 0;
              return (
                <div key={post.id}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium line-clamp-1 pr-3">{captionPreview(post.caption, 40)}</span>
                    <span>
                      {formatIgMetric(post.likes)} likes ({pct}%)
                    </span>
                  </div>
                  <div className="h-8 overflow-hidden rounded-md bg-dt-border">
                    <div
                      className="flex h-full items-center rounded-md bg-dt-red px-3 text-xs font-medium"
                      style={{ width: `${Math.max(pct, 8)}%` }}
                    >
                      {pct}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      )}
      youtube={(analytics) => (
        <Panel title="Video Performance Funnel">
          <div className="space-y-3">
            {analytics.topVideos.slice(0, 5).map((video, _index, arr) => {
              const pct = arr[0]?.viewCount ? Math.round((video.viewCount / arr[0].viewCount) * 100) : 0;
              return (
                <div key={video.id}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="line-clamp-1 pr-3 font-medium">{titlePreview(video.title, 40)}</span>
                    <span>
                      {formatYtMetric(video.viewCount)} views ({pct}%)
                    </span>
                  </div>
                  <div className="h-8 overflow-hidden rounded-md bg-dt-border">
                    <div
                      className="flex h-full items-center rounded-md bg-dt-red px-3 text-xs font-medium"
                      style={{ width: `${Math.max(pct, 8)}%` }}
                    >
                      {pct}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      )}
      facebook={(analytics) => (
        <Panel title="Post Performance Funnel">
          <div className="space-y-3">
            {analytics.topPosts.slice(0, 5).map((post, _index, arr) => {
              const engagement = postEngagement(post);
              const topEngagement = arr[0] ? postEngagement(arr[0]) : 1;
              const pct = topEngagement ? Math.round((engagement / topEngagement) * 100) : 0;
              return (
                <div key={post.id}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="line-clamp-1 pr-3 font-medium">{textPreview(post.text, 40)}</span>
                    <span>
                      {formatFbMetric(engagement)} engagement ({pct}%)
                    </span>
                  </div>
                  <div className="h-8 overflow-hidden rounded-md bg-dt-border">
                    <div
                      className="flex h-full items-center rounded-md bg-dt-red px-3 text-xs font-medium"
                      style={{ width: `${Math.max(pct, 8)}%` }}
                    >
                      {pct}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      )}
      twitter={(analytics) => (
        <Panel title="Post Performance Funnel">
          <div className="space-y-3">
            {analytics.topPosts.slice(0, 5).map((post, _index, arr) => {
              const engagement = twPostEngagement(post);
              const topEngagement = arr[0] ? twPostEngagement(arr[0]) : 1;
              const pct = topEngagement ? Math.round((engagement / topEngagement) * 100) : 0;
              return (
                <div key={post.id}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="line-clamp-1 pr-3 font-medium">{twTextPreview(post.text, 40)}</span>
                    <span>
                      {formatTwMetric(engagement)} engagement ({pct}%)
                    </span>
                  </div>
                  <div className="h-8 overflow-hidden rounded-md bg-dt-border">
                    <div
                      className="flex h-full items-center rounded-md bg-dt-red px-3 text-xs font-medium"
                      style={{ width: `${Math.max(pct, 8)}%` }}
                    >
                      {pct}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      )}
    />
  );
}

export function CampaignsPage() {
  return (
    <Panel title="Active Campaigns">
      <NoDataState
        title="No campaigns yet"
        message="Campaign tracking isn't connected for your account yet. Connect a platform or ad account to see live campaign performance here."
      />
    </Panel>
  );
}

export function ReportsPage() {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button type="button" className="rounded-md bg-dt-red px-4 py-2 text-sm font-semibold">
          + Generate Report
        </button>
      </div>
      <Panel title="Saved Reports">
        <NoDataState
          title="No saved reports yet"
          message="Generate a report from your connected platforms to see it listed here."
        />
      </Panel>
    </div>
  );
}
