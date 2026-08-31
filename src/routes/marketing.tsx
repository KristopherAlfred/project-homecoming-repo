import { createFileRoute } from "@tanstack/react-router";
import { MarketingLandingPage } from "@/pages/MarketingLandingPage";

export const Route = createFileRoute("/marketing")({
  component: MarketingLandingPage,
});
