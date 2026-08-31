import { createFileRoute } from "@tanstack/react-router";
import { PlatformsPage } from "@/pages/PlatformsPage";

export const Route = createFileRoute("/_app/platforms/")({
  component: PlatformsPage,
});
