import { Card } from "./ui/Card";
import { useOverviewMetrics } from "../contexts/OverviewMetricsContext";

export function AudienceSnapshot() {
  const { metrics } = useOverviewMetrics();
  const rows = metrics?.audienceSnapshot ?? [];

  return (
    <Card title="Audience Snapshot" className="h-[280px]">
      {rows.length === 0 ? (
        <div className="flex h-[220px] items-center justify-center px-4 text-center text-[12px] text-dt-muted">
          No connected sources yet
        </div>
      ) : (
        <div className="divide-y divide-dt-border">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-3 px-3 py-2"
            >
              <span className="min-w-0 text-[12px] leading-snug text-white">
                {row.label}
              </span>
              <span className="shrink-0 whitespace-nowrap text-[13px] font-semibold text-white">
                {row.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
