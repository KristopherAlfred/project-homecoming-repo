import basketball from "../assets/sports/basketball.jpg";
import football from "../assets/sports/football.jpg";
import baseball from "../assets/sports/baseball.jpg";
import softball from "../assets/sports/softball.jpg";
import soccer from "../assets/sports/soccer.jpg";
import tennis from "../assets/sports/tennis.jpg";
import golf from "../assets/sports/golf.jpg";
import track from "../assets/sports/track.jpg";
import volleyball from "../assets/sports/volleyball.jpg";
import hockey from "../assets/sports/hockey.jpg";
import swimming from "../assets/sports/swimming.jpg";
import gymnastics from "../assets/sports/gymnastics.jpg";
import combat from "../assets/sports/combat.jpg";
import esports from "../assets/sports/esports.jpg";
import other from "../assets/sports/other.jpg";

/**
 * Card artwork + short taglines for the onboarding sport grid. Keyed by the
 * sport ids in `sportsCatalog`.
 */
export const SPORT_PHOTOS: Record<string, string> = {
  basketball,
  football,
  baseball,
  softball,
  soccer,
  tennis,
  golf,
  track,
  volleyball,
  hockey,
  swimming,
  gymnastics,
  combat,
  esports,
  other,
};

export const SPORT_TAGLINES: Record<string, string> = {
  basketball: "Hoops • Court",
  football: "Gridiron • Tackle",
  baseball: "Diamond • Bat",
  softball: "Diamond • Fastpitch",
  soccer: "Futbol • Field",
  tennis: "Singles • Doubles",
  golf: "Course • Stroke",
  track: "Track • Field • Jump",
  volleyball: "Indoor • Beach",
  hockey: "Ice • Puck",
  swimming: "Pool • Open Water",
  gymnastics: "Artistic • Acrobatics",
  combat: "Boxing • MMA • Mats",
  esports: "Competitive Gaming",
  other: "All other sports",
};
