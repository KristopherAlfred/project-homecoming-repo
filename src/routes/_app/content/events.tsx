import { createFileRoute } from "@tanstack/react-router";
import { EventsGiveawaysPage } from "@/pages/EventsGiveawaysPage";

export const Route = createFileRoute("/_app/content/events")({
  component: EventsGiveawaysPage,
});
