import { createFileRoute } from "@tanstack/react-router";
import { ContentAnalyticsPage } from "@/pages/contentStudio/ContentAnalyticsPage";

export const Route = createFileRoute("/_app/studio/analytics")({
  component: ContentAnalyticsPage,
});
