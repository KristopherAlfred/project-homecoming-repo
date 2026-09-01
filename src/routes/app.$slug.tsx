import { createFileRoute } from "@tanstack/react-router";
import { FanAppPublicPage } from "@/pages/FanAppPublicPage";

export const Route = createFileRoute("/app/$slug")({
  head: () => ({
    meta: [
      { title: "Fan App" },
      { name: "description", content: "Join the circle and get exclusive access, drops and updates." },
      { property: "og:title", content: "Fan App" },
      { property: "og:description", content: "Join the circle and get exclusive access, drops and updates." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FanAppPublicPage,
});
