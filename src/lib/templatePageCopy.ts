import type { ExperiencePageKeyName, ExperienceNavTab } from "./experienceConfig";

/**
 * Per-template page copy overrides.
 *
 * `buildTemplatePages` generates a designed page for every fan-app page of a
 * template. These overrides let an athlete template ship its *own* wording,
 * feature strip and card grid on each page (Kelce's "Ventures", Monique's
 * "Move / Mind / Manifest", Kyrie's "Vision" pages …) instead of the generic
 * defaults. Everything stays fully editable in the studio and by the AI.
 */
export type TemplatePageCopy = {
  /** Custom page name for this template (e.g. Kelce's "Film Room" instead of "Videos"). */
  label?: string;
  subhead?: string;
  headline?: string;
  body?: string;
  cta?: string;
  features?: [string, string, string, string];
  icons?: [string, string, string, string];
  /** 2x2 card grid: [title, subtitle] */
  cards?: [string, string][];
};

type PageCopyMap = Partial<Record<Exclude<ExperiencePageKeyName, "landing">, TemplatePageCopy>>;

const kelce: PageCopyMap = {
  youreIn: {
    subhead: "WELCOME TO THE INNER CIRCLE",
    headline: "YOU'RE IN",
    body: "Podcast drops, locker-room access and the ventures side of the business — all unlocked.",
    cta: "ENTER THE CIRCLE",
    features: ["PODCAST", "LOCKER ROOM", "VENTURES", "MEMBERS"],
    icons: ["music", "video", "trophy", "crown"],
  },
  home: {
    subhead: "LIFESTYLE. LEGACY. IMPACT.",
    headline: "WELCOME BACK",
    body: "New episodes, drops and behind-the-helmet moments since you were last here.",
    cta: "SEE WHAT'S NEW",
    features: ["NEW EPISODE", "LATEST DROP", "GAME WEEK", "MEMBERS ONLY"],
    icons: ["music", "shop", "calendar", "lock"],
    cards: [
      ["Podcast", "New episode weekly"],
      ["Latest Drop", "Shop the collection"],
      ["Game Week", "Schedule & tickets"],
      ["Inner Circle", "Members only"],
    ],
  },
  videos: {
    subhead: "PRESS PLAY",
    headline: "THE FILM ROOM",
    body: "Mic'd up moments, training days and full-length sit-downs you won't see on broadcast.",
    cta: "PLAY LATEST",
    features: ["MIC'D UP", "TRAINING", "SIT-DOWNS", "ARCHIVE"],
    icons: ["video", "bolt", "users", "clock"],
  },
  news: {
    subhead: "STRAIGHT FROM THE SOURCE",
    headline: "NEWS & NOTES",
    body: "Announcements, features and long-form notes — members read it first.",
    cta: "READ THE LATEST",
    features: ["ANNOUNCEMENTS", "FEATURES", "PRESS", "ARCHIVE"],
    icons: ["news", "star", "sparkle", "clock"],
  },
  events: {
    subhead: "SHOW UP. WIN BIG.",
    headline: "EVENTS & TICKETS",
    body: "Game-week meetups, watch parties and member-only ticket drops.",
    cta: "GET TICKETS",
    features: ["MEETUPS", "TICKETS", "WATCH PARTY", "GIVEAWAYS"],
    icons: ["users", "ticket", "video", "gift"],
  },
  docAndGlo: {
    subhead: "OFFICIAL MERCH",
    headline: "THE COLLECTION",
    body: "Seasonal drops, member pricing and pieces that never hit the public store.",
    cta: "SHOP THE DROP",
    features: ["NEW DROPS", "MEMBER PRICING", "LIMITED", "BUNDLES"],
    icons: ["shop", "crown", "flame", "gift"],
  },
  foundation: {
    subhead: "OFF THE FIELD",
    headline: "THE IMPACT",
    body: "Youth programs, community partners and the work that outlasts the game.",
    cta: "GET INVOLVED",
    features: ["YOUTH PROGRAMS", "PARTNERS", "DONATE", "VOLUNTEER"],
    icons: ["heart", "users", "gift", "check"],
  },
  profile: {
    subhead: "YOUR MEMBERSHIP",
    headline: "YOUR CIRCLE",
    body: "Your badge, your perks and everything you've unlocked so far.",
    cta: "MANAGE MEMBERSHIP",
    features: ["MEMBER BADGE", "PERKS", "SAVED", "ACTIVITY"],
    icons: ["crown", "gift", "heart", "bolt"],
  },
};

const billings: PageCopyMap = {
  youreIn: {
    subhead: "WELCOME IN",
    headline: "YOU'RE IN",
    body: "Movement, mindset and manifestation — your full practice starts now.",
    cta: "START THE PRACTICE",
    features: ["MOVE", "MIND", "MANIFEST", "COMMUNITY"],
    icons: ["bolt", "sparkle", "star", "users"],
  },
  home: {
    subhead: "MOVE. MIND. MANIFEST.",
    headline: "WELCOME BACK",
    body: "Today's session, this week's intention and everything new in the practice.",
    cta: "TODAY'S SESSION",
    features: ["TODAY'S MOVE", "MINDSET", "JOURNAL", "COMMUNITY"],
    icons: ["bolt", "sparkle", "star", "users"],
    cards: [
      ["Move", "Training library"],
      ["Mind", "Mindset sessions"],
      ["Manifest", "Journals & goals"],
      ["Community", "Members circle"],
    ],
  },
  videos: {
    subhead: "PRESS PLAY",
    headline: "THE LIBRARY",
    body: "Guided workouts, recovery flows and full-length mindset sessions.",
    cta: "PLAY A SESSION",
    features: ["WORKOUTS", "RECOVERY", "MINDSET", "BREATHWORK"],
    icons: ["bolt", "heart", "sparkle", "star"],
  },
  news: {
    subhead: "THE JOURNAL",
    headline: "NOTES & LETTERS",
    body: "Letters from the road, wellness notes and what I'm learning this season.",
    cta: "READ THE LETTER",
    features: ["LETTERS", "WELLNESS", "RECIPES", "ARCHIVE"],
    icons: ["news", "heart", "star", "clock"],
  },
  events: {
    subhead: "GATHER WITH US",
    headline: "EVENTS & RETREATS",
    body: "Retreats, live classes and member-only gatherings.",
    cta: "SAVE MY SPOT",
    features: ["RETREATS", "LIVE CLASSES", "MEETUPS", "GIVEAWAYS"],
    icons: ["sparkle", "users", "calendar", "gift"],
  },
  docAndGlo: {
    subhead: "THE SHOP",
    headline: "WEAR THE MANTRA",
    body: "Considered pieces, small drops and member pricing.",
    cta: "SHOP THE DROP",
    features: ["NEW DROPS", "MEMBER PRICING", "LIMITED", "BUNDLES"],
    icons: ["shop", "crown", "flame", "gift"],
  },
  foundation: {
    subhead: "GIVING BACK",
    headline: "THE MISSION",
    body: "Programs for young women in sport, plus the partners making it happen.",
    cta: "GET INVOLVED",
    features: ["PROGRAMS", "PARTNERS", "DONATE", "MENTOR"],
    icons: ["heart", "users", "gift", "check"],
  },
};

const powers: PageCopyMap = {
  youreIn: {
    subhead: "WELCOME, POWER PLAYER",
    headline: "YOU'RE IN",
    body: "Streams, squad nights and behind-the-scenes hoops — all unlocked.",
    cta: "ENTER THE ARENA",
    features: ["LIVE STREAMS", "SQUAD NIGHTS", "EXCLUSIVES", "DROPS"],
    icons: ["live", "users", "video", "gift"],
  },
  home: {
    subhead: "ELITE ATHLETE. CREATOR. GAMER.",
    headline: "WELCOME BACK",
    body: "New clips, stream schedule and what the squad is playing tonight.",
    cta: "SEE WHAT'S NEW",
    features: ["NEW CLIPS", "STREAM TIMES", "DROPS", "SQUAD"],
    icons: ["video", "live", "shop", "users"],
    cards: [
      ["Exclusive Videos", "Behind the scenes"],
      ["News & Events", "Latest updates"],
      ["Gaming", "Live streams"],
      ["Squad", "Members only"],
    ],
  },
  live: {
    subhead: "WE'RE ON AIR",
    headline: "GAME NIGHT",
    body: "Streams, co-op nights and Q&As. Members get pinged first.",
    cta: "JOIN THE STREAM",
    features: ["LIVE NOW", "CO-OP", "Q&A", "REPLAYS"],
    icons: ["live", "users", "sparkle", "clock"],
  },
  videos: {
    subhead: "PRESS PLAY",
    headline: "THE VAULT",
    body: "Hoops highlights, gaming clips and full-length streams.",
    cta: "PLAY LATEST",
    features: ["HIGHLIGHTS", "GAMING", "TRAINING", "REPLAYS"],
    icons: ["video", "bolt", "flame", "clock"],
  },
  events: {
    subhead: "SHOW UP. WIN STUFF.",
    headline: "EVENTS & GIVEAWAYS",
    body: "Tournaments, watch parties and member-only giveaways.",
    cta: "ENTER THE GIVEAWAY",
    features: ["TOURNAMENTS", "WATCH PARTY", "GIVEAWAYS", "CALENDAR"],
    icons: ["trophy", "video", "gift", "calendar"],
  },
};

const curry: PageCopyMap = {
  youreIn: {
    subhead: "WELCOME TO THE INNER CIRCLE",
    headline: "YOU'RE IN",
    body: "More than access. It's a movement. Exclusive content, member events and personal connection — unlocked.",
    cta: "JOIN THE CIRCLE",
    features: ["EXCLUSIVE CONTENT", "MEMBER EVENTS", "PERSONAL CONNECTION", "LEADERSHIP & GROWTH"],
    icons: ["lock", "calendar", "users", "trophy"],
  },
  home: {
    subhead: "BEYOND THE GAME. ALWAYS THE IMPACT.",
    headline: "BUILT DIFFERENT. CURRY.",
    body: "Exclusive videos, news, training and experiences that elevate your access.",
    cta: "JOIN THE CIRCLE",
    features: ["EXCLUSIVE VIDEOS", "NEWS & EVENTS", "TRAINING", "EXPERIENCES"],
    icons: ["video", "news", "bolt", "ticket"],
    cards: [
      ["Exclusive Videos", "Watch now"],
      ["Latest News & Events", "Stay close to what's next"],
      ["Training", "With Purpose"],
      ["Experiences", "Elevate Your Access"],
    ],
  },
  social: {
    subhead: "COMMUNITY",
    headline: "THE COMMUNITY",
    body: "Every post from X, Threads, Instagram and TikTok — pulled into one feed.",
    cta: "FOLLOW ALONG",
    features: ["X", "THREADS", "INSTAGRAM", "TIKTOK"],
    icons: ["sparkle", "users", "camera", "video"],
  },
  videos: {
    subhead: "FEATURED",
    headline: "BEHIND THE WORK: A DAY WITH STEPH",
    body: "Shooting sessions, the mindset, Eat. Learn. Play. and life off the court.",
    cta: "PLAY LATEST",
    features: ["FEATURED", "TRAINING", "INTERVIEWS", "LIFESTYLE"],
    icons: ["video", "bolt", "users", "star"],
    cards: [
      ["Shooting Sessions", "Film Room Breakdown"],
      ["The Mindset", "Preparing for Greatness"],
      ["Eat. Learn. Play.", "Nourishing the Future"],
      ["Off The Court", "Life. Family. Purpose."],
    ],
  },
  news: {
    subhead: "LATEST NEWS",
    headline: "LEAD WITH PURPOSE",
    body: "Steph on impact, family and legacy — plus business, leadership and community notes.",
    cta: "READ MORE",
    features: ["ALL", "LEADERSHIP", "BUSINESS", "IMPACT"],
    icons: ["news", "crown", "trophy", "heart"],
    cards: [
      ["Curry Brands Expands Global Reach", "May 12, 2025"],
      ["On the 'Green' — Steph's Love for Golf", "May 7, 2025"],
      ["Making Space for the Next Generation", "May 4, 2025"],
      ["Steph to Headline Leadership Summit", "May 3, 2025"],
    ],
  },
  events: {
    subhead: "EXPERIENCES",
    headline: "ELEVATE YOUR ACCESS.",
    body: "Unforgettable moments. Beyond the game.",
    cta: "BROWSE EXPERIENCES",
    features: ["UPCOMING", "VIP ACCESS", "CAMPS", "DINNERS"],
    icons: ["calendar", "ticket", "trophy", "users"],
    cards: [
      ["Inner Circle Dinner", "Los Angeles, CA · Jun 15 · from $1,250"],
      ["Camp With Steph", "Charlotte, NC · Jul 12–14 · from $599"],
      ["Courtside Nights", "Member ballot · from $2,400"],
      ["Meet & Greet", "Season pass holders only"],
    ],
  },
  foundation: {
    subhead: "IMPACT",
    headline: "CHANGING LIVES. TOGETHER.",
    body: "Empowering the next generation to dream bigger and live inspired. 28K+ youth impacted · 150+ partners · 50+ cities.",
    cta: "EXPLORE OUR PROGRAMS",
    features: ["28K+ YOUTH", "150+ PARTNERS", "50+ CITIES", "PROGRAMS"],
    icons: ["heart", "users", "star", "check"],
    cards: [
      ["Donate", "Invest in the future."],
      ["Volunteer", "Be the change in your community."],
      ["Eat. Learn. Play.", "Fueling bodies. Fueling minds."],
      ["Partners", "Building together."],
    ],
  },
  docAndGlo: {
    label: "Ventures",
    subhead: "VENTURES",
    headline: "BUILDING WITH PURPOSE.",
    body: "Investing in culture.",
    cta: "EXPLORE ALL VENTURES",
    features: ["UNDERRATED", "CURRY BRAND", "MEDIA", "INVESTMENTS"],
    icons: ["trophy", "shop", "video", "star"],
    cards: [
      ["Underrated", "Overtime studio for the culture."],
      ["Curry Brand", "Devoted to elevate performance."],
      ["Eat.Learn.Play.", "Fueling bodies. Fueling minds."],
      ["Golf", "Passion. Focus. Perspective."],
      ["Media", "Telling stories that move."],
      ["Investments", "Building for the future."],
    ],
  },
  profile: {
    label: "Inner Circle",
    subhead: "INNER CIRCLE",
    headline: "MORE THAN ACCESS. IT'S A MOVEMENT.",
    body: "Join a global community driven by purpose, growth and greatness. 3,250 points · 28 experiences · 14 giveaways · 36 badges.",
    cta: "JOIN THE CIRCLE",
    features: ["EXCLUSIVE CONTENT", "MEMBER EVENTS", "PERSONAL CONNECTION", "LEADERSHIP & GROWTH"],
    icons: ["lock", "calendar", "users", "trophy"],
    cards: [
      ["Exclusive Content", "Behind-the-scenes and early access"],
      ["Member Events", "Special access to experiences"],
      ["Personal Connection", "Closer than ever with Steph"],
      ["Leadership & Growth", "Resources to elevate your journey"],
    ],
  },
  settings: {
    subhead: "SETTINGS",
    headline: "SETTINGS",
    body: "Account, notifications, privacy and connected accounts — exactly how you want it.",
    cta: "LOG OUT",
    features: ["ACCOUNT SETTINGS", "NOTIFICATIONS", "PRIVACY & SECURITY", "CONNECTED ACCOUNTS"],
    icons: ["user", "bolt", "lock", "users"],
    cards: [
      ["Account Settings", "Manage your personal info"],
      ["Notifications", "Manage your preferences"],
      ["Privacy & Security", "Control your data"],
      ["Connected Accounts", "Manage linked accounts"],
      ["Help & Support", "Get help & contact support"],
      ["About Player05", "App info & version"],
    ],
  },
};


const cp3: PageCopyMap = {
  youreIn: {
    subhead: "WELCOME, LEADER",
    headline: "YOU'RE IN",
    body: "Film breakdowns, VIP experiences and the academy — all unlocked.",
    cta: "ENTER THE CIRCLE",
    features: ["FILM ROOM", "EXPERIENCES", "ACADEMY", "MEMBERS"],
    icons: ["video", "ticket", "trophy", "crown"],
  },
  home: {
    subhead: "ELITE EXPERIENCES. EXCLUSIVE CONTENT.",
    headline: "WELCOME BACK",
    body: "This week's film, upcoming experiences and academy updates.",
    cta: "SEE WHAT'S NEW",
    features: ["THIS WEEK'S FILM", "EXPERIENCES", "ACADEMY", "MEMBERS ONLY"],
    icons: ["video", "ticket", "trophy", "lock"],
    cards: [
      ["Film Room", "Breakdowns"],
      ["Experiences", "VIP access"],
      ["Academy", "Youth programs"],
      ["Business", "Ventures & deals"],
    ],
  },
  videos: {
    subhead: "PRESS PLAY",
    headline: "THE FILM ROOM",
    body: "Point-guard reads, pick-and-roll clinics and full-game breakdowns.",
    cta: "PLAY LATEST",
    features: ["READS", "CLINICS", "BREAKDOWNS", "ARCHIVE"],
    icons: ["video", "bolt", "star", "clock"],
  },
  events: {
    subhead: "VIP ACCESS",
    headline: "EXPERIENCES",
    body: "Camps, courtside nights and member-only experiences.",
    cta: "CLAIM ACCESS",
    features: ["CAMPS", "COURTSIDE", "MEETUPS", "GIVEAWAYS"],
    icons: ["trophy", "ticket", "users", "gift"],
  },
  foundation: {
    subhead: "OFF THE COURT",
    headline: "THE ACADEMY",
    body: "Youth basketball, mentorship and scholarship programs.",
    cta: "GET INVOLVED",
    features: ["YOUTH HOOPS", "MENTORSHIP", "SCHOLARSHIPS", "PARTNERS"],
    icons: ["trophy", "users", "gift", "check"],
  },
};

const kyrie: PageCopyMap = {
  youreIn: {
    subhead: "WELCOME TO THE VISION",
    headline: "YOU'RE IN",
    body: "Skill work, culture drops and the conversations that go deeper.",
    cta: "ENTER THE VISION",
    features: ["SKILL WORK", "CULTURE", "EVENTS", "MEMBERS"],
    icons: ["bolt", "sparkle", "calendar", "crown"],
  },
  home: {
    subhead: "CULTURE. VISION. LEGACY.",
    headline: "WELCOME BACK",
    body: "New handles work, culture pieces and what's coming next.",
    cta: "SEE WHAT'S NEW",
    features: ["HANDLES", "FILM ROOM", "CULTURE", "MEMBERS ONLY"],
    icons: ["bolt", "video", "sparkle", "lock"],
    cards: [
      ["Training", "Skill work"],
      ["Film Room", "Breakdowns"],
      ["Events", "Live & IRL"],
      ["Culture", "Art & stories"],
    ],
  },
  videos: {
    subhead: "PRESS PLAY",
    headline: "THE VAULT",
    body: "Handle sessions, footwork clinics and long-form conversations.",
    cta: "PLAY LATEST",
    features: ["HANDLES", "FOOTWORK", "TALKS", "ARCHIVE"],
    icons: ["bolt", "star", "users", "clock"],
  },
  news: {
    subhead: "THE STORIES",
    headline: "CULTURE NOTES",
    body: "Art, community and the stories behind the work.",
    cta: "READ THE LATEST",
    features: ["STORIES", "ART", "COMMUNITY", "ARCHIVE"],
    icons: ["news", "sparkle", "users", "clock"],
  },
};

const sloane: PageCopyMap = {
  youreIn: {
    subhead: "WELCOME TO THE CIRCLE",
    headline: "YOU'RE IN",
    body: "Match film, training weeks, Doc & Glo drops and foundation access — unlocked.",
    cta: "ENTER THE CIRCLE",
    features: ["MATCH FILM", "TRAINING", "DOC & GLO", "FOUNDATION"],
    icons: ["video", "bolt", "shop", "users"],
  },
  home: {
    subhead: "SERVE. RETURN. REPEAT.",
    headline: "WELCOME BACK",
    body: "This week on tour, new film and the latest from Doc & Glo.",
    cta: "SEE WHAT'S NEW",
    features: ["THIS WEEK", "NEW FILM", "DOC & GLO", "FOUNDATION"],
    icons: ["calendar", "video", "shop", "users"],
    cards: [
      ["Match Film", "Point breakdowns"],
      ["Training", "On-court weeks"],
      ["Doc & Glo", "Shop the line"],
      ["Foundation", "Kids on court"],
    ],
  },
  videos: {
    label: "Match Film",
    subhead: "PRESS PLAY",
    headline: "MATCH FILM",
    body: "Full points, practice sets and the tactics behind every win.",
    cta: "PLAY LATEST",
    features: ["POINTS", "PRACTICE", "TOURNAMENTS", "ARCHIVE"],
    icons: ["video", "bolt", "trophy", "clock"],
  },
  news: {
    label: "On Tour",
    subhead: "FROM THE ROAD",
    headline: "ON TOUR",
    body: "Draw updates, results and life between the slams.",
    cta: "READ THE LATEST",
    features: ["RESULTS", "DRAWS", "PRESS", "ARCHIVE"],
    icons: ["news", "trophy", "star", "clock"],
  },
  events: {
    label: "Access",
    subhead: "BE THERE",
    headline: "COURTSIDE ACCESS",
    body: "Clinics, watch parties and player-box experiences for members.",
    cta: "SEE EVENTS",
    features: ["CLINICS", "WATCH PARTIES", "PLAYER BOX", "MEET & GREET"],
    icons: ["calendar", "users", "ticket", "star"],
  },
  docAndGlo: {
    label: "Doc & Glo",
    subhead: "SKIN CONFIDENCE",
    headline: "DOC & GLO",
    body: "Clean sunscreen and skincare built for athletes, by an athlete.",
    cta: "SHOP THE LINE",
    features: ["SPF", "SKINCARE", "BUNDLES", "MEMBER PERKS"],
    icons: ["shop", "sparkle", "gift", "crown"],
  },
  foundation: {
    label: "Foundation",
    subhead: "GIVE BACK",
    headline: "SLOANE STEPHENS FOUNDATION",
    body: "Getting rackets in more hands and keeping kids on court.",
    cta: "GET INVOLVED",
    features: ["PROGRAMS", "SCHOOLS", "DONATE", "VOLUNTEER"],
    icons: ["users", "star", "gift", "sparkle"],
  },
  profile: {
    label: "The Circle",
    subhead: "YOUR MEMBERSHIP",
    headline: "THE CIRCLE",
    body: "Your perks, saved film and member status.",
    cta: "MANAGE MEMBERSHIP",
    features: ["PERKS", "SAVED", "REWARDS", "SETTINGS"],
    icons: ["crown", "star", "gift", "lock"],
  },
};

const circle: PageCopyMap = {
  youreIn: {
    subhead: "WELCOME TO THE CIRCLE",
    headline: "YOU'RE IN",
    body: "Drops, early access, giveaways and real connection — unlocked.",
    cta: "ENTER THE CIRCLE",
    features: ["EXCLUSIVE DROPS", "EARLY ACCESS", "GIVEAWAYS", "COMMUNITY"],
    icons: ["star", "clock", "gift", "users"],
  },
  home: {
    subhead: "JOIN THE CIRCLE",
    headline: "WELCOME BACK",
    body: "Everything new this week — drops, clips and members-only moments.",
    cta: "SEE WHAT'S NEW",
    features: ["NEW DROPS", "LATEST CLIPS", "UPCOMING", "MEMBERS ONLY"],
    icons: ["shop", "video", "calendar", "lock"],
    cards: [
      ["Exclusive Drops", "Members first"],
      ["Latest Clips", "Behind the scenes"],
      ["Upcoming", "Events & streams"],
      ["Members Only", "Your perks"],
    ],
  },
  profile: {
    label: "The Circle",
    subhead: "YOUR MEMBERSHIP",
    headline: "THE CIRCLE",
    body: "Your perks, saved content and member status.",
    cta: "MANAGE MEMBERSHIP",
    features: ["PERKS", "SAVED", "REWARDS", "SETTINGS"],
    icons: ["crown", "star", "gift", "lock"],
  },
};



/** Page copy per template id. */
const RAW_TEMPLATE_PAGE_COPY: Record<string, PageCopyMap> = {
  "inner-circle": kelce,
  "move-mind": billings,
  "own-your-power": powers,
  "built-different": curry,
  "built-to-lead": cp3,
  "trust-the-vision": kyrie,
  "serve-return-repeat": sloane,
  "join-the-circle": circle,
};

/**
 * Custom page names per template. These rename the fan-app pages everywhere in
 * the studio (navigator, section list, tab picker) so a Kelce app shows
 * "Film Room" instead of "Videos". Athletes can still rename any page.
 */
const TEMPLATE_PAGE_LABELS: Record<
  string,
  Partial<Record<Exclude<ExperiencePageKeyName, "landing">, string>>
> = {
  "inner-circle": { videos: "Film Room", news: "News & Notes", docAndGlo: "Shop", foundation: "Ventures", profile: "Inner Circle" },
  "move-mind": { home: "Today", videos: "Move", news: "Mind", events: "Gather", foundation: "Manifest", profile: "Me" },
  "own-your-power": { home: "Home", live: "Live", videos: "Clips", events: "Events", profile: "Squad" },
  "built-different": { social: "Community", videos: "Videos", news: "News", events: "Experiences", foundation: "Impact", docAndGlo: "Ventures", profile: "Inner Circle" },
  "built-to-lead": { videos: "Film", events: "Access", foundation: "Academy" },
  "trust-the-vision": { videos: "The Vault", news: "Culture", foundation: "Vision" },
  "serve-return-repeat": { videos: "Match Film", news: "On Tour", events: "Access", docAndGlo: "Doc & Glo", profile: "The Circle" },
  "join-the-circle": { profile: "The Circle" },
};

export const TEMPLATE_PAGE_COPY: Record<string, PageCopyMap> = Object.fromEntries(
  Object.entries(RAW_TEMPLATE_PAGE_COPY).map(([id, map]) => {
    const labels = TEMPLATE_PAGE_LABELS[id] ?? {};
    const merged: PageCopyMap = { ...map };
    for (const [key, label] of Object.entries(labels)) {
      const pageKey = key as Exclude<ExperiencePageKeyName, "landing">;
      merged[pageKey] = { ...(merged[pageKey] ?? {}), label };
    }
    return [id, merged];
  }),
);


const tab = (
  id: string,
  label: string,
  icon: string,
  pageKey: ExperiencePageKeyName,
): ExperienceNavTab => ({ id, label, icon, pageKey });

/** Bottom tab bar per template — reorderable / renameable in the studio. */
export const TEMPLATE_NAV_TABS: Record<string, ExperienceNavTab[]> = {
  "inner-circle": [
    tab("home", "Home", "home", "home"),
    tab("videos", "Videos", "video", "videos"),
    tab("news", "News", "news", "news"),
    tab("shop", "Shop", "shop", "docAndGlo"),
    tab("profile", "Circle", "crown", "profile"),
  ],
  "move-mind": [
    tab("home", "Today", "home", "home"),
    tab("videos", "Move", "bolt", "videos"),
    tab("news", "Mind", "sparkle", "news"),
    tab("events", "Gather", "calendar", "events"),
    tab("profile", "Me", "user", "profile"),
  ],
  "own-your-power": [
    tab("home", "Home", "home", "home"),
    tab("live", "Live", "live", "live"),
    tab("videos", "Clips", "video", "videos"),
    tab("events", "Events", "calendar", "events"),
    tab("profile", "Squad", "users", "profile"),
  ],
  "built-different": [
    tab("home", "Home", "home", "home"),
    tab("social", "Social", "users", "social"),
    tab("videos", "Videos", "video", "videos"),
    tab("news", "News", "news", "news"),
    tab("profile", "Profile", "user", "profile"),
  ],
  "built-to-lead": [
    tab("home", "Home", "home", "home"),
    tab("videos", "Film", "video", "videos"),
    tab("events", "Access", "ticket", "events"),
    tab("foundation", "Academy", "trophy", "foundation"),
    tab("profile", "Profile", "user", "profile"),
  ],
  "trust-the-vision": [
    tab("home", "Home", "home", "home"),
    tab("videos", "Vault", "video", "videos"),
    tab("news", "Culture", "sparkle", "news"),
    tab("events", "Events", "calendar", "events"),
    tab("profile", "Profile", "user", "profile"),
  ],
  "serve-return-repeat": [
    tab("home", "Home", "home", "home"),
    tab("videos", "Film", "video", "videos"),
    tab("news", "Tour", "news", "news"),
    tab("shop", "Doc & Glo", "shop", "docAndGlo"),
    tab("profile", "Circle", "user", "profile"),
  ],

};
