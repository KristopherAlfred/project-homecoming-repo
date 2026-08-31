/** Hard-reject legacy demo-account analytics so no athlete ever sees someone else's data. */

const DAME_USERNAMES = new Set([
  "damianlillard",
  "dame_lillard",
  "damianlillardofficial",
]);

const DAME_CHANNEL_IDS = new Set(["UCIhTfcMzbR5wyNeh57ju0ug"]);

function norm(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
}

export function isDameInstagramAnalytics(data: {
  profile?: { username?: string; fullName?: string; permalink?: string };
} | null | undefined) {
  if (!data?.profile) return false;
  const username = norm(data.profile.username);
  const permalink = norm(data.profile.permalink);
  if (DAME_USERNAMES.has(username)) return true;
  if (permalink.includes("instagram.com/damianlillard")) return true;
  return false;
}

export function isDameTwitterAnalytics(data: {
  profile?: { screenName?: string; handle?: string; name?: string; permalink?: string };
  recentPosts?: Array<{ permalink?: string }>;
} | null | undefined) {
  if (!data?.profile) return false;
  const screen = norm(data.profile.screenName || data.profile.handle);
  if (DAME_USERNAMES.has(screen) || screen === "dame_lillard") return true;
  if (norm(data.profile.permalink).includes("dame_lillard")) return true;
  if (norm(data.profile.name).includes("damian lillard")) return true;
  const sample = data.recentPosts?.[0]?.permalink ?? "";
  if (norm(sample).includes("dame_lillard")) return true;
  return false;
}

export function isDameFacebookAnalytics(data: {
  page?: { slug?: string; name?: string; permalink?: string };
  recentPosts?: Array<{ text?: string; permalink?: string }>;
} | null | undefined) {
  if (!data?.page) return false;
  const slug = norm(data.page.slug);
  const permalink = norm(data.page.permalink);
  if (slug === "damianlillard" || permalink.includes("facebook.com/damianlillard")) return true;
  if (norm(data.page.name).includes("damian lillard")) return true;
  const sample = `${data.recentPosts?.[0]?.text ?? ""} ${data.recentPosts?.[0]?.permalink ?? ""}`;
  if (/damedolla|#dame|dame9|yagi mixtape/i.test(sample)) return true;
  return false;
}

export function isDameYouTubeAnalytics(data: {
  channel?: { id?: string; handle?: string; name?: string };
  recentVideos?: Array<{ title?: string }>;
} | null | undefined) {
  if (!data?.channel) return false;
  if (DAME_CHANNEL_IDS.has(String(data.channel.id ?? ""))) return true;
  const handle = norm(data.channel.handle);
  if (handle === "damianlillard") return true;
  if (norm(data.channel.name).includes("damian lillard")) return true;
  const title = data.recentVideos?.[0]?.title ?? "";
  if (/dame\s*d\.?o\.?l\.?l\.?a|and still/i.test(title)) return true;
  return false;
}
