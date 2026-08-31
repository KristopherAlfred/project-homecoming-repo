import { createFileRoute } from "@tanstack/react-router";
import { SocialContentPage } from "@/pages/SocialContentPage";

export const Route = createFileRoute("/_app/content/social")({
  component: SocialContentPage,
});
