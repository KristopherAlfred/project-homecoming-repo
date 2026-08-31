import { createFileRoute } from "@tanstack/react-router";
import { FanActivityPage } from "@/pages/FanActivityPage";

export const Route = createFileRoute("/_app/engagement/activity")({
  component: FanActivityPage,
});
