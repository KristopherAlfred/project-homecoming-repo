import { createFileRoute } from "@tanstack/react-router";
import { LivePage } from "@/pages/LivePage";

export const Route = createFileRoute("/_app/live")({
  component: LivePage,
});
