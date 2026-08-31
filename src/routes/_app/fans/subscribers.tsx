import { createFileRoute } from "@tanstack/react-router";
import { SubscribersPage } from "@/pages/SubscribersPage";

export const Route = createFileRoute("/_app/fans/subscribers")({
  component: SubscribersPage,
});
