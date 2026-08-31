/**
 * Competition levels, team rosters and playing roles used by the onboarding
 * steps. Everything selected here is stored on the athlete row so the dashboard
 * badge, accent colour and metrics follow the athlete's real world context.
 */

import type { LeagueTier } from "./sportsCatalog";

export type Level = {
  id: string;
  label: string;
  hint: string;
  /** Which league tiers this level unlocks on the league step. */
  tiers: LeagueTier[];
};

export const LEVELS: Level[] = [
  {
    id: "professional",
    label: "Professional",
    hint: "Pro leagues & organizations",
    tiers: ["pro"],
  },
  { id: "college", label: "College", hint: "NCAA, NAIA, NJCAA & more", tiers: ["college"] },
  { id: "high-school", label: "High School", hint: "Varsity, JV & prep schools", tiers: ["school"] },
  { id: "club", label: "Club / AAU", hint: "AAU, EYBL, travel teams & clubs", tiers: ["youth"] },
  { id: "youth", label: "Youth", hint: "Youth leagues & organizations", tiers: ["youth"] },
  { id: "semi-pro", label: "Semi-Pro", hint: "Semi-professional leagues", tiers: ["pro", "intl"] },
  {
    id: "international",
    label: "International",
    hint: "International leagues & clubs",
    tiers: ["intl", "pro"],
  },
  {
    id: "independent",
    label: "Independent",
    hint: "Independent teams & athletes",
    tiers: ["pro", "intl", "youth", "school", "college"],
  },
];

export function findLevel(id: string | null | undefined): Level | null {
  if (!id) return null;
  const key = id.toLowerCase();
  return LEVELS.find((level) => level.id === key || level.label.toLowerCase() === key) ?? null;
}

export type Team = {
  id: string;
  label: string;
  location: string;
  /** ESPN team slug used to resolve the crest. */
  abbr?: string;
};

/** ESPN league key per league id, used for team logos. */
const ESPN_LEAGUE: Record<string, string> = {
  nba: "nba",
  wnba: "wnba",
  nfl: "nfl",
  mlb: "mlb",
  nhl: "nhl",
  mls: "soccer",
  nwsl: "soccer",
  epl: "soccer",
};

function team(id: string, label: string, location: string, abbr?: string): Team {
  return { id, label, location, abbr: abbr ?? id };
}

export const LEAGUE_TEAMS: Record<string, Team[]> = {
  nba: [
    team("lal", "Los Angeles Lakers", "Los Angeles, CA"),
    team("gs", "Golden State Warriors", "San Francisco, CA"),
    team("bos", "Boston Celtics", "Boston, MA"),
    team("chi", "Chicago Bulls", "Chicago, IL"),
    team("mia", "Miami Heat", "Miami, FL"),
    team("dal", "Dallas Mavericks", "Dallas, TX"),
    team("nyk", "New York Knicks", "New York, NY", "ny"),
    team("phx", "Phoenix Suns", "Phoenix, AZ"),
    team("den", "Denver Nuggets", "Denver, CO"),
    team("mil", "Milwaukee Bucks", "Milwaukee, WI"),
    team("phi", "Philadelphia 76ers", "Philadelphia, PA"),
    team("okc", "Oklahoma City Thunder", "Oklahoma City, OK"),
    team("atl", "Atlanta Hawks", "Atlanta, GA"),
    team("bkn", "Brooklyn Nets", "Brooklyn, NY"),
    team("cha", "Charlotte Hornets", "Charlotte, NC"),
    team("cle", "Cleveland Cavaliers", "Cleveland, OH"),
    team("det", "Detroit Pistons", "Detroit, MI"),
    team("hou", "Houston Rockets", "Houston, TX"),
    team("ind", "Indiana Pacers", "Indianapolis, IN"),
    team("lac", "LA Clippers", "Los Angeles, CA"),
    team("mem", "Memphis Grizzlies", "Memphis, TN"),
    team("min", "Minnesota Timberwolves", "Minneapolis, MN"),
    team("nop", "New Orleans Pelicans", "New Orleans, LA", "no"),
    team("orl", "Orlando Magic", "Orlando, FL"),
    team("por", "Portland Trail Blazers", "Portland, OR"),
    team("sac", "Sacramento Kings", "Sacramento, CA"),
    team("sas", "San Antonio Spurs", "San Antonio, TX", "sa"),
    team("tor", "Toronto Raptors", "Toronto, ON"),
    team("uta", "Utah Jazz", "Salt Lake City, UT"),
    team("wsh", "Washington Wizards", "Washington, DC"),
  ],
  wnba: [
    team("lv", "Las Vegas Aces", "Las Vegas, NV"),
    team("ny", "New York Liberty", "Brooklyn, NY"),
    team("chi", "Chicago Sky", "Chicago, IL"),
    team("ind", "Indiana Fever", "Indianapolis, IN"),
    team("sea", "Seattle Storm", "Seattle, WA"),
    team("phx", "Phoenix Mercury", "Phoenix, AZ"),
    team("conn", "Connecticut Sun", "Uncasville, CT"),
    team("min", "Minnesota Lynx", "Minneapolis, MN"),
    team("dal", "Dallas Wings", "Arlington, TX"),
    team("atl", "Atlanta Dream", "Atlanta, GA"),
    team("wsh", "Washington Mystics", "Washington, DC"),
    team("la", "Los Angeles Sparks", "Los Angeles, CA"),
  ],
  nfl: [
    team("kc", "Kansas City Chiefs", "Kansas City, MO"),
    team("dal", "Dallas Cowboys", "Arlington, TX"),
    team("sf", "San Francisco 49ers", "Santa Clara, CA"),
    team("phi", "Philadelphia Eagles", "Philadelphia, PA"),
    team("gb", "Green Bay Packers", "Green Bay, WI"),
    team("buf", "Buffalo Bills", "Buffalo, NY"),
    team("bal", "Baltimore Ravens", "Baltimore, MD"),
    team("det", "Detroit Lions", "Detroit, MI"),
    team("mia", "Miami Dolphins", "Miami, FL"),
    team("ne", "New England Patriots", "Foxborough, MA"),
    team("nyj", "New York Jets", "East Rutherford, NJ"),
    team("nyg", "New York Giants", "East Rutherford, NJ"),
    team("pit", "Pittsburgh Steelers", "Pittsburgh, PA"),
    team("cin", "Cincinnati Bengals", "Cincinnati, OH"),
    team("cle", "Cleveland Browns", "Cleveland, OH"),
    team("hou", "Houston Texans", "Houston, TX"),
    team("ten", "Tennessee Titans", "Nashville, TN"),
    team("ind", "Indianapolis Colts", "Indianapolis, IN"),
    team("jax", "Jacksonville Jaguars", "Jacksonville, FL"),
    team("den", "Denver Broncos", "Denver, CO"),
    team("lv", "Las Vegas Raiders", "Las Vegas, NV"),
    team("lac", "Los Angeles Chargers", "Inglewood, CA"),
    team("lar", "Los Angeles Rams", "Inglewood, CA"),
    team("sea", "Seattle Seahawks", "Seattle, WA"),
    team("ari", "Arizona Cardinals", "Glendale, AZ"),
    team("chi", "Chicago Bears", "Chicago, IL"),
    team("min", "Minnesota Vikings", "Minneapolis, MN"),
    team("no", "New Orleans Saints", "New Orleans, LA"),
    team("tb", "Tampa Bay Buccaneers", "Tampa, FL"),
    team("atl", "Atlanta Falcons", "Atlanta, GA"),
    team("car", "Carolina Panthers", "Charlotte, NC"),
    team("wsh", "Washington Commanders", "Landover, MD"),
  ],
  mlb: [
    team("nyy", "New York Yankees", "Bronx, NY"),
    team("lad", "Los Angeles Dodgers", "Los Angeles, CA"),
    team("bos", "Boston Red Sox", "Boston, MA"),
    team("chc", "Chicago Cubs", "Chicago, IL"),
    team("atl", "Atlanta Braves", "Atlanta, GA"),
    team("hou", "Houston Astros", "Houston, TX"),
    team("phi", "Philadelphia Phillies", "Philadelphia, PA"),
    team("sf", "San Francisco Giants", "San Francisco, CA"),
    team("sd", "San Diego Padres", "San Diego, CA"),
    team("nym", "New York Mets", "Queens, NY"),
    team("stl", "St. Louis Cardinals", "St. Louis, MO"),
    team("tex", "Texas Rangers", "Arlington, TX"),
    team("sea", "Seattle Mariners", "Seattle, WA"),
    team("bal", "Baltimore Orioles", "Baltimore, MD"),
    team("tor", "Toronto Blue Jays", "Toronto, ON"),
    team("cle", "Cleveland Guardians", "Cleveland, OH"),
    team("det", "Detroit Tigers", "Detroit, MI"),
    team("min", "Minnesota Twins", "Minneapolis, MN"),
    team("cws", "Chicago White Sox", "Chicago, IL"),
    team("kc", "Kansas City Royals", "Kansas City, MO"),
    team("ari", "Arizona Diamondbacks", "Phoenix, AZ"),
    team("col", "Colorado Rockies", "Denver, CO"),
    team("mil", "Milwaukee Brewers", "Milwaukee, WI"),
    team("cin", "Cincinnati Reds", "Cincinnati, OH"),
    team("pit", "Pittsburgh Pirates", "Pittsburgh, PA"),
    team("mia", "Miami Marlins", "Miami, FL"),
    team("wsh", "Washington Nationals", "Washington, DC"),
    team("tb", "Tampa Bay Rays", "St. Petersburg, FL"),
    team("laa", "Los Angeles Angels", "Anaheim, CA"),
    team("oak", "Athletics", "West Sacramento, CA"),
  ],
  nhl: [
    team("edm", "Edmonton Oilers", "Edmonton, AB"),
    team("tor", "Toronto Maple Leafs", "Toronto, ON"),
    team("fla", "Florida Panthers", "Sunrise, FL"),
    team("col", "Colorado Avalanche", "Denver, CO"),
    team("bos", "Boston Bruins", "Boston, MA"),
    team("nyr", "New York Rangers", "New York, NY"),
    team("vgk", "Vegas Golden Knights", "Las Vegas, NV"),
    team("dal", "Dallas Stars", "Dallas, TX"),
    team("car", "Carolina Hurricanes", "Raleigh, NC"),
    team("tb", "Tampa Bay Lightning", "Tampa, FL"),
    team("det", "Detroit Red Wings", "Detroit, MI"),
    team("chi", "Chicago Blackhawks", "Chicago, IL"),
    team("mtl", "Montreal Canadiens", "Montreal, QC"),
    team("pit", "Pittsburgh Penguins", "Pittsburgh, PA"),
    team("wsh", "Washington Capitals", "Washington, DC"),
    team("njd", "New Jersey Devils", "Newark, NJ"),
    team("lak", "Los Angeles Kings", "Los Angeles, CA"),
    team("van", "Vancouver Canucks", "Vancouver, BC"),
    team("min", "Minnesota Wild", "St. Paul, MN"),
    team("stl", "St. Louis Blues", "St. Louis, MO"),
  ],
  mls: [
    team("mia", "Inter Miami CF", "Fort Lauderdale, FL", "20232"),
    team("lafc", "LAFC", "Los Angeles, CA", "18966"),
    team("laglaxy", "LA Galaxy", "Carson, CA", "187"),
    team("atl", "Atlanta United", "Atlanta, GA", "18418"),
    team("sea", "Seattle Sounders", "Seattle, WA", "9726"),
    team("por", "Portland Timbers", "Portland, OR", "9723"),
    team("nycfc", "New York City FC", "New York, NY", "17606"),
    team("cin", "FC Cincinnati", "Cincinnati, OH", "18267"),
  ],
  nwsl: [
    team("gothamfc", "NJ/NY Gotham FC", "Harrison, NJ", "15360"),
    team("portland", "Portland Thorns FC", "Portland, OR", "15360"),
    team("angelcity", "Angel City FC", "Los Angeles, CA", "22187"),
    team("kc", "Kansas City Current", "Kansas City, MO", "20905"),
    team("orlando", "Orlando Pride", "Orlando, FL", "17346"),
    team("washington", "Washington Spirit", "Washington, DC", "15366"),
  ],
};

/** Rough team counts shown on the league cards. */
export const LEAGUE_TEAM_COUNTS: Record<string, number> = {
  nba: 30,
  wnba: 13,
  gleague: 31,
  nfl: 32,
  mlb: 30,
  milb: 120,
  nhl: 32,
  mls: 30,
  nwsl: 14,
  epl: 20,
  "ncaa-mbb": 362,
  "ncaa-fb": 134,
  "ncaa-bb": 300,
  "ncaa-soccer": 340,
  "ncaa-vb": 340,
  "ncaa-tennis": 260,
};

export function teamsForLeague(leagueId: string | null | undefined): Team[] {
  if (!leagueId) return [];
  return LEAGUE_TEAMS[leagueId] ?? [];
}

export function teamLogoUrl(leagueId: string, teamItem: Team): string | null {
  const key = ESPN_LEAGUE[leagueId];
  if (!key || !teamItem.abbr) return null;
  if (key === "soccer") {
    return `https://a.espncdn.com/i/teamlogos/soccer/500/${teamItem.abbr}.png`;
  }
  return `https://a.espncdn.com/i/teamlogos/${key}/500/${teamItem.abbr}.png`;
}

const GENERIC_ROLES = ["Athlete", "Captain", "Utility", "Other"];

/** Playing roles / positions per sport. */
export const SPORT_ROLES: Record<string, string[]> = {
  basketball: [
    "Point Guard",
    "Shooting Guard",
    "Small Forward",
    "Power Forward",
    "Center",
    "Guard",
    "Forward",
    "Utility",
    "Other",
  ],
  football: [
    "Quarterback",
    "Running Back",
    "Wide Receiver",
    "Tight End",
    "Offensive Line",
    "Defensive Line",
    "Linebacker",
    "Cornerback",
    "Safety",
    "Kicker / Punter",
    "Other",
  ],
  baseball: [
    "Pitcher",
    "Catcher",
    "First Base",
    "Second Base",
    "Third Base",
    "Shortstop",
    "Outfield",
    "Designated Hitter",
    "Other",
  ],
  softball: [
    "Pitcher",
    "Catcher",
    "Infield",
    "Outfield",
    "Utility",
    "Designated Player",
    "Other",
  ],
  soccer: [
    "Goalkeeper",
    "Center Back",
    "Full Back",
    "Midfielder",
    "Winger",
    "Striker",
    "Forward",
    "Other",
  ],
  tennis: ["Singles", "Doubles", "Singles & Doubles", "Other"],
  golf: ["Professional", "Amateur", "Collegiate", "Junior", "Other"],
  track: [
    "Sprints",
    "Middle Distance",
    "Distance",
    "Hurdles",
    "Jumps",
    "Throws",
    "Multi-Event",
    "Relay",
    "Other",
  ],
  volleyball: [
    "Outside Hitter",
    "Opposite",
    "Setter",
    "Middle Blocker",
    "Libero",
    "Defensive Specialist",
    "Beach",
    "Other",
  ],
  hockey: ["Center", "Left Wing", "Right Wing", "Defense", "Goaltender", "Other"],
  swimming: ["Freestyle", "Backstroke", "Breaststroke", "Butterfly", "IM", "Distance", "Relay", "Other"],
  gymnastics: ["All-Around", "Vault", "Bars", "Beam", "Floor", "Pommel / Rings", "Other"],
  combat: [
    "Boxer",
    "MMA Fighter",
    "Wrestler",
    "Jiu-Jitsu",
    "Muay Thai",
    "Judo",
    "Other",
  ],
  esports: ["Duelist", "Support", "Tank", "IGL / Captain", "Jungler", "Mid", "Streamer", "Other"],
  other: GENERIC_ROLES,
};

export function rolesForSport(sportId: string | null | undefined): string[] {
  if (!sportId) return GENERIC_ROLES;
  return SPORT_ROLES[sportId] ?? GENERIC_ROLES;
}
