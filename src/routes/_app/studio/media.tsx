import { createFileRoute } from "@tanstack/react-router";
import { MediaLibraryPage } from "@/pages/contentStudio/MediaLibraryPage";

export const Route = createFileRoute("/_app/studio/media")({
  component: MediaLibraryPage,
});
