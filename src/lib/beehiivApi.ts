export type BeehiivPost = {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  publishedAt: string;
  thumbnail: string;
  source: "beehiiv";
};

export type BeehiivFeed = {
  syncedAt: string;
  source?: "live" | "cache";
  publication: {
    id: string;
    name: string;
    url: string;
  };
  posts: BeehiivPost[];
};

function decodeTitle(raw: string) {
  return raw.replace(/\\u([\dA-Fa-f]{4})/g, (_, hex) =>
    String.fromCharCode(Number.parseInt(hex, 16)),
  );
}

async function fetchText(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Beehiiv fetch failed (${response.status})`);
  return response.text();
}

function parseBeehiivHtml(html: string, sitemap: string, configuredUrl: string): BeehiivFeed {
  const titleMatches = [...html.matchAll(/"web_title":"((?:\\.|[^"\\])*)"/g)].map((m) =>
    decodeTitle(m[1]),
  );
  const slugMatches = [...html.matchAll(/"slug":"([^"]+)"/g)]
    .map((m) => m[1])
    .filter((slug) => !["podcast", "business", "posts", "authors"].includes(slug));

  const slugs: string[] = [];
  const seen = new Set<string>();
  for (const slug of slugMatches) {
    if (seen.has(slug)) continue;
    seen.add(slug);
    slugs.push(slug);
  }

  const lastmodBySlug = new Map<string, string>();
  for (const match of sitemap.matchAll(
    /<url>\s*<loc>(.*?)<\/loc>\s*(?:<lastmod>(.*?)<\/lastmod>)?/gs,
  )) {
    const loc = match[1];
    if (!loc.includes("/p/")) continue;
    const slug = loc.replace(/\/$/, "").split("/").pop() || "";
    if (slug) lastmodBySlug.set(slug, match[2] || new Date().toISOString());
  }

  const count = Math.min(slugs.length, titleMatches.length);
  const posts: BeehiivPost[] = Array.from({ length: count }, (_, index) => ({
    id: slugs[index],
    title: titleMatches[index] || slugs[index],
    subtitle: "",
    url: `${configuredUrl}/p/${slugs[index]}`,
    publishedAt: lastmodBySlug.get(slugs[index]) || new Date().toISOString(),
    thumbnail: "",
    source: "beehiiv",
  }));

  return {
    syncedAt: new Date().toISOString(),
    source: "live",
    publication: {
      id: "",
      name: "Off-Court",
      url: "",
    },
    posts,
  };
}

export async function fetchBeehiivFeed(): Promise<BeehiivFeed | null> {
  // Beehiiv has no per-athlete connection record yet — only fetch when this
  // athlete's dashboard deployment has explicitly configured its own
  // publication URL, otherwise treat as not connected (never show another
  // athlete's newsletter).
  const configuredUrl = import.meta.env.VITE_BEEHIIV_URL?.trim().replace(/\/$/, "");
  if (!configuredUrl) return null;

  const sources = [
    { html: "/proxy/beehiiv/", sitemap: "/proxy/beehiiv/sitemap.xml" },
    {
      html: `${configuredUrl}/`,
      sitemap: `${configuredUrl}/sitemap.xml`,
    },
  ];

  for (const source of sources) {
    try {
      const [html, sitemap] = await Promise.all([
        fetchText(source.html),
        fetchText(source.sitemap).catch(() => ""),
      ]);
      if (!html.includes("web_title")) continue;
      const feed = parseBeehiivHtml(html, sitemap, configuredUrl);
      if (feed.posts.length) return feed;
    } catch {
      // try next
    }
  }

  return null;
}

export function formatBeehiivDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
