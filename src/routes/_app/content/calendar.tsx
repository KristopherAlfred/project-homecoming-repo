import { createFileRoute } from "@tanstack/react-router";
import { ContentCalendarPage } from "@/pages/ContentCalendarPage";

export const Route = createFileRoute("/_app/content/calendar")({
  component: ContentCalendarPage,
});
