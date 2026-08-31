import { createFileRoute } from "@tanstack/react-router";
import { BioLinkPage } from "@/pages/BioLinkPage";

export const Route = createFileRoute("/_app/bio-link")({
  component: BioLinkPage,
});
