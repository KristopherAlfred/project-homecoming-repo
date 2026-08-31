import { Panel } from "../components/PageShell";
import { AnalyticsPageGate } from "../components/dametime/DametimeAnalyticsStates";
import { formatMetric } from "../lib/dametimeAnalyticsApi";
import { useSocialSources } from "../lib/socialSources";
import { NotConnectedCard, NoDataState, SkeletonPanel } from "../components/states/ConnectionStates";
import { formatMetric as formatIgMetric } from "../lib/instagramAnalyticsApi";
import { formatMetric as formatYtMetric } from "../lib/youtubeAnalyticsApi";
import { formatMetric as formatFbMetric } from "../lib/facebookAnalyticsApi";
import { formatMetric as formatTwMetric } from "../lib/twitterAnalyticsApi";

function useAnySocialConnected() {
  const { sources, loading } = useSocialSources();
  const connected = sources ? Object.values(sources).some((s) => s.connected) : false;
  return { loading, connected };
}

export function SegmentsPage() {
  const { loading, connected } = useAnySocialConnected();
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button type="button" className="rounded-md bg-dt-red px-4 py-2 text-sm font-semibold">
          + Create Segment
        </button>
      </div>
      {loading ? (
        <SkeletonPanel />
      ) : !connected ? (
        <NotConnectedCard
          platform="A social account"
          message="Connect a platform or your fan app to build live audience segments."
        />
      ) : (
        <NoDataState
          title="No segments yet"
          message="Create a segment to see live fan counts here."
        />
      )}
    </div>
  );
}

function FanJourneyFunnelGate() {
  const { loading, connected } = useAnySocialConnected();
  if (loading) return <SkeletonPanel />;
  if (!connected) {
    return (
      <NotConnectedCard
        platform="A social account"
        message="Connect Instagram, YouTube, Facebook, X or your fan app to see the live fan journey funnel."
      />
    );
  }
  return (
    <NoDataState
      title="No analytics selected"
      message="Pick a specific platform filter above to see its live fan journey."
    />
  );
}

export function BehaviorInsightsPage() {
  return (
    <AnalyticsPageGate
      mock={
        <Panel title="Fan Journey Funnel">
          <FanJourneyFunnelGate />
        </Panel>
      }
      dametime={(analytics) => (
        <Panel title="Fan Journey Funnel">
          <div className="space-y-2">
            {[
              { step: "Sign-ups", users: analytics.kpis.signups },
              { step: "Active fans (7d)", users: analytics.kpis.activeFans7d },
              { step: "Page views", users: analytics.kpis.pageViews },
              { step: "Total clicks", users: analytics.kpis.totalClicks },
              { step: "SMS opt-ins", users: analytics.kpis.smsOptIns },
            ].map((s, i) => (
              <div key={s.step} className="flex items-center gap-4">
                <span className="w-6 text-center text-xs font-bold text-dt-red">{i + 1}</span>
                <div className="flex-1 rounded-lg border border-dt-border bg-dt-bg/50 p-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{s.step}</span>
                    <span>{formatMetric(s.users)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
      instagram={(analytics) => (
        <Panel title="Instagram Engagement Funnel">
          <div className="space-y-2">
            {[
              { step: "Followers", users: analytics.kpis.followers },
              { step: "Avg. likes per post", users: analytics.kpis.avgLikes },
              { step: "Avg. comments per post", users: analytics.kpis.avgComments },
              { step: "Recent posts sampled", users: analytics.recentPosts.length },
              { step: "Engagement rate", users: analytics.kpis.engagementRate, suffix: "%" },
            ].map((s, i) => (
              <div key={s.step} className="flex items-center gap-4">
                <span className="w-6 text-center text-xs font-bold text-dt-red">{i + 1}</span>
                <div className="flex-1 rounded-lg border border-dt-border bg-dt-bg/50 p-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{s.step}</span>
                    <span>
                      {formatIgMetric(s.users)}
                      {s.suffix ?? ""}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
      youtube={(analytics) => (
        <Panel title="YouTube Engagement Funnel">
          <div className="space-y-2">
            {[
              { step: "Subscribers", users: analytics.kpis.subscribers },
              { step: "Avg. views per video", users: analytics.kpis.avgViews },
              { step: "Avg. likes per video", users: analytics.kpis.avgLikes },
              { step: "Recent videos sampled", users: analytics.recentVideos.length },
              { step: "Engagement rate", users: analytics.kpis.engagementRate, suffix: "%" },
            ].map((s, i) => (
              <div key={s.step} className="flex items-center gap-4">
                <span className="w-6 text-center text-xs font-bold text-dt-red">{i + 1}</span>
                <div className="flex-1 rounded-lg border border-dt-border bg-dt-bg/50 p-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{s.step}</span>
                    <span>
                      {formatYtMetric(s.users)}
                      {s.suffix ?? ""}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
      facebook={(analytics) => (
        <Panel title="Facebook Engagement Funnel">
          <div className="space-y-2">
            {[
              { step: "Followers", users: analytics.kpis.followers },
              { step: "Talking about this", users: analytics.page.talkingAbout },
              { step: "Avg. likes per post", users: analytics.kpis.avgLikes },
              { step: "Recent posts sampled", users: analytics.recentPosts.length },
              { step: "Engagement rate", users: analytics.kpis.engagementRate, suffix: "%" },
            ].map((s, i) => (
              <div key={s.step} className="flex items-center gap-4">
                <span className="w-6 text-center text-xs font-bold text-dt-red">{i + 1}</span>
                <div className="flex-1 rounded-lg border border-dt-border bg-dt-bg/50 p-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{s.step}</span>
                    <span>
                      {formatFbMetric(s.users)}
                      {s.suffix ?? ""}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
      twitter={(analytics) => (
        <Panel title="X Engagement Funnel">
          <div className="space-y-2">
            {[
              { step: "Followers", users: analytics.kpis.followers },
              { step: "Following", users: analytics.kpis.following },
              { step: "Avg. likes per post", users: analytics.kpis.avgLikes },
              { step: "Recent posts sampled", users: analytics.recentPosts.length },
              { step: "Engagement rate", users: analytics.kpis.engagementRate, suffix: "%" },
            ].map((s, i) => (
              <div key={s.step} className="flex items-center gap-4">
                <span className="w-6 text-center text-xs font-bold text-dt-red">{i + 1}</span>
                <div className="flex-1 rounded-lg border border-dt-border bg-dt-bg/50 p-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{s.step}</span>
                    <span>
                      {formatTwMetric(s.users)}
                      {s.suffix ?? ""}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    />
  );
}
