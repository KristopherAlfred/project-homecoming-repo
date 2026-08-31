import { Card } from "./ui/Card";
import { useOverviewMetrics } from "../contexts/OverviewMetricsContext";
import { MetricSkeleton, NoDataState, NotConnectedCard } from "./states/ConnectionStates";

export function DeviceBreakdown() {
  const { hasConnected, loading } = useOverviewMetrics();

  return (
    <Card title="Device Breakdown" className="h-[260px]">
      <div className="flex h-[210px] items-center justify-center px-4 pb-3">
        {loading ? (
          <MetricSkeleton className="w-full" />
        ) : !hasConnected ? (
          <NotConnectedCard platform="Analytics" message="Connect a platform to see device breakdown" compact />
        ) : (
          <NoDataState
            title="No device data yet"
            message="Device breakdown appears once your connected platforms report session analytics."
          />
        )}
      </div>
    </Card>
  );
}
