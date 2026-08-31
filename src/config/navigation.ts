export type NavItem = {
  label: string;
  path: string;
  external?: boolean;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export type NavSection = {
  label: string;
  icon: string;
  items: NavItem[];
  groups?: NavGroup[];
  /** Header navigates directly — no dropdown */
  directPath?: string;
};

function sectionPaths(section: NavSection): string[] {
  const paths = section.directPath ? [section.directPath] : [];
  paths.push(...section.items.filter((i) => !i.external).map((i) => i.path));
  for (const group of section.groups ?? []) {
    paths.push(...group.items.filter((i) => !i.external).map((i) => i.path));
  }
  return paths;
}

export function isNavPathActive(pathname: string, path: string) {
  return path === "/" ? pathname === "/" : pathname.startsWith(path);
}

export function isSectionActive(pathname: string, section: NavSection) {
  return sectionPaths(section).some((path) => isNavPathActive(pathname, path));
}

export const navSections: NavSection[] = [
  {
    label: "DASHBOARD",
    icon: "layout-dashboard",
    items: [{ label: "Dashboard", path: "/" }],
  },
  {
    label: "FAN APP",
    icon: "smartphone",
    items: [
      { label: "Social", path: "/content/social" },
      { label: "News", path: "/content/news" },
      { label: "Videos", path: "/content/videos" },
      { label: "Events & Giveaways", path: "/content/events" },
      { label: "Content Calendar", path: "/content/calendar" },
      { label: "Bio Link", path: "/bio-link" },
      { label: "Notifications", path: "/notifications" },
    ],
  },
  {
    label: "CONTENT STUDIO",
    icon: "clapperboard",
    items: [
      { label: "Content Calendar", path: "/studio/calendar" },
      { label: "Create Content", path: "/studio/create" },
      { label: "Scheduled Posts", path: "/studio/schedule" },
      { label: "Media Library", path: "/studio/media" },
      { label: "Content Analytics", path: "/studio/analytics" },
    ],
  },
  {
    label: "LIVE",
    icon: "radio",
    items: [],
    directPath: "/live",
  },
  {
    label: "EXPERIENCE",
    icon: "sparkles",
    items: [],
    directPath: "/experience",
  },
  {
    label: "PLATFORMS",
    icon: "layers",
    items: [],
    directPath: "/platforms",
  },
  {
    label: "FANS & DATA",
    icon: "users",
    items: [
      { label: "Fan Locations", path: "/fans/audience" },
      { label: "Email/SMS List", path: "/fans/subscribers" },
    ],
  },

  {
    label: "PERFORMANCE",
    icon: "bar-chart-2",
    items: [{ label: "Traffic Overview", path: "/performance/traffic" }],
  },
  {
    label: "ENGAGEMENT",
    icon: "message-circle",
    items: [
      { label: "Fan Activity", path: "/engagement/activity" },
      { label: "Support Inbox", path: "/engagement/support" },
    ],
  },
  {
    label: "SETTINGS",
    icon: "settings",
    items: [],
    directPath: "/settings",
  },
];

/**
 * Route copy uses `{fanApp}` and `{athlete}` tokens so every page header reads
 * from the logged-in athlete instead of one hardcoded name.
 */
export function fillRouteCopy(
  copy: string,
  values: { fanApp: string; athlete: string },
): string {
  return copy
    .replaceAll("{fanApp}", values.fanApp)
    .replaceAll("{athlete}", values.athlete);
}

export type RouteMeta = {
  title: string;
  subtitle: string;
};

export const routeMeta: Record<string, RouteMeta> = {
  "/": {
    title: "Dashboard Overview",
    subtitle: "Real-time performance of the {fanApp} ecosystem.",
  },
  "/content/social": {
    title: "Social",
    subtitle: "Live Instagram, X, and Facebook analytics from {fanApp}.",
  },
  "/content/news": {
    title: "News",
    subtitle: "Write newsletters and insights that publish straight to the {fanApp} app.",
  },
  "/content/videos": {
    title: "Videos",
    subtitle: "YouTube analytics plus Exclusive uploads — same tabs fans use in {fanApp}.",
  },
  "/content/events": {
    title: "Events & Giveaways",
    subtitle: "Create and publish events and giveaways fans see in the {fanApp} app.",
  },
  "/content/calendar": {
    title: "Content Calendar",
    subtitle: "Live posts from {fanApp} and social — exact date, time, and what went live.",
  },
  "/live": {
    title: "Live",
    subtitle: "Go live on {fanApp} for fans watching in the app and on the site.",
  },
  "/experience": {
    title: "Experience",
    subtitle: "Drag, style, and publish the {fanApp} app home screen.",
  },
  "/notifications": {
    title: "Notifications",
    subtitle: "Schedule in-app toasts with the same look as the points earned popup.",
  },
  "/profile": {
    title: "Profile",
    subtitle: "View and change the photo shown in the top-right corner.",
  },
  "/engagement/activity": {
    title: "Fan Activity",
    subtitle: "Live {fanApp} app clicks, page views, and fan interactions from Supabase.",
  },
  "/engagement/support": {
    title: "Support Inbox",
    subtitle: "Help & Support reports submitted by fans in the {fanApp} app.",
  },
  "/settings": {
    title: "Settings",
    subtitle: "Themes, account preferences, integrations, and access roles.",
  },
  "/fans/audience": {
    title: "Fan Locations",
    subtitle: "Live {fanApp} fan composition, geo, and engagement from Supabase.",
  },
  "/fans/subscribers": {
    title: "Email / SMS List",
    subtitle: "Live {fanApp} fan emails, phones, and SMS opt-ins from Supabase.",
  },
  "/bio-link": {
    title: "Bio Link",
    subtitle: "Claim one short link that funnels social traffic into {fanApp}.",
  },
  "/studio/calendar": {
    title: "Content Calendar",
    subtitle: "Everything {fanApp} has drafted, scheduled, and published — one calendar.",
  },
  "/studio/create": {
    title: "Create Content",
    subtitle: "Compose once, tailor per platform, and publish to {fanApp}'s connected accounts.",
  },
  "/studio/schedule": {
    title: "Scheduled Posts",
    subtitle: "Queue, status, and per-platform publishing results.",
  },
  "/studio/media": {
    title: "Media Library",
    subtitle: "Photos, video, and graphics available to every {fanApp} post.",
  },
  "/studio/analytics": {
    title: "Content Analytics",
    subtitle: "Publishing performance across {fanApp}'s connected platforms.",
  },
  "/performance/traffic": {
    title: "Traffic Overview",
    subtitle: "Live {fanApp} page views, clicks, and navigation from Supabase fan_events.",
  },
};
