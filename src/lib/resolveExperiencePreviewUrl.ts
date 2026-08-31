import { resolveAssetUrl } from "./homeLayoutApi";

/** Prefer local dashboard copies for /experience/* so pickers work before fan-app deploy. */
export function resolveExperiencePreviewUrl(src: string) {
  if (!src) return "";
  if (src.startsWith("data:") || src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("/experience/")) return src;
  return resolveAssetUrl(src);
}
