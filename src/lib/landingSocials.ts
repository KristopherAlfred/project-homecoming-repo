export type LandingSocialIcon =
  | "instagram"
  | "x"
  | "tiktok"
  | "youtube"
  | "facebook"
  | "shop";

export type LandingSocialStat = {
  id: string;
  count: string;
  unit: string;
  url: string;
  icon: LandingSocialIcon;
};

export const HOT_PINK = "#FF2D95";
export const MINT = "var(--theme-accent)";

export const DEFAULT_LANDING_SOCIALS: LandingSocialStat[] = [];

export const DEFAULT_FANS_PROOF_TITLE = "100K+ Fans Already Joined";
export const DEFAULT_FANS_PROOF_BODY = "Real fans. Real community. Real connection.";
export const DEFAULT_FOLLOW_TITLE = "Follow along";
export const DEFAULT_FOOTER_LINE = "";

export function normalizeLandingSocials(raw: unknown): LandingSocialStat[] {
  if (!Array.isArray(raw) || !raw.length) return DEFAULT_LANDING_SOCIALS.map((s) => ({ ...s }));
  const out: LandingSocialStat[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Partial<LandingSocialStat>;
    const id = String(r.id || "").trim();
    const icon = String(r.icon || id || "").toLowerCase() as LandingSocialIcon;
    if (!id || !r.url) continue;
    out.push({
      id,
      count: String(r.count || "").trim() || id,
      unit: String(r.unit || "").trim() || "Followers",
      url: String(r.url).trim(),
      icon: (["instagram", "x", "tiktok", "youtube", "facebook", "shop"] as const).includes(icon)
        ? icon
        : "instagram",
    });
  }
  return out.length ? out : DEFAULT_LANDING_SOCIALS.map((s) => ({ ...s }));
}
