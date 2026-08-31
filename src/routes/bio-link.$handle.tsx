import { createFileRoute } from "@tanstack/react-router";
import { BioLinkRedirectPage } from "@/pages/BioLinkRedirectPage";

export const Route = createFileRoute("/bio-link/$handle")({
  component: BioLinkRedirectPage,
});
