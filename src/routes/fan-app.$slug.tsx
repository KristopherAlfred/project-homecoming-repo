import { createFileRoute } from "@tanstack/react-router";
import { FanAppPublicPage } from "@/pages/FanAppPublicPage";

export const Route = createFileRoute("/fan-app/$slug")({
  component: FanAppPublicPage,
});
