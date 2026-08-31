import { createFileRoute } from "@tanstack/react-router";
import { ExperiencePage } from "@/pages/ExperiencePage";

export const Route = createFileRoute("/_app/experience")({
  component: ExperiencePage,
});
