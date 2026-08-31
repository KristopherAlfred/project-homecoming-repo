import gridiron from "../assets/templates/gridiron.jpg";
import deepEnd from "../assets/templates/deep-end.jpg";
import overtime from "../assets/templates/overtime.jpg";
import titleMode from "../assets/templates/title-mode.jpg";
import waveRyders from "../assets/templates/wave-ryders.jpg";
import speedLab from "../assets/templates/speed-lab.jpg";
import flowState from "../assets/templates/flow-state.jpg";
import trackLife from "../assets/templates/track-life.jpg";
import ironClub from "../assets/templates/iron-club.jpg";
import aceClub from "../assets/templates/ace-club.jpg";
import coldAir from "../assets/templates/cold-air.jpg";
import levelUp from "../assets/templates/level-up.jpg";
import joinTheCircle from "../assets/templates/join-the-circle.jpg";
import innerCircle from "../assets/templates/inner-circle.jpg";
import moveMind from "../assets/templates/move-mind.jpg";
import ownYourPower from "../assets/templates/own-your-power.jpg";
import builtDifferent from "../assets/templates/curry/curry-landing.png.asset.json";
import builtToLead from "../assets/templates/built-to-lead.jpg";
import trustTheVision from "../assets/templates/trust-the-vision.jpg";
import serveReturnRepeat from "../assets/templates/serve-return-repeat.jpg";

/** Hero artwork for each full-layout template, keyed by template id. */
export const TEMPLATE_ART: Record<string, string> = {
  gridiron,
  "deep-end": deepEnd,
  overtime,
  "title-mode": titleMode,
  "wave-ryders": waveRyders,
  "speed-lab": speedLab,
  "flow-state": flowState,
  "track-life": trackLife,
  "iron-club": ironClub,
  "ace-club": aceClub,
  "cold-air": coldAir,
  "level-up": levelUp,
  "join-the-circle": joinTheCircle,
  "inner-circle": innerCircle,
  "move-mind": moveMind,
  "own-your-power": ownYourPower,
  "built-different": builtDifferent.url,
  "built-to-lead": builtToLead,
  "trust-the-vision": trustTheVision,
  "serve-return-repeat": serveReturnRepeat,
};
