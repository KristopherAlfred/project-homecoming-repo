import { createFileRoute } from "@tanstack/react-router";
import { ScheduledPostsPage } from "@/pages/contentStudio/ScheduledPostsPage";

export const Route = createFileRoute("/_app/studio/schedule")({
  component: ScheduledPostsPage,
});
