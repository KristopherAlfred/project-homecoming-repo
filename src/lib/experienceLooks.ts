import type { ExperiencePatch } from "./experienceAi";

/** One-tap "cool look" decks — full theme + effects + page styling in one click. */
export type ExperienceLook = {
  id: string;
  label: string;
  hint: string;
  swatch: string[];
  patch: ExperiencePatch;
};

function look(
  id: string,
  label: string,
  hint: string,
  accent: string,
  accentHover: string,
  bg: string,
  via: string,
  to: string,
  text: string,
  buttonText: string,
  extras: Partial<ExperiencePatch> = {},
): ExperienceLook {
  return {
    id,
    label,
    hint,
    swatch: [accent, via, bg],
    patch: {
      theme: {
        bg,
        bgGradientFrom: bg,
        bgGradientVia: via,
        bgGradientTo: to,
        useGradientBg: true,
        accent,
        accentHover,
        text,
        buttonBg: accent,
        buttonText,
        ...(extras.theme ?? {}),
      },
      effects: { glowColor: accent, particleColor: accent, ...(extras.effects ?? {}) },
      page: {
        backgroundColor: bg,
        backgroundGradientFrom: bg,
        backgroundGradientTo: to,
        useGradientBg: true,
        accentColor: accent,
        ctaBg: accent,
        ctaText: buttonText,
        ...(extras.page ?? {}),
      },
      brand: { logoColor: accent, taglineColor: accent, ...(extras.brand ?? {}) },
    },
  };
}

/** Replica of the cinematic "Join the Circle" mockup: gradient CTA, feature grid, member proof. */
const circleLook: ExperienceLook = {
  id: "glow-circle",
  label: "Glow Circle",
  hint: "Cinematic join-the-circle layout",
  swatch: ["#7CF3D6", "#C6F24E", "#04070a"],
  patch: {
    theme: {
      bg: "#04070a",
      bgGradientFrom: "#04070a",
      bgGradientVia: "#071318",
      bgGradientTo: "#020406",
      useGradientBg: true,
      accent: "#7CF3D6",
      accentHover: "#A9F8E6",
      text: "#FFFFFF",
      buttonBg: "#7CF3D6",
      buttonText: "#04140f",
      buttonRadius: 999,
    },
    effects: { glow: true, glowIntensity: 35, glowColor: "#7CF3D6", vignette: true, noise: true, noiseOpacity: 10 },
    brand: { logoColor: "#7CF3D6", taglineColor: "rgba(255,255,255,0.6)" },
    page: {
      backgroundColor: "#04070a",
      backgroundGradientFrom: "rgba(4,7,10,0.15)",
      backgroundGradientTo: "#04070a",
      useGradientBg: true,
      accentColor: "#7CF3D6",
      effectPreset: "glass",
      headline: "Join The Circle",
      headlineGradientFrom: "#FFFFFF",
      headlineGradientTo: "#7CF3D6",
      body: "Exclusive drops, early access and behind-the-scenes moments — straight from the tour.",
      ctaLabel: "JOIN THE CIRCLE",
      ctaGradientFrom: "#7CF3D6",
      ctaGradientTo: "#C6F24E",
      ctaGradientAngle: 90,
      ctaRadius: 999,
      ctaShowArrow: true,
      ctaText: "#04140f",
      showMenuButton: true,
      menuButtonColor: "#7CF3D6",
      featureBg: "rgba(255,255,255,0.05)",
      featureBorderColor: "rgba(124,243,214,0.28)",
      featureIconColor: "#7CF3D6",
      featureTextColor: "#FFFFFF",
      featureRadius: 18,
      features: [
        { id: "f1", icon: "star", label: "Exclusive Drops" },
        { id: "f2", icon: "clock", label: "Early Access" },
        { id: "f3", icon: "gift", label: "Member Perks" },
        { id: "f4", icon: "users", label: "The Inner Circle" },
      ],
      memberProof: {
        count: "12,480+",
        label: "Members",
        extraLabel: "+9k",
        avatars: [],
        thumbs: [],
        bg: "rgba(255,255,255,0.05)",
        borderColor: "rgba(255,255,255,0.14)",
        countColor: "#7CF3D6",
        labelColor: "rgba(255,255,255,0.6)",
        radius: 18,
      },
    } as Record<string, unknown>,
  },
};

export const EXPERIENCE_LOOKS: ExperienceLook[] = [
  circleLook,

  look("neon-court", "Neon Court", "Electric arena glow", "#39FF88", "#7CFFB2", "#020604", "#0b2b1c", "#04170f", "#FFFFFF", "#04140c", {
    effects: { glow: true, glowIntensity: 70, shimmer: true, animatedGradient: true, vignette: true },
    page: { effectPreset: "neon" },
    theme: { buttonRadius: 999 },
  }),
  look("midnight-lux", "Midnight Lux", "Black + gold prestige", "#E8C56B", "#F3DFA8", "#050403", "#1a1408", "#0b0904", "#FFFFFF", "#191204", {
    effects: { glow: true, glowIntensity: 40, shimmer: true, glassmorphism: true, noise: true },
    page: { effectPreset: "glow" },
    theme: { buttonRadius: 8 },
  }),
  look("blood-court", "Blood Court", "Red-hot competitor", "#E2231A", "#FF6B60", "#070202", "#2a0806", "#140303", "#FFFFFF", "#FFFFFF", {
    effects: { glow: true, glowIntensity: 60, vignette: true },
    page: { effectPreset: "burst" },
  }),
  look("ice", "Ice", "Cold, clinical, fast", "#7FD8FF", "#B6ECFF", "#03070c", "#0a2233", "#04121c", "#FFFFFF", "#03151f", {
    effects: { glow: true, glowIntensity: 45, blurBackdrop: true, glassmorphism: true },
    page: { effectPreset: "glass" },
  }),
  look("vapor", "Vapor", "Y2K sunset gradient", "#FF6FD8", "#FFA7E7", "#0a0416", "#3a0f4d", "#160a2b", "#FFFFFF", "#20062a", {
    effects: { glow: true, glowIntensity: 65, shimmer: true, animatedGradient: true, particles: true },
    page: { effectPreset: "shimmer" },
    theme: { buttonRadius: 999 },
  }),
  look("carbon", "Carbon", "Stealth performance", "#B9C2CC", "#DCE3EA", "#050506", "#101216", "#08090b", "#FFFFFF", "#0b0d10", {
    effects: { glow: false, noise: true, noiseOpacity: 14, vignette: true, glassmorphism: false },
    page: { effectPreset: "none" },
    theme: { buttonRadius: 6 },
  }),
  look("sunset-run", "Sunset Run", "Warm hype energy", "#FF8A3D", "#FFB067", "#0b0503", "#3a1405", "#1c0902", "#FFFFFF", "#1b0801", {
    effects: { glow: true, glowIntensity: 55, rays: true } as Record<string, unknown>,
    page: { effectPreset: "rays" },
  }),
  look("holo", "Holographic", "Iridescent chrome", "#A9F0FF", "#E4FBFF", "#06060a", "#1d2a4d", "#0b1024", "#FFFFFF", "#071019", {
    effects: { glow: true, glowIntensity: 50, shimmer: true, animatedGradient: true, glassmorphism: true },
    page: { effectPreset: "shimmer" },
  }),
  look("clay", "Clay Court", "Terracotta classic", "#D96B3F", "#EE8C63", "#0c0705", "#33170e", "#180a06", "#FFF6F0", "#1b0902", {
    effects: { glow: true, glowIntensity: 30, noise: true, noiseOpacity: 12 },
    page: { effectPreset: "soft" },
  }),
  look("blackout", "Blackout", "Pure minimal mono", "#FFFFFF", "#E6E6E6", "#000000", "#0a0a0a", "#000000", "#FFFFFF", "#000000", {
    effects: { glow: false, shimmer: false, noise: false, vignette: false, glassmorphism: false },
    page: { effectPreset: "none" },
    theme: { buttonRadius: 0 },
  }),
  look("royal", "Royal", "Deep purple flex", "#A879FF", "#C6A6FF", "#07050f", "#241442", "#100826", "#FFFFFF", "#150826", {
    effects: { glow: true, glowIntensity: 55, particles: true, glassmorphism: true },
    page: { effectPreset: "glow" },
  }),
  look("turf", "Turf", "Field-fresh green", "#8FE3B8", "#B6F2D3", "#040806", "#0d2a1c", "#061510", "#FFFFFF", "#04140c", {
    effects: { glow: true, glowIntensity: 45, blurBackdrop: true },
    page: { effectPreset: "soft" },
  }),
];
