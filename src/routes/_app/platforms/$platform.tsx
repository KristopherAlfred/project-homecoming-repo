import { createFileRoute } from "@tanstack/react-router";
import { PlatformDetailPage } from "@/pages/PlatformsPage";

export const Route = createFileRoute("/_app/platforms/$platform")({
  component: PlatformDetailPage,
});
