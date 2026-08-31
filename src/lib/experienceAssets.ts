/** Platform-provided marks only — no athlete photos. Athletes upload their own imagery. */

export type ExperienceAsset = {
  id: string;
  label: string;
  src: string;
};

/** Generic AI / illustrated logos athletes can start from (recolorable). */
export const EXPERIENCE_LOGOS: ExperienceAsset[] = [
  {
    id: "ai-crown",
    label: "Crown",
    src: "/experience/logos/logo-ai-crown.png",
  },
  {
    id: "ai-racquet",
    label: "Racquet",
    src: "/experience/logos/logo-ai-racquet.png",
  },
  {
    id: "ai-ball",
    label: "Ball",
    src: "/experience/logos/logo-ai-ball.png",
  },
  {
    id: "ai-glow",
    label: "Glow orb",
    src: "/experience/logos/logo-ai-glow.png",
  },
];

/** @deprecated Athlete photo libraries removed — upload only. */
export const EXPERIENCE_HEROES: ExperienceAsset[] = [];

export type GradientBackgroundPreset = {
  id: string;
  label: string;
  backgroundColor: string;
  backgroundGradientFrom: string;
  backgroundGradientVia: string;
  backgroundGradientTo: string;
  useGradientBg: boolean;
  angle: number;
};

/** Theme + page backgrounds — pure CSS, fully responsive. */
export const GRADIENT_BACKGROUND_PRESETS: GradientBackgroundPreset[] = [
  {
    id: "mint-night",
    label: "Mint night",
    backgroundColor: "#050505",
    backgroundGradientFrom: "#050505",
    backgroundGradientVia: "#0a1a12",
    backgroundGradientTo: "#05140e",
    useGradientBg: true,
    angle: 160,
  },
  {
    id: "court-green",
    label: "Court green",
    backgroundColor: "#04140c",
    backgroundGradientFrom: "#04140c",
    backgroundGradientVia: "#0a2e1c",
    backgroundGradientTo: "#0f3d28",
    useGradientBg: true,
    angle: 145,
  },
  {
    id: "neon-mint",
    label: "Neon mint",
    backgroundColor: "#020806",
    backgroundGradientFrom: "#020806",
    backgroundGradientVia: "#0d3b28",
    backgroundGradientTo: "#8FE3B855",
    useGradientBg: true,
    angle: 180,
  },
  {
    id: "soft-glow",
    label: "Soft glow",
    backgroundColor: "#0b1210",
    backgroundGradientFrom: "#1a2e24",
    backgroundGradientVia: "#0d1814",
    backgroundGradientTo: "#050505",
    useGradientBg: true,
    angle: 200,
  },
  {
    id: "deep-black",
    label: "Deep black",
    backgroundColor: "#000000",
    backgroundGradientFrom: "#000000",
    backgroundGradientVia: "#0a0a0a",
    backgroundGradientTo: "#161616",
    useGradientBg: true,
    angle: 170,
  },
  {
    id: "ink",
    label: "Ink",
    backgroundColor: "#050505",
    backgroundGradientFrom: "#050505",
    backgroundGradientVia: "#050505",
    backgroundGradientTo: "#050505",
    useGradientBg: false,
    angle: 180,
  },
  {
    id: "forest",
    label: "Forest",
    backgroundColor: "#031008",
    backgroundGradientFrom: "#031008",
    backgroundGradientVia: "#0a2818",
    backgroundGradientTo: "#143d28",
    useGradientBg: true,
    angle: 135,
  },
  {
    id: "ice-mint",
    label: "Ice mint",
    backgroundColor: "#071410",
    backgroundGradientFrom: "#0e221c",
    backgroundGradientVia: "#14352c",
    backgroundGradientTo: "#8FE3B833",
    useGradientBg: true,
    angle: 210,
  },
  {
    id: "gold-dusk",
    label: "Gold dusk",
    backgroundColor: "#0a0805",
    backgroundGradientFrom: "#0a0805",
    backgroundGradientVia: "#2a1f0e",
    backgroundGradientTo: "#5c4a22",
    useGradientBg: true,
    angle: 155,
  },
  {
    id: "warm-charcoal",
    label: "Warm charcoal",
    backgroundColor: "#0c0b0a",
    backgroundGradientFrom: "#0c0b0a",
    backgroundGradientVia: "#1a1714",
    backgroundGradientTo: "#2a2420",
    useGradientBg: true,
    angle: 160,
  },
  {
    id: "slate",
    label: "Slate",
    backgroundColor: "#0a0c10",
    backgroundGradientFrom: "#0a0c10",
    backgroundGradientVia: "#141a22",
    backgroundGradientTo: "#1e2836",
    useGradientBg: true,
    angle: 150,
  },
  {
    id: "crimson-night",
    label: "Crimson night",
    backgroundColor: "#0a0406",
    backgroundGradientFrom: "#0a0406",
    backgroundGradientVia: "#2a0c14",
    backgroundGradientTo: "#4a1520",
    useGradientBg: true,
    angle: 165,
  },
  {
    id: "teal-depth",
    label: "Teal depth",
    backgroundColor: "#040c0e",
    backgroundGradientFrom: "#040c0e",
    backgroundGradientVia: "#0a2428",
    backgroundGradientTo: "#0e3a40",
    useGradientBg: true,
    angle: 140,
  },
  {
    id: "spotlight",
    label: "Spotlight",
    backgroundColor: "#050505",
    backgroundGradientFrom: "#1a2a20",
    backgroundGradientVia: "#080808",
    backgroundGradientTo: "#000000",
    useGradientBg: true,
    angle: 0,
  },
  {
    id: "horizon",
    label: "Horizon",
    backgroundColor: "#050505",
    backgroundGradientFrom: "#050505",
    backgroundGradientVia: "#0a1812",
    backgroundGradientTo: "#8FE3B822",
    useGradientBg: true,
    angle: 90,
  },
];

export const BACKGROUND_COLOR_PRESETS = GRADIENT_BACKGROUND_PRESETS;

export const HERO_POSITION_OPTIONS = [
  { id: "right center", label: "Right" },
  { id: "center center", label: "Center" },
  { id: "left center", label: "Left" },
  { id: "right top", label: "Right top" },
  { id: "center top", label: "Center top" },
  { id: "right bottom", label: "Right bottom" },
] as const;
