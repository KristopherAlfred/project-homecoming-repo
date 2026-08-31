import { createFileRoute } from "@tanstack/react-router";
import { CreateContentPage } from "@/pages/contentStudio/CreateContentPage";

export const Route = createFileRoute("/_app/studio/create")({
  component: CreateContentPage,
});
