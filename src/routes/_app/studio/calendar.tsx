import { createFileRoute } from "@tanstack/react-router";
import { ContentStudioCalendarPage } from "@/pages/contentStudio/ContentStudioCalendarPage";

export const Route = createFileRoute("/_app/studio/calendar")({
  component: ContentStudioCalendarPage,
});
