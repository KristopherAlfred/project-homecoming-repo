import { createFileRoute } from "@tanstack/react-router";
import { NewsContentPage } from "@/pages/NewsContentPage";

export const Route = createFileRoute("/_app/content/news")({
  component: NewsContentPage,
});
