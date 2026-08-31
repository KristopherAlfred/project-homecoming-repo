import { createFileRoute } from "@tanstack/react-router";
import { MarketingLandingPage } from "@/pages/MarketingLandingPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PlayersOS — Every athlete deserves their own platform" },
      { name: "description", content: "PlayersOS gives pro athletes a branded fan app, unified analytics, AI strategist, and one bio link that turns followers into a fanbase." },
      { property: "og:title", content: "PlayersOS — Every athlete deserves their own platform" },
      { property: "og:description", content: "PlayersOS gives pro athletes a branded fan app, unified analytics, AI strategist, and one bio link that turns followers into a fanbase." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MarketingLandingPage,
});
