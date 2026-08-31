import { createFileRoute } from "@tanstack/react-router";
import { VideosContentPage } from "@/pages/VideosContentPage";

export const Route = createFileRoute("/_app/content/videos")({
  component: VideosContentPage,
});
