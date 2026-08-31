import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/pages/SettingsPages";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});
