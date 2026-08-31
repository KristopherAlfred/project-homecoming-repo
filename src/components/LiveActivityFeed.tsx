import { Link } from "@/lib/router-compat";
import { Card } from "./ui/Card";
import { useOverviewMetrics } from "../contexts/OverviewMetricsContext";
import { NoDataState } from "./states/ConnectionStates";
import { CONNECT_PLATFORMS_ROUTE } from "../lib/socialSources";

export function LiveActivityFeed() {
  const { hasConnected, loading } = useOverviewMetrics();

  return (
    <Card
      title="Live Activity Feed"
      className="h-[280px]"
      action={
        hasConnected ? (
          <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[10px] font-medium text-dt-green">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-dt-green" />
            LIVE
          </span>
        ) : (
          <span className="shrink-0 whitespace-nowrap text-[10px] font-medium text-dt-muted">
            Not connected
          </span>
        )
      }
    >
      {loading ? (
        <div className="flex h-[220px] items-center justify-center px-5 text-center text-[12px] text-dt-muted">
          Loading activity…
        </div>
      ) : !hasConnected ? (
        <div className="flex h-[220px] flex-col items-center justify-center gap-2 px-5 text-center">
          <p className="text-[12px] text-dt-muted">No activity to show yet</p>
          <Link to={CONNECT_PLATFORMS_ROUTE} className="text-[12px] font-medium text-dt-green hover:underline">
            Connect platforms
          </Link>
        </div>
      ) : (
        <div className="flex h-[220px] items-center justify-center px-4">
          <NoDataState
            title="No activity yet"
            message="Your connected platforms are live — activity will appear here as fans engage."
          />
        </div>
      )}
    </Card>
  );
}
