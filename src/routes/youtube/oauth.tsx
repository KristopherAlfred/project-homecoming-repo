import { createFileRoute } from "@tanstack/react-router";
import YouTubeOAuthPage from "@/pages/YouTubeOAuthPage";

export const Route = createFileRoute("/youtube/oauth")({
  component: YouTubeOAuthPage,
});
