import { createFileRoute } from "@tanstack/react-router";
import { ExperiencePage } from "@/pages/ExperiencePage";

export const Route = createFileRoute("/_app/experience")({
  head: () => ({
    meta: [
      { title: "Fan App Experience | PlayersOS" },
      { name: "description", content: "Design and publish a premium, personalized fan app experience." },
      { property: "og:title", content: "Fan App Experience | PlayersOS" },
      { property: "og:description", content: "Design and publish a premium, personalized fan app experience." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExperiencePage,
});
