import { supabase } from "../integrations/supabase/client";
import {
  createButtonId,
  normalizeButtons,
  normalizeFeatures,
  normalizeExperienceNav,
  normalizeMemberProof,
  type ExperienceButton,
  type ExperienceConfig,
  type ExperiencePageConfig,
  type ExperienceStageItem,
} from "./experienceConfig";


/** AI design copilot client. Prompts + model calls live in the edge function. */

export type DesignerMessage = { role: "user" | "assistant"; content: string; image?: string };

export type ExperiencePatch = {
  brand?: Record<string, unknown>;
  theme?: Record<string, unknown>;
  effects?: Record<string, unknown>;
  page?: Record<string, unknown>;
  /** Bottom tab bar patch (tabs, colors, visibility) */
  nav?: Record<string, unknown>;
  /** Per-page patches keyed by page id (landing, home, videos, news, docAndGlo, youreIn, settings) */
  pages?: Record<string, Record<string, unknown>>;
  /** Kill every glow/shadow in the app before applying the rest of the patch */
  killGlow?: boolean;
  /** Buttons to append to the target page(s) */
  addButtons?: Partial<ExperienceButton>[];
  /** Remove all extra buttons first */
  clearButtons?: boolean;
};

export type ArtTarget = "backgroundImage" | "heroImage" | "titleImage";

export type DesignerResult = {
  reply: string;
  patch: ExperiencePatch;
  applyToAllPages: boolean;
  imagePrompt: string | null;
  /** Where generated artwork should be placed when imagePrompt is set */
  imageTarget: ArtTarget;
};


function aiError(error: unknown, fallback: string): Error {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  if (/429|rate/i.test(raw)) return new Error("The designer is busy — try again in a moment.");
  if (/402|credit/i.test(raw)) return new Error("AI credits are used up. Add credits to keep designing.");
  return new Error(raw || fallback);
}

/** Only the fields the model is allowed to reason about (keeps the prompt small). */
export function designerConfigSnapshot(
  experience: ExperienceConfig,
  pageKey: keyof ExperienceConfig["pages"],
) {
  const page = experience.pages[pageKey];
  return {
    brand: experience.brand,
    theme: experience.theme,
    effects: experience.effects,
    nav: experience.nav,
    pageKeys: Object.keys(experience.pages),
    page: {
      backgroundColor: page.backgroundColor,
      backgroundGradientFrom: page.backgroundGradientFrom,
      backgroundGradientTo: page.backgroundGradientTo,
      useGradientBg: page.useGradientBg,
      headline: page.headline,
      subhead: page.subhead,
      body: page.body,
      ctaLabel: page.ctaLabel,
      ctaBg: page.ctaBg,
      ctaText: page.ctaText,
      accentColor: page.accentColor,
      effectPreset: page.effectPreset,
      layoutMode: page.layoutMode,
      heroScale: page.heroScale,
      unlockHeadline: page.unlockHeadline,
      unlockBody: page.unlockBody,
      footerLine: page.footerLine,
      extraButtons: page.extraButtons ?? [],
      stage: (page.stage ?? []).map((item) => ({
        id: item.id,
        x: item.x,
        y: item.y,
        w: item.w,
        scale: item.scale,
        hidden: item.hidden,
        glow: item.glow,
        glowIntensity: item.glowIntensity,
      })),
    },
  };
}

export async function askExperienceDesigner(input: {
  instruction: string;
  pageKey: string;
  image?: string | null;
  config: unknown;
  context: unknown;
  history: DesignerMessage[];
}): Promise<DesignerResult> {
  const { data, error } = await supabase.functions.invoke("experience-ai", {
    body: {
      action: "design",
      instruction: input.instruction,
      pageKey: input.pageKey,
      image: input.image ?? undefined,
      config: input.config,
      context: input.context,
      history: input.history.map((m) => ({ role: m.role, content: m.content })),
    },
  });
  if (error) throw aiError(error, "The designer could not respond");
  const payload = data as (DesignerResult & { error?: string }) | null;
  if (payload?.error) throw aiError(new Error(payload.error), "The designer could not respond");
  return {
    reply: payload?.reply ?? "Updated your look.",
    patch: payload?.patch ?? {},
    applyToAllPages: Boolean(payload?.applyToAllPages),
    imagePrompt: payload?.imagePrompt ?? null,
    imageTarget:
      payload?.imageTarget === "heroImage" || payload?.imageTarget === "titleImage"
        ? payload.imageTarget
        : "backgroundImage",

  };
}

export async function generateExperienceArt(prompt: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke("experience-ai", {
    body: { action: "image", prompt },
  });
  if (error) throw aiError(error, "Could not generate the artwork");
  const payload = data as { imageSrc?: string; error?: string };
  if (payload?.error) throw aiError(new Error(payload.error), "Could not generate the artwork");
  if (!payload?.imageSrc) throw new Error("No artwork came back — try again");
  return payload.imageSrc;
}

function mergeStage(
  prev: ExperienceStageItem[],
  incoming: unknown,
): ExperienceStageItem[] {
  if (!Array.isArray(incoming)) return prev;
  const next = prev.map((item) => ({ ...item }));
  for (const raw of incoming) {
    if (!raw || typeof raw !== "object") continue;
    const row = raw as Partial<ExperienceStageItem> & { id?: string };
    if (!row.id) continue;
    const idx = next.findIndex((item) => item.id === row.id);
    if (idx >= 0) next[idx] = { ...next[idx], ...row } as ExperienceStageItem;
  }
  return next;
}

function stripGlow(page: ExperiencePageConfig): ExperiencePageConfig {
  return {
    ...page,
    unlockGlowColor: "transparent",
    effectPreset: page.effectPreset === "glow" || page.effectPreset === "neon" ? "none" : page.effectPreset,
    stage: (page.stage ?? []).map((item) => ({ ...item, glow: false, glowIntensity: 0 })),
    extraButtons: (page.extraButtons ?? []).map((b) => ({ ...b, glow: false })),
  };
}

function applyPagePatch(
  page: ExperiencePageConfig,
  patch: Record<string, unknown> | undefined,
  extras: { clearButtons?: boolean; addButtons?: Partial<ExperienceButton>[] },
): ExperiencePageConfig {
  const raw = { ...(patch ?? {}) } as Partial<ExperiencePageConfig> & {
    stage?: unknown;
    extraButtons?: unknown;
    features?: unknown;
    memberProof?: unknown;
  };
  const stage = mergeStage(page.stage ?? [], raw.stage);
  delete raw.stage;
  let buttons = extras.clearButtons ? [] : page.extraButtons ?? [];
  if (raw.extraButtons !== undefined) {
    buttons = normalizeButtons(raw.extraButtons, buttons);
    delete raw.extraButtons;
  }
  let features = page.features ?? [];
  if (raw.features !== undefined) {
    features = normalizeFeatures(raw.features, features);
    delete raw.features;
  }
  let memberProof = page.memberProof;
  if (raw.memberProof !== undefined) {
    memberProof = normalizeMemberProof(raw.memberProof, memberProof);
    delete raw.memberProof;
  }
  if (extras.addButtons?.length) {
    buttons = [
      ...buttons,
      ...normalizeButtons(extras.addButtons.map((b) => ({ ...b, id: b.id || createButtonId() }))),
    ].slice(0, 8);
  }
  return { ...page, ...raw, stage, extraButtons: buttons, features, memberProof };
}


/** Merge an AI patch into the config, optionally styling every page at once. */
export function applyExperiencePatch(
  prev: ExperienceConfig,
  patch: ExperiencePatch,
  pageKey: keyof ExperienceConfig["pages"],
  applyToAllPages: boolean,
): ExperienceConfig {
  const pageKeys = Object.keys(prev.pages) as (keyof ExperienceConfig["pages"])[];
  const pages = { ...prev.pages };

  if (patch.killGlow) {
    for (const key of pageKeys) pages[key] = stripGlow(pages[key]);
  }

  const targets = applyToAllPages ? pageKeys : [pageKey];
  for (const key of targets) {
    pages[key] = applyPagePatch(pages[key], patch.page, {
      clearButtons: patch.clearButtons,
      addButtons: patch.addButtons,
    });
  }

  for (const [key, pagePatch] of Object.entries(patch.pages ?? {})) {
    if (!(key in pages)) continue;
    const typed = key as keyof ExperienceConfig["pages"];
    pages[typed] = applyPagePatch(pages[typed], pagePatch, {});
  }

  const effects = { ...prev.effects, ...(patch.effects ?? {}) };
  if (patch.killGlow) {
    effects.glow = false;
    effects.glowIntensity = 0;
    effects.shimmer = false;
    if (patch.effects?.glow === true) {
      effects.glow = true;
      effects.glowIntensity = Number(patch.effects.glowIntensity ?? 40);
    }
  }

  const nav = patch.nav
    ? normalizeExperienceNav({ ...prev.nav, ...patch.nav })
    : prev.nav;

  return {
    ...prev,
    nav,
    brand: { ...prev.brand, ...(patch.brand ?? {}) },
    theme: { ...prev.theme, ...(patch.theme ?? {}) },
    effects,
    pages,
  };
}

/** Human summary of what a patch touched, for the chat transcript. */
export function describePatch(patch: ExperiencePatch): string[] {
  const out: string[] = [];
  if (patch.killGlow) out.push("glow: removed everywhere");
  if (patch.nav) out.push("tab bar restyled");
  if (patch.clearButtons) out.push("buttons: cleared");
  if (patch.addButtons?.length) out.push(`buttons: +${patch.addButtons.length}`);
  for (const key of Object.keys(patch.pages ?? {})) out.push(`page ${key} restyled`);
  for (const group of ["brand", "theme", "effects", "page"] as const) {
    const entries = Object.entries(patch[group] ?? {});
    if (entries.length) {
      out.push(`${group}: ${entries.map(([k]) => k).slice(0, 8).join(", ")}`);
    }
  }
  return out;
}
