import { KpiCards } from "../components/KpiCards";
import { TrafficChart } from "../components/TrafficChart";
import { TrafficSourcesChart } from "../components/TrafficSourcesChart";
import { AudienceSnapshot } from "../components/AudienceSnapshot";
import { LiveActivityFeed } from "../components/LiveActivityFeed";
import { RecentContent } from "../components/RecentContent";
import { UploadWidget } from "../components/UploadWidget";
import { AudienceDemographics } from "../components/AudienceDemographics";
import { DeviceBreakdown } from "../components/DeviceBreakdown";
import { TopPerformingContent } from "../components/TopPerformingContent";
import { Footer } from "../components/Footer";
import { DametimeAnalyticsDashboard } from "../components/dametime/DametimeAnalyticsDashboard";
import { InstagramAnalyticsDashboard } from "../components/instagram/InstagramAnalyticsDashboard";
import { YouTubeAnalyticsDashboard } from "../components/youtube/YouTubeAnalyticsDashboard";
import { FacebookAnalyticsDashboard } from "../components/facebook/FacebookAnalyticsDashboard";
import { TwitterAnalyticsDashboard } from "../components/twitter/TwitterAnalyticsDashboard";
import { useDashboardSource } from "../contexts/DashboardSourceContext";
import { OverviewMetricsProvider, useOverviewMetrics } from "../contexts/OverviewMetricsContext";
import { NoConnectorsBanner } from "../components/NoConnectorsBanner";
import { AiInsightsPanel } from "../components/AiInsightsPanel";

function OverviewDashboard() {
  return (
    <OverviewMetricsProvider>
      <OverviewDashboardContent />
    </OverviewMetricsProvider>
  );
}

function OverviewDashboardContent() {
  const { hasConnected, loading } = useOverviewMetrics();

  return (
    <div className="space-y-3 pb-4">
      {!loading && !hasConnected && <NoConnectorsBanner />}

      <KpiCards />

      <div className="grid grid-cols-12 items-stretch gap-3">
        <div className="col-span-12 lg:col-span-4">
          <TrafficChart />
        </div>
        <div className="col-span-12 sm:col-span-6 lg:col-span-3">
          <TrafficSourcesChart />
        </div>
        <div className="col-span-12 sm:col-span-6 lg:col-span-2">
          <AudienceSnapshot />
        </div>
        <div className="col-span-12 lg:col-span-3">
          <LiveActivityFeed />
        </div>
      </div>

      <div className="grid grid-cols-12 items-stretch gap-3">
        <div className="col-span-12 flex lg:col-span-8">
          <RecentContent />
        </div>
        <div className="col-span-12 flex lg:col-span-4">
          <UploadWidget />
        </div>
      </div>

      <div className="grid grid-cols-12 items-stretch gap-3">
        <div className="col-span-12">
          <AiInsightsPanel />
        </div>
      </div>

      <div className="grid grid-cols-12 items-stretch gap-3">
        <div className="col-span-12 lg:col-span-8">
          <AudienceDemographics />
        </div>
        <div className="col-span-12 lg:col-span-4">
          <DeviceBreakdown />
        </div>
      </div>

      <div className="grid grid-cols-12 items-stretch gap-3">
        <div className="col-span-12">
          <TopPerformingContent />
        </div>
      </div>

      <Footer />
    </div>
  );
}

export function DashboardPage() {
  const { source } = useDashboardSource();

  if (source === "dametime") {
    return <DametimeAnalyticsDashboard />;
  }

  if (source === "instagram") {
    return <InstagramAnalyticsDashboard />;
  }

  if (source === "youtube") {
    return <YouTubeAnalyticsDashboard />;
  }

  if (source === "facebook") {
    return <FacebookAnalyticsDashboard />;
  }

  if (source === "twitter") {
    return <TwitterAnalyticsDashboard />;
  }

  return <OverviewDashboard />;
}
