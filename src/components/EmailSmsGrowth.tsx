import { useSocialSources } from "../lib/socialSources";
import { Card } from "./ui/Card";
import { MetricSkeleton, NoDataState, NotConnectedCard } from "./states/ConnectionStates";

export function EmailSmsGrowth() {
  const { sources, loading } = useSocialSources();
  const connected = sources?.mailchimp.connected ?? false;

  return (
    <Card title="Email/SMS Growth" className="h-[260px]">
      <div className="flex h-[210px] items-center justify-center px-4 pb-3">
        {loading ? (
          <MetricSkeleton className="w-full" />
        ) : !connected ? (
          <NotConnectedCard platform="Mailchimp" compact />
        ) : (
          <NoDataState
            title="No growth data yet"
            message="Email/SMS growth appears here right after your first Mailchimp sync completes."
          />
        )}
      </div>
    </Card>
  );
}
