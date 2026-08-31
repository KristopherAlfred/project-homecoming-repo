import { createFileRoute } from "@tanstack/react-router";
import { AudienceOverviewPage } from "@/pages/AudienceOverviewPage";

export const Route = createFileRoute("/_app/fans/audience")({
  component: AudienceOverviewPage,
});
