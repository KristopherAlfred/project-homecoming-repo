import type { ExperiencePageKeyName } from "./experienceConfig";

import curryLandingAsset from "../assets/templates/curry/curry-landing.png.asset.json";
import curryLookingUp from "../assets/templates/curry/looking-up.jpg";
import curryCourtside from "../assets/templates/curry/courtside.jpg";
import curryFamily from "../assets/templates/curry/family.jpg";
import curryDribble from "../assets/templates/curry/dribble.jpg";
import curryTrophy from "../assets/templates/curry/trophy.jpg";
import curryJerseyBack from "../assets/templates/curry/jersey-back.jpg";
import currySuit from "../assets/templates/curry/suit.jpg";
import sloaneCourt from "../assets/sloane-court-editorial.jpg";
import sloaneArrival from "../assets/sloane-arrival-editorial.jpg";
import sloaneServe from "../assets/sloane-serve-editorial.jpg";
import sloaneFoundation from "../assets/sloane-foundation-editorial.jpg";

const curryHero = curryLandingAsset.url;

/**
 * Per-page hero artwork for a template. Each fan-app page can ship its own
 * background photo instead of reusing the landing hero. Everything stays
 * editable in the studio (replace / crop / delete the hero layer).
 */
export const TEMPLATE_PAGE_ART: Record<
  string,
  Partial<Record<ExperiencePageKeyName, string>>
> = {
  "built-different": {
    landing: curryHero,
    youreIn: curryTrophy,
    home: curryHero,
    social: currySuit,
    videos: curryCourtside,
    news: curryLookingUp,
    events: curryDribble,
    live: curryDribble,
    docAndGlo: curryJerseyBack,
    foundation: curryFamily,
    profile: curryTrophy,
  },
  "sloane-stephens": {
    home: sloaneArrival,
    social: sloaneArrival,
    videos: sloaneCourt,
    news: sloaneServe,
    events: sloaneCourt,
    live: sloaneServe,
    docAndGlo: sloaneArrival,
    foundation: sloaneFoundation,
    bio: sloaneArrival,
    profile: sloaneCourt,
    settings: sloaneArrival,
    youreIn: sloaneServe,
  },
};
