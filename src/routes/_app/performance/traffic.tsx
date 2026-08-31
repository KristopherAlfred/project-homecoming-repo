import { createFileRoute } from "@tanstack/react-router";
import { TrafficOverviewPage } from "@/pages/TrafficOverviewPage";

export const Route = createFileRoute("/_app/performance/traffic")({
  component: TrafficOverviewPage,
});
