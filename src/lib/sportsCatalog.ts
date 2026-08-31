/**
 * The sport / league catalog powering onboarding. Selecting a league drives the
 * athlete's accent colour and the badge shown in the dashboard sidebar, so
 * everything picked here shows up on the front end.
 */

export type BallKind =
  | "basketball"
  | "football"
  | "baseball"
  | "softball"
  | "soccer"
  | "tennis"
  | "golf"
  | "volleyball"
  | "hockey"
  | "track"
  | "swim"
  | "gymnastics"
  | "combat"
  | "esports"
  | "generic";

export type LeagueTier = "pro" | "college" | "youth" | "school" | "intl";

export type League = {
  id: string;
  label: string;
  /** Used to pull the league mark from a favicon CDN. */
  domain?: string;
  accent: string;
  accentText: string;
  tier: LeagueTier;
};

export type Sport = {
  id: string;
  label: string;
  ball: BallKind;
  accent: string;
  accentText: string;
  leagues: League[];
};

const DARK = "#0A0A0A";
const LIGHT = "#FFFFFF";

function league(
  id: string,
  label: string,
  accent: string,
  tier: LeagueTier,
  domain?: string,
  accentText: string = LIGHT,
): League {
  return { id, label, accent, accentText, tier, domain };
}

export const SPORTS: Sport[] = [
  {
    id: "basketball",
    label: "Basketball",
    ball: "basketball",
    accent: "#EE6730",
    accentText: DARK,
    leagues: [
      league("nba", "NBA", "#C8102E", "pro", "nba.com"),
      league("wnba", "WNBA", "#FF6900", "pro", "wnba.com", DARK),
      league("gleague", "NBA G League", "#1D428A", "pro", "gleague.nba.com"),
      league("euroleague", "EuroLeague", "#F26522", "intl", "euroleaguebasketball.net", DARK),
      league("ncaa-mbb", "NCAA Basketball", "#0653A1", "college", "ncaa.com"),
      league("nbl", "NBL", "#0B2C4A", "intl", "nbl.com.au"),
      league("obe", "Overtime Elite", "#00E0A1", "youth", "overtimeelite.com", DARK),
      league("aau-bb", "AAU Basketball", "#1B4D8F", "youth", "aausports.org"),
      league("hs-bb", "High School", "#E2231A", "school", "nfhs.org"),
      league("olympics-bb", "Olympics / FIBA", "#0081C8", "intl", "fiba.basketball"),
    ],
  },
  {
    id: "football",
    label: "Football",
    ball: "football",
    accent: "#8B4513",
    accentText: LIGHT,
    leagues: [
      league("nfl", "NFL", "#013369", "pro", "nfl.com"),
      league("ncaa-fb", "NCAA Football", "#0653A1", "college", "ncaa.com"),
      league("ufl", "UFL", "#E03A3E", "pro", "theufl.com"),
      league("cfl", "CFL", "#8C2332", "pro", "cfl.ca"),
      league("flag", "Flag Football", "#00A3E0", "youth", "nflflag.com"),
      league("hs-fb", "High School", "#E2231A", "school", "nfhs.org"),
      league("pop-warner", "Pop Warner / Youth", "#1F3E7C", "youth", "popwarner.com"),
    ],
  },
  {
    id: "baseball",
    label: "Baseball",
    ball: "baseball",
    accent: "#D50032",
    accentText: LIGHT,
    leagues: [
      league("mlb", "MLB", "#041E42", "pro", "mlb.com"),
      league("milb", "Minor League", "#0E4C92", "pro", "milb.com"),
      league("ncaa-bb", "NCAA Baseball", "#0653A1", "college", "ncaa.com"),
      league("npb", "NPB", "#C8102E", "intl", "npb.jp"),
      league("little-league", "Little League", "#F2A900", "youth", "littleleague.org", DARK),
      league("perfect-game", "Perfect Game", "#0A3161", "youth", "perfectgame.org"),
      league("hs-baseball", "High School", "#E2231A", "school", "nfhs.org"),
    ],
  },
  {
    id: "softball",
    label: "Softball",
    ball: "softball",
    accent: "#C6E000",
    accentText: DARK,
    leagues: [
      league("au-softball", "Athletes Unlimited", "#F4C300", "pro", "auprosports.com", DARK),
      league("ncaa-softball", "NCAA Softball", "#0653A1", "college", "ncaa.com"),
      league("usa-softball", "USA Softball", "#0A3161", "intl", "usasoftball.com"),
      league("travel-softball", "Travel / Club", "#7B2D8E", "youth"),
      league("hs-softball", "High School", "#E2231A", "school", "nfhs.org"),
    ],
  },
  {
    id: "soccer",
    label: "Soccer",
    ball: "soccer",
    accent: "#00B140",
    accentText: DARK,
    leagues: [
      league("mls", "MLS", "#0C2340", "pro", "mlssoccer.com"),
      league("nwsl", "NWSL", "#0B1E3C", "pro", "nwslsoccer.com"),
      league("epl", "Premier League", "#3D195B", "intl", "premierleague.com"),
      league("laliga", "LaLiga", "#EE8707", "intl", "laliga.com", DARK),
      league("usl", "USL", "#00205B", "pro", "uslsoccer.com"),
      league("ncaa-soccer", "NCAA Soccer", "#0653A1", "college", "ncaa.com"),
      league("mls-next", "MLS NEXT / Academy", "#1B998B", "youth", "mlssoccer.com", DARK),
      league("ecnl", "ECNL / Club", "#1D3557", "youth", "theecnl.com"),
      league("hs-soccer", "High School", "#E2231A", "school", "nfhs.org"),
    ],
  },
  {
    id: "tennis",
    label: "Tennis",
    ball: "tennis",
    accent: "#CCFF00",
    accentText: DARK,
    leagues: [
      league("wta", "WTA Tour", "#6A2D8F", "pro", "wtatennis.com"),
      league("atp", "ATP Tour", "#0B2545", "pro", "atptour.com"),
      league("itf", "ITF", "#00563F", "intl", "itftennis.com"),
      league("usta", "USTA", "#0C2340", "youth", "usta.com"),
      league("ncaa-tennis", "NCAA Tennis", "#0653A1", "college", "ncaa.com"),
      league("juniors", "ITF Juniors", "#1E88A8", "youth", "itftennis.com"),
      league("hs-tennis", "High School", "#E2231A", "school", "nfhs.org"),
    ],
  },
  {
    id: "golf",
    label: "Golf",
    ball: "golf",
    accent: "#E8F5D0",
    accentText: DARK,
    leagues: [
      league("pga", "PGA Tour", "#0A3B2E", "pro", "pgatour.com"),
      league("lpga", "LPGA", "#004B87", "pro", "lpga.com"),
      league("korn-ferry", "Korn Ferry Tour", "#2A6E4F", "pro", "pgatour.com"),
      league("liv", "LIV Golf", "#00A0DF", "pro", "livgolf.com"),
      league("ncaa-golf", "NCAA Golf", "#0653A1", "college", "ncaa.com"),
      league("ajga", "AJGA / Juniors", "#1B5E20", "youth", "ajga.org"),
      league("hs-golf", "High School", "#E2231A", "school", "nfhs.org"),
    ],
  },
  {
    id: "track",
    label: "Track & Field",
    ball: "track",
    accent: "#FF3B30",
    accentText: LIGHT,
    leagues: [
      league("world-athletics", "World Athletics", "#003A70", "intl", "worldathletics.org"),
      league("usatf", "USATF", "#0A3161", "pro", "usatf.org"),
      league("diamond-league", "Diamond League", "#0B7285", "pro", "diamondleague.com"),
      league("grand-slam-track", "Grand Slam Track", "#111111", "pro", "grandslamtrack.com"),
      league("ncaa-track", "NCAA Track", "#0653A1", "college", "ncaa.com"),
      league("aau-track", "AAU Track", "#1B4D8F", "youth", "aausports.org"),
      league("hs-track", "High School", "#E2231A", "school", "nfhs.org"),
    ],
  },
  {
    id: "volleyball",
    label: "Volleyball",
    ball: "volleyball",
    accent: "#F2B400",
    accentText: DARK,
    leagues: [
      league("lovb", "LOVB", "#1F1F53", "pro", "lovb.com"),
      league("pvf", "Pro Volleyball Federation", "#C8102E", "pro", "provolleyball.com"),
      league("avp", "AVP Beach", "#0072CE", "pro", "avp.com"),
      league("ncaa-vb", "NCAA Volleyball", "#0653A1", "college", "ncaa.com"),
      league("usa-vb", "USA Volleyball / Club", "#0A3161", "youth", "usavolleyball.org"),
      league("hs-vb", "High School", "#E2231A", "school", "nfhs.org"),
    ],
  },
  {
    id: "hockey",
    label: "Hockey",
    ball: "hockey",
    accent: "#4A90D9",
    accentText: DARK,
    leagues: [
      league("nhl", "NHL", "#111111", "pro", "nhl.com"),
      league("pwhl", "PWHL", "#7B1E3A", "pro", "thepwhl.com"),
      league("ahl", "AHL", "#1D3C6E", "pro", "theahl.com"),
      league("ncaa-hockey", "NCAA Hockey", "#0653A1", "college", "ncaa.com"),
      league("ushl", "USHL / Juniors", "#0E2A47", "youth", "ushl.com"),
      league("hs-hockey", "High School", "#E2231A", "school", "nfhs.org"),
    ],
  },
  {
    id: "swimming",
    label: "Swimming",
    ball: "swim",
    accent: "#00B7E4",
    accentText: DARK,
    leagues: [
      league("world-aquatics", "World Aquatics", "#0072BC", "intl", "worldaquatics.com"),
      league("usa-swimming", "USA Swimming", "#0A3161", "pro", "usaswimming.org"),
      league("isl", "International Swim League", "#12A5A5", "pro", "isl.global", DARK),
      league("ncaa-swim", "NCAA Swimming", "#0653A1", "college", "ncaa.com"),
      league("club-swim", "Club / Age Group", "#1E88A8", "youth"),
      league("hs-swim", "High School", "#E2231A", "school", "nfhs.org"),
    ],
  },
  {
    id: "gymnastics",
    label: "Gymnastics",
    ball: "gymnastics",
    accent: "#FF5FA2",
    accentText: DARK,
    leagues: [
      league("usa-gym", "USA Gymnastics", "#0A3161", "pro", "usagym.org"),
      league("fig", "FIG / World", "#0081C8", "intl", "gymnastics.sport"),
      league("ncaa-gym", "NCAA Gymnastics", "#0653A1", "college", "ncaa.com"),
      league("club-gym", "Club / Elite", "#B5179E", "youth"),
      league("hs-gym", "High School", "#E2231A", "school", "nfhs.org"),
    ],
  },
  {
    id: "combat",
    label: "Combat Sports",
    ball: "combat",
    accent: "#D62828",
    accentText: LIGHT,
    leagues: [
      league("ufc", "UFC", "#D20A0A", "pro", "ufc.com"),
      league("pfl", "PFL", "#00A3E0", "pro", "pflmma.com"),
      league("boxing", "Pro Boxing", "#111111", "pro", "wbcboxing.com"),
      league("one", "ONE Championship", "#E8112D", "intl", "onefc.com"),
      league("ncaa-wrestling", "NCAA Wrestling", "#0653A1", "college", "ncaa.com"),
      league("usa-wrestling", "USA Wrestling", "#0A3161", "youth", "themat.com"),
      league("hs-wrestling", "High School", "#E2231A", "school", "nfhs.org"),
    ],
  },
  {
    id: "esports",
    label: "Esports",
    ball: "esports",
    accent: "#7C4DFF",
    accentText: LIGHT,
    leagues: [
      league("lcs", "League Championship", "#0BC6E3", "pro", "lolesports.com", DARK),
      league("cdl", "Call of Duty League", "#F5A623", "pro", "callofdutyleague.com", DARK),
      league("valorant", "VCT Valorant", "#FF4655", "pro", "valorantesports.com"),
      league("nace", "Collegiate Esports", "#0653A1", "college", "nacesports.org"),
      league("hs-esports", "High School Esports", "#E2231A", "school", "highschoolesportsleague.com"),
    ],
  },
  {
    id: "other",
    label: "Other Sport",
    ball: "generic",
    accent: "#7CE7B0",
    accentText: DARK,
    leagues: [
      league("pro-other", "Professional", "#7CE7B0", "pro", undefined, DARK),
      league("college-other", "Collegiate", "#0653A1", "college", "ncaa.com"),
      league("hs-other", "High School", "#E2231A", "school", "nfhs.org"),
      league("club-other", "Club / Academy", "#4C8DFF", "school"),
      league("independent", "Independent", "#F5C451", "pro", undefined, DARK),
    ],
  },
];

export const DIVISIONS: { id: string; label: string; hint: string }[] = [
  { id: "female", label: "Women's", hint: "Women's division" },
  { id: "male", label: "Men's", hint: "Men's division" },
  { id: "mixed", label: "Co-ed", hint: "Mixed division" },
  { id: "", label: "Prefer not to say", hint: "Keep it private" },
];

export const TIER_LABELS: Record<LeagueTier, string> = {
  pro: "Pro",
  college: "College",
  youth: "Youth / Club",
  school: "High School",
  intl: "International",
};

export function findSport(id: string | null | undefined): Sport | null {
  if (!id) return null;
  const key = id.toLowerCase();
  return (
    SPORTS.find((sport) => sport.id === key) ??
    SPORTS.find((sport) => sport.label.toLowerCase() === key) ??
    null
  );
}

export function findLeague(sport: Sport | null, value: string | null | undefined): League | null {
  if (!sport || !value) return null;
  const key = value.toLowerCase();
  return (
    sport.leagues.find((item) => item.id === key) ??
    sport.leagues.find((item) => item.label.toLowerCase() === key) ??
    null
  );
}

/** League mark, resolved from the league's own domain. */
export function leagueLogoUrl(leagueItem: League, size = 128): string | null {
  if (!leagueItem.domain) return null;
  return `https://www.google.com/s2/favicons?domain=${leagueItem.domain}&sz=${size}`;
}
