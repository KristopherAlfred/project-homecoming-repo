import { createFileRoute } from "@tanstack/react-router";
import { SupportInboxPage } from "@/pages/SupportInboxPage";

export const Route = createFileRoute("/_app/engagement/support")({
  component: SupportInboxPage,
});
